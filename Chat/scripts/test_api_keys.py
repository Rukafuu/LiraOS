import os
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load .env
env_path = Path(__file__).parent.parent / "backend" / ".env"
load_dotenv(env_path)

print(f"📁 Loading .env from: {env_path}")
print(f"✅ File exists: {env_path.exists()}\n")

# Test Mistral API
mistral_key = os.getenv("MISTRAL_API_KEY")
print(f"🔑 MISTRAL_API_KEY: {mistral_key[:20]}..." if mistral_key else "❌ MISTRAL_API_KEY not found")

if mistral_key:
    print("\n🧪 Testing Mistral API...")
    try:
        response = requests.post(
            "https://api.mistral.ai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {mistral_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "mistral-small-latest",
                "messages": [{"role": "user", "content": "Hi"}],
                "max_tokens": 10
            },
            timeout=10
        )
        print(f"📊 Status Code: {response.status_code}")
        if response.ok:
            print("✅ Mistral API is working!")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Mistral API Error: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")

# Test Groq API
groq_key = os.getenv("GROQ_API_KEY")
print(f"\n🔑 GROQ_API_KEY: {groq_key[:20]}..." if groq_key else "❌ GROQ_API_KEY not found")

if groq_key and groq_key != "gsk_YourGroqKeyHere":
    print("\n🧪 Testing Groq API...")
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": "Hi"}],
                "max_tokens": 10
            },
            timeout=10
        )
        print(f"📊 Status Code: {response.status_code}")
        if response.ok:
            print("✅ Groq API is working!")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Groq API Error: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")
