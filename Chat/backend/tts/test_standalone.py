import os
import torch
from TTS.api import TTS

try:
    print("⏳ Carregando XTTS para teste isolado...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"🔧 Device: {device}")
    
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
    
    ref_path = "reference.wav"
    if not os.path.exists(ref_path):
        print("❌ ERRO: reference.wav não encontrado!")
        exit(1)
        
    print(f"📄 Usando referência: {ref_path}")
    
    print("🔊 Gerando áudio de teste...")
    tts.tts_to_file(
        text="Olá! Se você está ouvindo isso, o áudio de referência funcionou perfeitamente.",
        file_path="teste_resultado.wav",
        speaker_wav=ref_path,
        language="pt"
    )
    
    print("✅ SUCESSO! Áudio gerado em 'teste_resultado.wav'")

except Exception as e:
    print(f"❌ FALHA NO TESTE: {e}")
