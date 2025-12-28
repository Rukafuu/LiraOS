print("--- CHECKING PYTHON DEPENDENCIES ---")
try:
    print("[1/4] Importing os/sys...")
    import os
    import sys
    
    print("[2/4] Importing torch (Heavy)...")
    import torch
    print(f"      ✅ Torch: {torch.__version__}")
    print(f"      ✅ CUDA Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"      ✅ GPU: {torch.cuda.get_device_name(0)}")
    else:
        print("      ⚠️ GPU NOT DETECTED (Will be slow)")
        
    print("[3/4] Importing TTS (Very Heavy)...")
    from TTS.api import TTS
    print("      ✅ TTS Imported successfully")
    
    print("[4/4] Imports OK. Ready to launch server.")
    
except Exception as e:
    print(f"\n❌ FATAL IMPORT ERROR: {e}")
    print("Possível solução: Tente reinstalar as dependências.")
    input("Pressione Enter para sair...")
    sys.exit(1)
