#!/usr/bin/env python3
import requests
import json

# Test the /api/chat endpoint
url = "http://localhost:9000/api/chat"
headers = {"Content-Type": "application/json"}
data = {
    "messages": [
        {"role": "user", "content": "Olá Lira"}
    ]
}

print("Testing API endpoint...")
print(f"URL: {url}")
print(f"Data: {data}")

try:
    response = requests.post(url, headers=headers, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")

    if response.status_code == 200:
        result = response.json()
        print("✅ API working correctly!")
        print(f"Reply: {result.get('reply', 'No reply field')}")
    else:
        print("❌ API returned error")

except Exception as e:
    print(f"❌ Error: {e}")
