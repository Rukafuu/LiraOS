import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend directory
env_path = Path(__file__).parent / '.env'
print(f"Loading .env from: {env_path}")
print(f"File exists: {env_path.exists()}\n")

load_dotenv(env_path)

print("="*60)
print("SMTP Configuration:")
print("="*60)
print(f"SMTP_HOST: {os.getenv('SMTP_HOST') or 'NOT SET'}")
print(f"SMTP_PORT: {os.getenv('SMTP_PORT') or 'NOT SET'}")
print(f"SMTP_USER: {os.getenv('SMTP_USER') or 'NOT SET'}")
smtp_pass = os.getenv('SMTP_PASSWORD')
print(f"SMTP_PASSWORD: {'SET (' + str(len(smtp_pass)) + ' chars)' if smtp_pass else 'NOT SET'}")
print(f"SMTP_FROM: {os.getenv('SMTP_FROM') or 'NOT SET'}")

print("\n" + "="*60)
print("GitHub OAuth Configuration:")
print("="*60)
client_id = os.getenv('GITHUB_CLIENT_ID')
print(f"GITHUB_CLIENT_ID: {'SET (' + str(len(client_id)) + ' chars)' if client_id else 'NOT SET'}")
client_secret = os.getenv('GITHUB_CLIENT_SECRET')
print(f"GITHUB_CLIENT_SECRET: {'SET (' + str(len(client_secret)) + ' chars)' if client_secret else 'NOT SET'}")
print(f"BACKEND_URL: {os.getenv('BACKEND_URL') or 'NOT SET'}")
print(f"FRONTEND_URL: {os.getenv('FRONTEND_URL') or 'NOT SET'}")

print("\n" + "="*60)
print("LLM Configuration:")
print("="*60)
print(f"MISTRAL_API_KEY: {'SET' if os.getenv('MISTRAL_API_KEY') else 'NOT SET'}")
print(f"OPENROUTER_API_KEY: {'SET' if os.getenv('OPENROUTER_API_KEY') else 'NOT SET'} (Xiaomi Mimo)")


print("\n" + "="*60)
if smtp_pass and client_id:
    print("✅ Both SMTP and GitHub appear to be configured!")
elif smtp_pass:
    print("⚠️ Only SMTP is configured")
elif client_id:
    print("⚠️ Only GitHub OAuth is configured")
else:
    print("❌ Neither SMTP nor GitHub OAuth are configured")
print("="*60)
