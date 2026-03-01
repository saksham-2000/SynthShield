import os
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from src.finetune_module import ensure_model_weights
from src.generate_csv_module import ensure_generated_csv

app = FastAPI(title="Hackathon T5 Processor")
PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
PIPELINE_ARTIFACTS_DIR = ASSETS_DIR / "artifacts"
TRAINING_DATA_DIR = ASSETS_DIR / "training_data"
# Offline finetuning module should dump adapter/model files here.
MODEL_WEIGHTS_DIR = PIPELINE_ARTIFACTS_DIR / "model_weights" / "t5-small-lora"
# Offline generation module should dump final CSV files here.
GENERATED_CSV_DIR = PIPELINE_ARTIFACTS_DIR / "generated_csv"
DEFAULT_ARTIFACT_CSV_NAME = os.getenv("DEFAULT_ARTIFACT_CSV_NAME", "healthcare_dataset_dp.csv")
MODEL_WT_FILENAME = os.getenv("MODEL_WT_FILENAME", "healthcare_dataset.model_ready.marker")
MODEL_NAME = os.getenv("MODEL_NAME", "t5-small")
TRAINING_INPUT_CSV_NAME = os.getenv("TRAINING_INPUT_CSV_NAME", "healthcare_dataset.csv")

raw_allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [origin.strip() for origin in raw_allowed_origins.split(",") if origin.strip()]
if not allowed_origins:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def prepare_artifact_layout() -> None:
    # API serving path must stay lightweight.
    # We only ensure pipeline artifact directories exist; no training runs here.
    MODEL_WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)
    GENERATED_CSV_DIR.mkdir(parents=True, exist_ok=True)
    TRAINING_DATA_DIR.mkdir(parents=True, exist_ok=True)


def resolve_requested_csv_name(upload_filename: Optional[str]) -> str:
    if not upload_filename:
        return DEFAULT_ARTIFACT_CSV_NAME

    safe_name = Path(upload_filename).name.strip()
    if not safe_name:
        return DEFAULT_ARTIFACT_CSV_NAME

    stem = Path(safe_name).stem
    if not stem.endswith("_dp"):
        stem = f"{stem}_dp"
    return f"{stem}.csv"


def build_pipeline_config(requested_csv_name: str, strict_requested_csv: bool) -> dict:
    return {
        "csv_path": str(TRAINING_DATA_DIR / TRAINING_INPUT_CSV_NAME),
        "out_csv": str(GENERATED_CSV_DIR / requested_csv_name),
        "requested_csv_name": requested_csv_name,
        "strict_requested_csv": strict_requested_csv,
        "default_artifact_csv_name": DEFAULT_ARTIFACT_CSV_NAME,
        "generated_csv_dir": str(GENERATED_CSV_DIR),
        "model_weights_dir": str(MODEL_WEIGHTS_DIR),
        "model_wt_filename": MODEL_WT_FILENAME,
        "model_name": MODEL_NAME,
        "prompt": "Generate one realistic synthetic patient row:",
        "target_epsilon": 4.0,
        "delta": 1e-5,
        "epochs": 5,
        "logical_batch_size": 64,
        "physical_batch_size": 16,
        "max_grad_norm": 1.0,
        "lr": 5e-4,
        "max_input_len": 64,
        "max_target_len": 256,
        "n_generate": None,
        "temperature": 0.9,
        "top_p": 0.95,
        "max_new_tokens": 160,
        "seed": 42,
    }


@app.post("/process")
async def process_file(file: UploadFile | None = File(default=None)) -> FileResponse:
    # Upload is accepted for compatibility with existing clients,
    # and upload filename can map to an existing artifact CSV.
    upload_filename = file.filename if file is not None else None
    if file is not None:
        await file.close()

    requested_csv_name = resolve_requested_csv_name(upload_filename)
    strict_requested_csv = bool(upload_filename and Path(upload_filename).name.strip())
    pipeline_config = build_pipeline_config(requested_csv_name, strict_requested_csv)

    try:
        ensure_model_weights(pipeline_config)
        artifact_csv_path = ensure_generated_csv(pipeline_config)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {exc}") from exc

    return FileResponse(
        path=str(artifact_csv_path),
        media_type="text/csv",
        filename=artifact_csv_path.name,
        status_code=200,
    )
