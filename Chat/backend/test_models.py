import os
import requests
import json
from dotenv import load_dotenv
from pathlib import Path

# Load env
env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)

MISTRAL_KEY = os.getenv("MISTRAL_API_KEY")
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")

print(f"Mistral Key present: {bool(MISTRAL_KEY)}")
print(f"OpenRouter Key present: {bool(OPENROUTER_KEY)}")

def test_mistral():
    print("\nTesting Mistral...")
    if not MISTRAL_KEY:
        print("SKIP: No key")
        return
    
    url = "https://api.mistral.ai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {MISTRAL_KEY}", "Content-Type": "application/json"}
    data = {
        "model": "mistral-large-latest",
        "messages": [{"role": "user", "content": "Say 'Mistral working' in 1 word."}]
    }
    try:
        res = requests.post(url, headers=headers, json=data)
        if res.ok:
            print(f"SUCCESS: {res.json()['choices'][0]['message']['content']}")
        else:
            print(f"FAIL: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"ERROR: {e}")

def test_xiaomi():
    print("\nTesting Xiaomi (via OpenRouter)...")
    if not OPENROUTER_KEY:
        print("SKIP: No key")
        return

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "LiraOS",
        "Content-Type": "application/json"
    }
    data = {
        "model": "xiaomi/mimo-v2-flash:free",
        "messages": [{"role": "user", "content": "Say 'Xiaomi working' in 1 word."}]
    }
    try:
        res = requests.post(url, headers=headers, json=data)
        if res.ok:
            print(f"SUCCESS: {res.json()['choices'][0]['message']['content']}")
        else:
            print(f"FAIL: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_mistral()
    test_xiaomi()
