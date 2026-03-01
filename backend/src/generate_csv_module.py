from pathlib import Path
from typing import Dict, List

import pandas as pd


def ensure_generated_csv(config: Dict) -> Path:
    generated_csv_dir = Path(config["generated_csv_dir"])
    generated_csv_dir.mkdir(parents=True, exist_ok=True)
    strict_requested_csv = bool(config.get("strict_requested_csv", False))

    requested_path = generated_csv_dir / config["requested_csv_name"]
    if requested_path.exists():
        return requested_path

    if strict_requested_csv:
        model_marker = Path(config["model_weights_dir"]) / config["model_wt_filename"]
        if not model_marker.exists():
            raise FileNotFoundError(
                f"Requested artifact '{requested_path.name}' not found and model marker is missing at "
                f"'{model_marker}'."
            )

        generate_csv_from_model_weights(config, requested_path)

        if not requested_path.exists():
            raise RuntimeError(f"Generation completed but output CSV was not created: {requested_path}")

        return requested_path

    default_path = generated_csv_dir / config["default_artifact_csv_name"]
    if default_path.exists():
        return default_path

    available_csv = sorted(generated_csv_dir.glob("*.csv"))
    if available_csv:
        return available_csv[0]

    model_marker = Path(config["model_weights_dir"]) / config["model_wt_filename"]
    if not model_marker.exists():
        raise FileNotFoundError(
            "No generated CSV artifact found and model weight marker is missing. "
            "Place artifacts in assets/artifacts/generated_csv or run finetuning first."
        )

    generate_csv_from_model_weights(config, requested_path)

    if not requested_path.exists():
        raise RuntimeError(f"Generation completed but output CSV was not created: {requested_path}")

    return requested_path


def parse_row_text(text: str, columns: List[str]) -> Dict[str, str]:
    row = {column: None for column in columns}
    chunks = [piece.strip() for piece in text.split("|")]
    for chunk in chunks:
        if ":" not in chunk:
            continue
        key, value = chunk.split(":", 1)
        key = key.strip()
        if key in row:
            row[key] = value.strip()
    return row


def generate_csv_from_model_weights(config: Dict, output_csv_path: Path) -> None:
    try:
        import torch
        from peft import PeftModel
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
    except ImportError as exc:
        raise RuntimeError(
            "Generation dependencies are missing. Install torch, transformers, and peft "
            "if you want runtime generation."
        ) from exc

    input_csv_path = Path(config["csv_path"])
    if not input_csv_path.exists():
        raise FileNotFoundError(f"Input CSV not found for generation: {input_csv_path}")

    real_df = pd.read_csv(input_csv_path)
    if real_df.empty:
        raise ValueError(f"Input CSV has no rows for generation: {input_csv_path}")

    columns = list(real_df.columns)
    n_out = config["n_generate"] if config["n_generate"] is not None else len(real_df)

    weights_dir = Path(config["model_weights_dir"])
    adapter_config_path = weights_dir / "adapter_config.json"
    if not adapter_config_path.exists():
        raise FileNotFoundError(
            f"LoRA adapter files not found in '{weights_dir}'. "
            "Expected 'adapter_config.json' for runtime generation."
        )

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    tokenizer = AutoTokenizer.from_pretrained(config["model_name"])
    base_model = AutoModelForSeq2SeqLM.from_pretrained(config["model_name"])
    model = PeftModel.from_pretrained(base_model, str(weights_dir))
    model.to(device)
    model.eval()

    generated_texts = []
    physical_batch_size = int(config["physical_batch_size"])

    for start_idx in range(0, n_out, physical_batch_size):
        batch_size = min(physical_batch_size, n_out - start_idx)
        prompts = [config["prompt"]] * batch_size
        inputs = tokenizer(
            prompts,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=config["max_input_len"],
        ).to(device)

        with torch.no_grad():
            generated_ids = model.generate(
                **inputs,
                do_sample=True,
                temperature=config["temperature"],
                top_p=config["top_p"],
                max_new_tokens=config["max_new_tokens"],
            )

        batch_texts = tokenizer.batch_decode(generated_ids, skip_special_tokens=True)
        generated_texts.extend(batch_texts)

    synthetic_rows = [parse_row_text(text, columns) for text in generated_texts]
    synth_df = pd.DataFrame(synthetic_rows, columns=columns)

    for column in real_df.columns:
        if column in synth_df.columns and pd.api.types.is_numeric_dtype(real_df[column]):
            synth_df[column] = pd.to_numeric(synth_df[column], errors="coerce")

    output_csv_path.parent.mkdir(parents=True, exist_ok=True)
    synth_df.to_csv(output_csv_path, index=False)
