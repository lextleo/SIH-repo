import os
import shutil
import uuid
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.engine import process_satellite_tile

app = FastAPI(title="DepthWizard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
STATIC_MODELS_DIR = os.path.join(BASE_DIR, "static", "models")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(STATIC_MODELS_DIR, exist_ok=True)

app.mount("/static/models", StaticFiles(directory=STATIC_MODELS_DIR), name="static_models")

@app.post("/api/v1/process-terrain")
async def process_terrain_endpoint(
    image: UploadFile = File(...),
    min_elev: float = Form(10.0),
    max_elev: float = Form(150.0),
):
    task_id = str(uuid.uuid4())[:8]
    input_path = os.path.join(UPLOAD_DIR, f"{task_id}_{image.filename}")
    output_glb_name = f"terrain_{task_id}.glb"
    output_glb_path = os.path.join(STATIC_MODELS_DIR, output_glb_name)

    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    # Run the optimized engine
    stats = process_satellite_tile(input_path, min_elev, max_elev, output_glb_path)

    return {
        "status": "success",
        "model_url": f"/static/models/{output_glb_name}",
        "telemetry": stats,
    }