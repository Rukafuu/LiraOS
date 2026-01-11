import os
import time
import threading
import io
from flask import Flask, send_file, jsonify, request
import mss
from PIL import Image

app = Flask(__name__)
sct = mss.mss()

# Global State
latest_screenshot_path = os.path.join(os.path.dirname(__file__), "monitor.jpg")

def capture_loop():
    """Captures screen independently to keep it fresh"""
    while True:
        try:
            # Capture primary monitor
            monitor = sct.monitors[1]
            sct_img = sct.grab(monitor)
            
            # Save to buffer/file potentially, or just keep in memory?
            # For simplicity, we can just grab on demand in the route, 
            # but a loop allows for 'triggering' events later.
            # For now, on-demand is better for performance.
            time.sleep(1)
        except Exception as e:
            print(f"[BRIDGE] Capture Error: {e}")
            time.sleep(5)

@app.route('/health')
def health():
    return jsonify({"status": "ok", "service": "Lira Game Bridge"})

@app.route('/snapshot')
def snapshot():
    """Returns the current screen as JPEG"""
    try:
        monitor = sct.monitors[1]
        sct_img = sct.grab(monitor)
        
        # Convert to PIL/JPEG
        img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
        
        # Resize if too huge (optional, for speed)
        # img.thumbnail((1920, 1080))

        img_io = io.BytesIO()
        img.save(img_io, 'JPEG', quality=80)
        img_io.seek(0)
        
        return send_file(img_io, mimetype='image/jpeg')
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/analyze_context', methods=['POST'])
def analyze():
    """Dummy endpoint if we want python-side analysis later"""
    return jsonify({"context": "unknown"})

if __name__ == "__main__":
    print("[BRIDGE] Starting Python Vision Server on port 5001...")
    # Port 5001 to avoid conflict with Node (4000) or others
    app.run(host='0.0.0.0', port=5001, debug=False)
