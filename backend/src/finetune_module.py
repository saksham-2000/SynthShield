import gc
import random
import time
import warnings
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

import pandas as pd

# Keep logs clean during demo runs.
warnings.filterwarnings("ignore")


def ensure_model_weights(config: Dict) -> Path:
    weights_dir = Path(config["model_weights_dir"])
    marker_path = weights_dir / config["model_wt_filename"]
    weights_dir.mkdir(parents=True, exist_ok=True)

    # Fast path for hackathon/demo: skip finetuning when marker already exists.
    if marker_path.exists():
        return marker_path

    train_private_lora(config)

    if not marker_path.exists():
        marker_path.write_text(
            f"status=ready\nupdated_at_utc={datetime.now(timezone.utc).isoformat()}\n",
            encoding="utf-8",
        )

    return marker_path


def train_private_lora(config: Dict) -> None:
    try:
        import numpy as np
        import torch
        from opacus import PrivacyEngine
        from opacus.accountants.utils import get_noise_multiplier
        from opacus.utils.batch_memory_manager import BatchMemoryManager
        from peft import LoraConfig, TaskType, get_peft_model
        from torch.utils.data import DataLoader, Dataset
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
        from tqdm.auto import tqdm
    except ImportError as exc:
        raise RuntimeError(
            "Finetuning dependencies are missing. Install torch, transformers, peft, opacus, numpy, and tqdm "
            "if you want runtime training."
        ) from exc

    def print_gpu_status() -> None:
        if torch.cuda.is_available():
            vram_allocated = torch.cuda.memory_allocated() / 1024**3
            vram_reserved = torch.cuda.memory_reserved() / 1024**3
            print(f"[GPU] Device: {torch.cuda.get_device_name(0)}")
            print(f"[GPU] VRAM allocated: {vram_allocated:.2f} GB | reserved: {vram_reserved:.2f} GB")
        else:
            print("[GPU] Running on CPU.")

    def set_seed(seed: int) -> None:
        random.seed(seed)
        np.random.seed(seed)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)

    def stringify_value(value) -> str:
        if pd.isna(value):
            return "MISSING"
        if isinstance(value, (float, np.floating)):
            if not np.isfinite(value):
                return "MISSING"
            return f"{float(value):.6g}"
        return str(value).replace("\n", " ").strip()

    def serialize_row(row: pd.Series, columns: List[str]) -> str:
        return " | ".join(f"{column}: {stringify_value(row[column])}" for column in columns)

    class TabularTextDataset(Dataset):
        def __init__(
            self,
            row_texts: List[str],
            tokenizer: AutoTokenizer,
            prompt: str,
            max_input_len: int,
            max_target_len: int,
        ):
            self.row_texts = row_texts
            self.tokenizer = tokenizer
            enc_prompt = tokenizer(
                prompt,
                truncation=True,
                max_length=max_input_len,
                padding="max_length",
                return_tensors="pt",
            )
            self.prompt_ids = enc_prompt["input_ids"].squeeze(0)
            self.prompt_mask = enc_prompt["attention_mask"].squeeze(0)
            self.max_target_len = max_target_len

        def __len__(self):
            return len(self.row_texts)

        def __getitem__(self, idx):
            target = self.row_texts[idx]
            target_tok = self.tokenizer(
                target,
                truncation=True,
                max_length=self.max_target_len,
                padding="max_length",
                return_tensors="pt",
            )
            labels = target_tok["input_ids"].squeeze(0)
            labels[labels == self.tokenizer.pad_token_id] = -100
            return {
                "input_ids": self.prompt_ids.clone(),
                "attention_mask": self.prompt_mask.clone(),
                "labels": labels,
            }

    set_seed(config["seed"])

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Finetune] Device: {device}")

    input_csv_path = Path(config["csv_path"])
    if not input_csv_path.exists():
        raise FileNotFoundError(f"Training input CSV not found: {input_csv_path}")

    real_df = pd.read_csv(input_csv_path)
    if real_df.empty:
        raise ValueError(f"Training input CSV has no rows: {input_csv_path}")

    columns = list(real_df.columns)
    row_texts = [serialize_row(real_df.iloc[i], columns) for i in range(len(real_df))]

    tokenizer = AutoTokenizer.from_pretrained(config["model_name"])
    model = AutoModelForSeq2SeqLM.from_pretrained(config["model_name"])

    lora_config = LoraConfig(
        r=8,
        lora_alpha=16,
        lora_dropout=0.05,
        bias="none",
        task_type=TaskType.SEQ_2_SEQ_LM,
        target_modules=["q", "v"],
    )
    model = get_peft_model(model, lora_config)
    model.to(device)
    model.train()

    dataset = TabularTextDataset(
        row_texts=row_texts,
        tokenizer=tokenizer,
        prompt=config["prompt"],
        max_input_len=config["max_input_len"],
        max_target_len=config["max_target_len"],
    )

    base_loader = DataLoader(
        dataset,
        batch_size=config["logical_batch_size"],
        shuffle=True,
        drop_last=True,
        pin_memory=True if device.type == "cuda" else False,
    )

    optimizer = torch.optim.AdamW(
        (parameter for parameter in model.parameters() if parameter.requires_grad),
        lr=config["lr"],
    )

    sample_rate = config["logical_batch_size"] / len(dataset)
    noise_multiplier = get_noise_multiplier(
        target_epsilon=config["target_epsilon"],
        target_delta=config["delta"],
        sample_rate=sample_rate,
        epochs=config["epochs"],
        accountant="rdp",
    )

    print(
        f"[Finetune] epsilon={config['target_epsilon']} "
        f"delta={config['delta']} noise={noise_multiplier:.4f}"
    )

    privacy_engine = PrivacyEngine(accountant="rdp")
    model, optimizer, private_loader = privacy_engine.make_private(
        module=model,
        optimizer=optimizer,
        data_loader=base_loader,
        noise_multiplier=noise_multiplier,
        max_grad_norm=config["max_grad_norm"],
        poisson_sampling=True,
    )

    started_at = time.time()
    for epoch in range(config["epochs"]):
        losses = []
        epoch_started_at = time.time()

        with BatchMemoryManager(
            data_loader=private_loader,
            max_physical_batch_size=config["physical_batch_size"],
            optimizer=optimizer,
        ) as safe_loader:
            progress = tqdm(
                safe_loader,
                desc=f"Epoch {epoch + 1}/{config['epochs']}",
                leave=True,
            )
            for batch in progress:
                batch = {key: value.to(device) for key, value in batch.items()}
                optimizer.zero_grad()
                output = model(**batch)
                loss = output.loss
                loss.backward()
                optimizer.step()

                loss_value = loss.detach().item()
                losses.append(loss_value)
                progress.set_postfix({"loss": f"{loss_value:.4f}"})

        average_loss = float(np.mean(losses)) if losses else float("nan")
        epsilon_now = privacy_engine.get_epsilon(delta=config["delta"])
        epoch_duration = time.time() - epoch_started_at
        print(
            f"[Finetune] epoch={epoch + 1} "
            f"loss={average_loss:.4f} epsilon={epsilon_now:.3f} time_s={epoch_duration:.1f}"
        )
        print_gpu_status()

    total_duration = time.time() - started_at
    print(f"[Finetune] Completed in {total_duration / 60:.2f} minutes.")

    weights_dir = Path(config["model_weights_dir"])
    marker_path = weights_dir / config["model_wt_filename"]
    weights_dir.mkdir(parents=True, exist_ok=True)

    trainable_model = model._module if hasattr(model, "_module") else model
    trainable_model.save_pretrained(str(weights_dir))
    tokenizer.save_pretrained(str(weights_dir))

    marker_path.write_text(
        f"status=ready\nupdated_at_utc={datetime.now(timezone.utc).isoformat()}\n",
        encoding="utf-8",
    )

    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        gc.collect()
