import os
import shutil
import uuid
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.engine import run_depth_inference, calibrate_to_metric_dem, export_terrain_glb

app = FastAPI(title="DepthWizard API")

# Allow browser to communicate with API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
STATIC_MODELS_DIR = os.path.join(BASE_DIR, "static", "models")
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(STATIC_MODELS_DIR, exist_ok=True)

# Mount models folder so browser can download the .glb
app.mount("/static/models", StaticFiles(directory=STATIC_MODELS_DIR), name="static_models")

@app.post("/api/v1/process-terrain")
async def process_terrain_endpoint(
    image: UploadFile = File(...),
    min_elev: float = Form(250.0),
    max_elev: float = Form(1200.0),
):
    task_id = str(uuid.uuid4())[:8]
    input_path = os.path.join(UPLOAD_DIR, f"{task_id}_{image.filename}")

    # 1. Save uploaded image
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    # 2. Run AI Inference
    norm_depth = run_depth_inference(input_path)

    # 3. Calibrate to Meters
    calibrated_dem, stats = calibrate_to_metric_dem(norm_depth, min_elev, max_elev)

    # 4. Export 3D Mesh
    output_glb_name = f"terrain_{task_id}.glb"
    output_glb_path = os.path.join(STATIC_MODELS_DIR, output_glb_name)
    export_terrain_glb(calibrated_dem, input_path, output_glb_path)

    return {
        "status": "success",
        "model_url": f"/static/models/{output_glb_name}",
        "telemetry": stats,
    }

# Serve the HTML frontend
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend_app")