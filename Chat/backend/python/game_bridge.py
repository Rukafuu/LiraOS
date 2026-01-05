import os
import time
import json
import base64
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import mss
import pyautogui
import cv2
import numpy as np

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [BRIDGE] %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global State
active_window = None

@app.route('/status', methods=['GET'])
def status():
    return jsonify({"status": "running", "window": active_window})

@app.route('/connect/active', methods=['POST'])
def connect_active():
    """Hook into the currently active window (simulated)"""
    global active_window
    try:
        # In a real scenario, we would use pygetwindow or win32gui to get the handle.
        # For simplicity/safety, we just track the screen size and assume user is focused.
        w, h = pyautogui.size()
        active_window = {"title": "Active Screen", "width": w, "height": h}
        logger.info(f"Connected to Active Screen: {w}x{h}")
        return jsonify({"status": "connected", "window": "Active Screen", "size": [w, h]})
    except Exception as e:
        logger.error(f"Connect failed: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/actions/snapshot', methods=['GET'])
def snapshot():
    """Capture screen and return base64 jpeg"""
    try:
        with mss.mss() as sct:
            # Capture entire screen for now (or specific region if window tracking was advanced)
            monitor = sct.monitors[1] # Primary monitor
            sct_img = sct.grab(monitor)
            
            # Convert to numpy/opencv
            img = np.array(sct_img)
            img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
            
            # Resize for performance (Gemini doesn't need 4k)
            # Maintain aspect ratio, max width 1024
            h, w = img.shape[:2]
            target_w = 1024
            if w > target_w:
                ratio = target_w / w
                new_h = int(h * ratio)
                img = cv2.resize(img, (target_w, new_h))

            # Encode to JPG
            _, buffer = cv2.imencode('.jpg', img, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            b64_str = base64.b64encode(buffer).decode('utf-8')
            
            return jsonify({"success": True, "image": b64_str})
            
    except Exception as e:
        logger.error(f"Snapshot failed: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/actions/execute', methods=['POST'])
def execute_action():
    """Execute mouse/keyboard action"""
    data = request.json
    action_type = data.get('type')
    
    try:
        if action_type == 'mouse':
            subtype = data.get('subtype', 'move')
            x_rel = data.get('x', 0)
            y_rel = data.get('y', 0)
            duration = data.get('duration', 0.1)
            
            # Convert simple relative coordinates (0-1) to pixels? 
            # Or use Mineflayer rotation format?
            # Since this is a bridge for DIRECT PC CONTROL (Vision Agent), we use relative mouse movement.
            
            # Move relative pixels (e.g. for looking around in FPS games)
            # Scale factor: 1.0 = 1000 pixels (arbitrary sensitivity)
            scale = 1000 
            x_pix = int(x_rel * scale)
            y_pix = int(y_rel * scale)
            
            if x_pix != 0 or y_pix != 0:
                pyautogui.moveRel(x_pix, y_pix, duration=duration)
                
            if subtype == 'left_click':
                # Hold if duration specified (mining)
                if duration > 0.5:
                    pyautogui.mouseDown()
                    time.sleep(duration)
                    pyautogui.mouseUp()
                else:
                    pyautogui.click()
            elif subtype == 'right_click':
                pyautogui.click(button='right')
                
        elif action_type == 'key':
            key = data.get('key')
            duration = data.get('duration', 0.1)
            if key:
                if duration > 0.2:
                    pyautogui.keyDown(key)
                    time.sleep(duration)
                    pyautogui.keyUp(key)
                else:
                    pyautogui.press(key)
                    
        elif action_type == 'chat':
            text = data.get('text')
            if text:
                pyautogui.press('t')
                time.sleep(0.1)
                pyautogui.write(text, interval=0.05)
                pyautogui.press('enter')

        return jsonify({"success": True, "action": action_type})

    except Exception as e:
        logger.error(f"Action failed: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting Vision Bridge on port 5000...")
    app.run(host='0.0.0.0', port=5000)
