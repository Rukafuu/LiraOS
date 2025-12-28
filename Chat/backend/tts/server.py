import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
import torch
from TTS.api import TTS

# Inicializa API
app = FastAPI(title="LiraOS XTTS Local Server")

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuração do Modelo
MODEL_NAME = "tts_models/multilingual/multi-dataset/xtts_v2"
# Configuração do Modelo
MODEL_NAME = "tts_models/multilingual/multi-dataset/xtts_v2"
device = "cuda" if torch.cuda.is_available() else "cpu"
# device = "cpu" # 🔒 Removendo trava de CPU

print(f"🚀 Iniciando XTTS v2 no dispositivo: {device}")
try:
    tts = TTS(MODEL_NAME).to(device)
except Exception as e:
    print(f"❌ Falha ao carregar na GPU ({e}). Usando CPU.")
    device = "cpu"
    tts = TTS(MODEL_NAME).to(device)

# 🔥 Pre-warming e Cache de Latents
print("🔥 Pré-aquecendo modelo XTTS...")
cached_latents = None
cached_speaker_path = None

try:
    # Encontra reference.wav
    ref_path = os.path.join(os.getcwd(), "reference.wav")
    if not os.path.exists(ref_path):
        wavs = [f for f in os.listdir('.') if f.endswith('.wav')]
        ref_path = os.path.join(os.getcwd(), wavs[0]) if wavs else None
    
    if ref_path:
        # Pre-warm com texto curto e cache latents
        xtts_model = tts.synthesizer.tts_model
        cached_latents = xtts_model.get_conditioning_latents(audio_path=[ref_path])
        cached_speaker_path = ref_path
        
        # Gera áudio de teste para aquecer GPU/CPU
        # _ = list(xtts_model.inference_stream(
        #     text="Olá",
        #     language="pt",
        #     gpt_cond_latent=cached_latents[0],
        #     speaker_embedding=cached_latents[1],
        #     temperature=0.65,
        #     repetition_penalty=2.5,
        #     speed=1.0,
        #     enable_text_splitting=False
        # ))
        #     repetition_penalty=2.5,
        #     speed=1.0,
        #     enable_text_splitting=True
        # ))
        print(f"✅ Modelo aquecido e pronto! Cache ativo para: {os.path.basename(ref_path)}")
    else:
        print("⚠️ Nenhum arquivo .wav encontrado para pré-aquecimento")
except Exception as e:
    print(f"⚠️ Erro no pré-aquecimento (não crítico): {e}")

class TTSRequest(BaseModel):
    text: str
    language: str = "pt"
    speaker_wav: str = "reference.wav"
    temperature: float = 0.70 # Slightly higher for more expression
    speed: float = 1.0  # Normal speed for better pauses
    repetition_penalty: float = 2.0

@app.get("/health")
def health():
    return {"status": "ok", "device": device}

import struct

# ... imports ...

@app.post("/tts")
def generate_speech(req: TTSRequest):
    global cached_latents, cached_speaker_path
    try:
        # Verifica referência de voz
        speaker_path = os.path.join(os.getcwd(), req.speaker_wav)
        if not os.path.exists(speaker_path):
            wavs = [f for f in os.listdir('.') if f.endswith('.wav')]
            speaker_path = os.path.join(os.getcwd(), wavs[0]) if wavs else None
            if not speaker_path:
                return Response(content="Erro: reference.wav não encontrado.", status_code=400)

        # Usa cache de latents se disponível e mesmo arquivo
        xtts_model = tts.synthesizer.tts_model
        if cached_latents and cached_speaker_path == speaker_path:
            gpt_cond_latent, speaker_embedding = cached_latents
        else:
            # Recalcula e atualiza cache
            gpt_cond_latent, speaker_embedding = xtts_model.get_conditioning_latents(audio_path=[speaker_path])
            cached_latents = (gpt_cond_latent, speaker_embedding)
            cached_speaker_path = speaker_path
        
        # Generator: WAV Header + Audio Chunks
        def audio_stream_generator():
            if device == "cuda":
                torch.cuda.empty_cache()

            # 1. WAV HEADER (44 bytes) for 24000Hz, 16bit, Mono
            MAX_INT32 = 2147483647
            header = b'RIFF' + struct.pack('<I', MAX_INT32) + b'WAVE' + \
                     b'fmt ' + struct.pack('<I', 16) + struct.pack('<H', 1) + struct.pack('<H', 1) + \
                     struct.pack('<I', 24000) + struct.pack('<I', 24000 * 2) + struct.pack('<H', 2) + struct.pack('<H', 16) + \
                     b'data' + struct.pack('<I', MAX_INT32)
            yield header

            # 2. INFERENCE STREAM
            chunks = xtts_model.inference_stream(
                text=req.text,
                language=req.language,
                gpt_cond_latent=gpt_cond_latent,
                speaker_embedding=speaker_embedding,
                temperature=req.temperature,
                repetition_penalty=req.repetition_penalty,
                speed=req.speed,
                enable_text_splitting=True
            )
            
            for chunk in chunks:
                chunk = chunk.cpu().numpy()
                chunk = (chunk * 32767).astype("int16")
                yield chunk.tobytes()

            # 3. SILENCE PADDING (500ms) to prevent cutoff
            # 24000 Hz * 0.5s = 12000 samples
            silence = (torch.zeros(12000) * 32767).numpy().astype("int16")
            yield silence.tobytes()

        return StreamingResponse(audio_stream_generator(), media_type="audio/wav")

    except Exception as e:
        print(f"Erro na geração: {e}")
        return Response(content=str(e), status_code=500)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5002)
