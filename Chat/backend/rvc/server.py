import os
import uvicorn
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import asyncio
from concurrent.futures import ThreadPoolExecutor
import traceback

# Import RVC
try:
    from rvc_python.infer import infer_file
    RVC_AVAILABLE = True
except ImportError:
    RVC_AVAILABLE = False
    print("WARNING: rvc-python not installed. Inference will fail. Please run 'pip install rvc-python'")

# Setup FastAPI
app = FastAPI(title="LiraOS RVC Server (Singing Module)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
TEMP_DIR = os.path.join(BASE_DIR, "temp")
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# Executor for blocking RVC calls
executor = ThreadPoolExecutor(max_workers=1)

@app.get("/health")
def health():
    return {"status": "ok", "service": "rvc-singing", "rvc_available": RVC_AVAILABLE}

@app.get("/models")
def list_models():
    """List available identity models (.pth files)"""
    if not os.path.exists(MODELS_DIR):
        return {"models": []}
    models = [f for f in os.listdir(MODELS_DIR) if f.endswith(".pth")]
    return {"models": models}

@app.post("/convert")
async def convert_voice(
    file: UploadFile = File(...),
    model_name: str = Form(...),
    f0_up_key: int = Form(0), # Pitch shift (semitones)
    f0_method: str = Form("rmvpe"),
    index_rate: float = Form(0.66),
    filter_radius: int = Form(3),
    resample_sr: int = Form(0),
    rms_mix_rate: float = Form(0.25),
    protect: float = Form(0.33)
):
    """
    Receives an audio file (vocals), converts it using the specified model, and returns the result.
    """
    if not RVC_AVAILABLE:
        return JSONResponse(status_code=500, content={"error": "rvc-python library not found on server."})

    try:
        # 1. Save uploaded file
        input_filename = f"input_{file.filename}"
        input_path = os.path.join(TEMP_DIR, input_filename)
        
        # Clean up temp dir if too full (optional simple check)
        # ...

        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print(f"🎤 Received audio: {input_filename} | Model: {model_name} | Pitch: {f0_up_key}")

        # 2. Validate Model
        model_path = os.path.join(MODELS_DIR, model_name)
        if not os.path.exists(model_path):
            raise HTTPException(status_code=404, detail=f"Model not found. Please upload .pth to backend/rvc/models/")

        # 3. Look for Index file (optional - matches basename)
        index_path = None
        model_basename = os.path.splitext(model_name)[0]
        # Try to find a corresponding index file
        for f in os.listdir(MODELS_DIR):
            if f.endswith(".index") and model_basename in f:
                index_path = os.path.join(MODELS_DIR, f)
                print(f"   Found index file: {f}")
                break
        
        output_filename = f"out_{file.filename}"
        output_path = os.path.join(TEMP_DIR, output_filename)

        # 4. RUN INFERENCE
        def run_rvc():
            print("   > Starting Inference...")
            infer_file(
                input_path=input_path,
                model_path=model_path,
                index_path=index_path, 
                device="cuda:0", # Force CUDA for performance
                f0_method=f0_method,
                f0_up_key=f0_up_key,
                opt_path=output_path,
                index_rate=index_rate,
                filter_radius=filter_radius,
                resample_sr=resample_sr,
                rms_mix_rate=rms_mix_rate,
                protect=protect,
                version="v2" # Default to v2 usually
            )
            print("   > Inference Complete.")

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(executor, run_rvc)

        if not os.path.exists(output_path):
            raise Exception("Output file was not created. Check server logs.")
        
        return FileResponse(output_path, media_type="audio/wav", filename=f"lira_cover_{file.filename}")

    except Exception as e:
        print(f"❌ RVC Error: {e}")
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__ == "__main__":
    print(f"🎵 LiraOS RVC Server running on port 5003")
    print(f"📂 Drop your .pth models in: {MODELS_DIR}")
    uvicorn.run(app, host="0.0.0.0", port=5003)
