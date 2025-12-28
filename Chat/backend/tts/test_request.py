import requests

try:
    print("Testing TTS Server at http://localhost:5002/tts...")
    res = requests.post("http://localhost:5002/tts", json={
        "text": "Olá, isto é um teste de áudio.",
        "language": "pt"
    }, stream=True)
    
    if res.status_code == 200:
        with open("test_output.wav", "wb") as f:
            for chunk in res.iter_content(chunk_size=1024):
                if chunk:
                    f.write(chunk)
        print("✅ SUCCESS: Audio saved to test_output.wav")
        print(f"Bytes received: {len(res.content) if not res.streaming else 'streamed'}")
    else:
        print(f"❌ FAILED: {res.status_code} - {res.text}")

except Exception as e:
    print(f"❌ EXCEPTION: {e}")
