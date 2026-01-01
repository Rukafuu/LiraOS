import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import mss
import numpy as np
import cv2
import win32gui
import win32api
import win32con
import base64
from io import BytesIO
from PIL import Image
import threading
import psutil
import random
import win32process
import time
import keyboard
import subprocess

# ... imports ...

def get_process_name(hwnd):
    try:
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        process = psutil.Process(pid)
        return process.name().lower()
    except Exception as e:
        print(f"Error getting exe: {e}")
        return ""

app = Flask(__name__)
app = Flask(__name__)
# Enable CORS for everything, allowing all origins
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    return jsonify({"status": "ok"})


# Logging Setup
file_handler = logging.FileHandler('bridge_debug.log', mode='w')
console_handler = logging.StreamHandler()
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[file_handler, console_handler]
)

# Global State
game_window_handle = None
active_game_id = None
is_running = False
bot_running = False # Added for bot logic
bot_thread = None # Added for bot logic

def find_window_by_name(name):
    """Simple robust finder: Case-insensitive partial match on title."""
    target = name.lower()
    found_hwnd = None
    
    def callback(hwnd, _):
        nonlocal found_hwnd
        if win32gui.IsWindowVisible(hwnd):
            text = win32gui.GetWindowText(hwnd).lower()
            if target in text:
                found_hwnd = hwnd
                return False # Stop
        return True

    try:
        win32gui.EnumWindows(callback, None)
    except: pass
    
    return found_hwnd


@app.route('/status', methods=['GET'])
def status():
    return jsonify({
        "status": "online",
        "game": active_game_id,
        "running": is_running,
        "hwnd": game_window_handle
    })

@app.route('/connect', methods=['POST'])
def connect_game():
    global game_window_handle, active_game_id, is_running
    data = request.json
    exe_name = data.get('exe', '')
    game_id = data.get('id', 'unknown')

    # Try mapping common IDs to window titles
    window_titles = {
        'minecraft': 'Minecraft',
        'notepad': ['Notepad', 'Bloco de Notas'], 
        'chrome': 'Chrome',
        'amongus': 'Among Us',
        'osu': 'osu!',
        'honkai': 'Honkai',
        'epic7': ['BlueStacks', 'LDPlayer', 'MuMu'] 
    }
    
    targets = window_titles.get(game_id, [exe_name])
    if isinstance(targets, str): targets = [targets]
    
    # Search for any match
    hwnd = None
    for t in targets:
        hwnd = find_window_by_name(t)
        if hwnd:
            target = t # Store the specific target that matched
            break
            
    # DEBUG: Print windows if not found
    if not hwnd:
        logging.warning(f"[DEBUG] Could not find window for id={game_id}. Searching for: {targets}")
        logging.info("--- LIST OF VISIBLE WINDOWS ---")
        def list_windows(h, _):
           if win32gui.IsWindowVisible(h):
               t = win32gui.GetWindowText(h)
               if t: logging.info(f" > '{t}'")
        try:
            win32gui.EnumWindows(list_windows, None)
        except Exception as e:
            logging.error(f"Failed to list windows: {e}")
        logging.info("-------------------------------")
    
    if hwnd:
        title = win32gui.GetWindowText(hwnd)
        logging.info(f"[HOOKED] Hooked into window: '{title}' (HWND: {hwnd})")
        game_window_handle = hwnd
        active_game_id = game_id
        is_running = True
        return jsonify({"success": True, "message": f"Hooked into {target}", "hwnd": hwnd})
    else:
        return jsonify({"success": False, "message": f"Window '{target}' not found"}), 404

@app.route('/connect/active', methods=['POST'])
def connect_active():
    global game_window_handle, active_game_id, is_running
    
    try:
        # Wait for user to switch focus
        time.sleep(2) 
        
        hwnd = win32gui.GetForegroundWindow()
        
        if not hwnd:
             return jsonify({"success": False, "message": "No active window found (hwnd=0)"}), 404
             
        title = win32gui.GetWindowText(hwnd)
        
        game_window_handle = hwnd
        active_game_id = 'custom'
        is_running = True
        
        exe_name = get_process_name(hwnd)
        return jsonify({"success": True, "message": f"Hooked into current window: {title}", "hwnd": hwnd, "title": title, "exe": exe_name})
        
    except Exception as e:
        print(f"[ERROR] connect_active failed: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/stop', methods=['POST'])
def stop_game():
    global is_running
    is_running = False
    return jsonify({"success": True})

@app.route('/actions/snapshot', methods=['GET'])
def capture_screen():
    global game_window_handle
    if not game_window_handle:
        return jsonify({"error": "No game connected"}), 400

    try:
        # Get Window Rect
        rect = win32gui.GetWindowRect(game_window_handle)
        x, y, w, h = rect
        w = w - x
        h = h - y

        with mss.mss() as sct:
            monitor = {"top": y, "left": x, "width": w, "height": h}
            sct_img = sct.grab(monitor)
            
            # Resize for performance (MAX 800x600)
            img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
            img.thumbnail((800, 600)) 
            
            buffered = BytesIO()
            img.save(buffered, format="JPEG", quality=30) # Very low quality for speed
            img_str = base64.b64encode(buffered.getvalue()).decode()
            
            return jsonify({"success": True, "image": img_str})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Global Virtual Gamepad
virtual_gamepad = None
vg = None

try:
    import vgamepad as vg_module
    vg = vg_module
    virtual_gamepad = vg.VX360Gamepad()
    print("[GAMEPAD] Virtual Xbox 360 Controller Connected!")
except Exception as e:
    print(f"[GAMEPAD] Failed to load vgamepad (Is ViGEmBus installed?): {e}")
    virtual_gamepad = None
    vg = None

@app.route('/actions/execute', methods=['POST'])
def send_input_action():
    """
    Sends input using global keyboard simulation or Virtual Gamepad
    """
    global game_window_handle
    data = request.json
    action_type = data.get('type') 
    
    # --- VIRTUAL GAMEPAD HANDLER ---
    if action_type == 'gamepad' and virtual_gamepad and vg:
        subtype = data.get('subtype')
        duration = float(data.get('duration', 0.1))
        
        try:
            if subtype == 'button':
                btn_name = data.get('key', '').upper()
                btn_map = {
                    'A': vg.XUSB_BUTTON.XUSB_GAMEPAD_A,
                    'B': vg.XUSB_BUTTON.XUSB_GAMEPAD_B,
                    'X': vg.XUSB_BUTTON.XUSB_GAMEPAD_X,
                    'Y': vg.XUSB_BUTTON.XUSB_GAMEPAD_Y,
                    'START': vg.XUSB_BUTTON.XUSB_GAMEPAD_START,
                    'BACK': vg.XUSB_BUTTON.XUSB_GAMEPAD_BACK,
                    'LB': vg.XUSB_BUTTON.XUSB_GAMEPAD_LEFT_SHOULDER,
                    'RB': vg.XUSB_BUTTON.XUSB_GAMEPAD_RIGHT_SHOULDER,
                    'DPAD_UP': vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_UP,
                    'DPAD_DOWN': vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_DOWN,
                    'DPAD_LEFT': vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_LEFT,
                    'DPAD_RIGHT': vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_RIGHT
                }
                
                if btn_name in btn_map:
                    virtual_gamepad.press_button(button=btn_map[btn_name])
                    virtual_gamepad.update()
                    time.sleep(duration)
                    virtual_gamepad.release_button(button=btn_map[btn_name])
                    virtual_gamepad.update()
                    return jsonify({"success": True, "action": f"Gamepad Btn {btn_name}"})

            elif subtype == 'stick':
                stick = data.get('key', 'LEFT').upper() # LEFT or RIGHT
                x_val = float(data.get('x', 0.0))
                y_val = float(data.get('y', 0.0))
                
                # Convert -1.0..1.0 float to Short (-32768..32767)
                x_short = int(x_val * 32767)
                y_short = int(y_val * 32767)
                
                if stick == 'LEFT':
                    virtual_gamepad.left_joystick(x_value=x_short, y_value=y_short)
                else:
                    virtual_gamepad.right_joystick(x_value=x_short, y_value=y_short)
                
                virtual_gamepad.update()
                time.sleep(duration)
                
                # Reset Stick
                if stick == 'LEFT':
                    virtual_gamepad.left_joystick(x_value=0, y_value=0)
                else:
                    virtual_gamepad.right_joystick(x_value=0, y_value=0)
                virtual_gamepad.update()
                
                return jsonify({"success": True, "action": f"Gamepad Stick {stick}"})

        except Exception as e:
            return jsonify({"error": f"Gamepad Error: {str(e)}"}), 500

    # --- KEYBOARD / LEGACY HANDLER ---
    if not game_window_handle and action_type != 'gamepad':
        return jsonify({"error": "No game connected"}), 400
        
    try:
        # Check if window is foreground, if not, try to focus it? 
        # For now assume user focused it as per 'Active Window' flow.
        # But we can try: win32gui.SetForegroundWindow(game_window_handle)
        try:
            if game_window_handle:
                win32gui.SetForegroundWindow(game_window_handle)
                time.sleep(0.1)
        except: pass

        if action_type == 'key':
            key = data.get('key')
            duration = float(data.get('duration', 0.1))
            
            # --- MOUSE AIMING (Osu! Mode) ---
            if 'x' in data and 'y' in data:
                try:
                    rel_x = float(data['x'])
                    rel_y = float(data['y'])
                    
                    # Get Window Rect to calc absolute coords
                    rect = win32gui.GetWindowRect(game_window_handle)
                    wx, wy, wr, wb = rect
                    w_width = wr - wx
                    w_height = wb - wy
                    
                    target_x = int(wx + (rel_x * w_width))
                    target_y = int(wy + (rel_y * w_height))
                    
                    # Move Mouse
                    win32api.SetCursorPos((target_x, target_y))
                except Exception as ex:
                    print(f"[INPUT] Aim Error: {ex}")

            keyboard.press(key)
            time.sleep(duration)
            keyboard.release(key)
            
            return jsonify({"success": True, "action": f"Pressed {key} for {duration}s"})

        elif action_type == 'mouse':
            subtype = data.get('subtype', 'left_click')
            duration = float(data.get('duration', 0.1))

            # --- MOUSE MOVEMENT ---
            if 'x' in data and 'y' in data:
                 try:
                    rel_x = float(data['x'])
                    rel_y = float(data['y'])
                    
                    # Use ClientRect + ClientToScreen for precision (avoids titlebar offset)
                    rect = win32gui.GetClientRect(game_window_handle)
                    w_width = rect[2]
                    w_height = rect[3]
                    
                    client_point = win32gui.ClientToScreen(game_window_handle, (0, 0))
                    client_x, client_y = client_point

                    target_x = int(client_x + (rel_x * w_width))
                    target_y = int(client_y + (rel_y * w_height))
                    
                    win32api.SetCursorPos((target_x, target_y))
                    
                    # Also force hardware event for games (DirectX/RawInput)
                    screen_w = win32api.GetSystemMetrics(0)
                    screen_h = win32api.GetSystemMetrics(1)
                    abs_x = int((target_x / screen_w) * 65535)
                    abs_y = int((target_y / screen_h) * 65535)
                    win32api.mouse_event(win32con.MOUSEEVENTF_MOVE | win32con.MOUSEEVENTF_ABSOLUTE, abs_x, abs_y, 0, 0)
                 except Exception as ex:
                    print(f"[INPUT] Aim Error: {ex}")

            # --- MOUSE CLICK ---
            if subtype == 'left_click':
                win32api.mouse_event(win32con.MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
                time.sleep(duration)
                win32api.mouse_event(win32con.MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
                return jsonify({"success": True, "action": "Left Click"})
            elif subtype == 'right_click':
                win32api.mouse_event(win32con.MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0)
                time.sleep(duration)
                win32api.mouse_event(win32con.MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0)
                return jsonify({"success": True, "action": "Right Click"})
            
            return jsonify({"success": True, "action": "Mouse Move"})

        elif action_type == 'text':
             text = data.get('text', '')
             if not text: return jsonify({"error": "No text provided"}), 400
             
             keyboard.write(text, delay=0.05)
             return jsonify({"success": True, "action": f"Typed {len(text)} chars"})

        return jsonify({"success": False, "message": "Invalid action type"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- OSU BOT LOGIC ---
def osu_bot_loop():
    global bot_running, game_window_handle
    
    print("[BOT] Thread started. Waiting for window...")
    logging.info("[BOT] Thread started")
    
    # Pre-init MSS
    sct = mss.mss()
    
    while bot_running:
        try:
            if not game_window_handle:
                logging.info(f"Waiting for handle... {game_window_handle}")
                time.sleep(1)
                continue
                
            # Grab Window
            try:
                rect = win32gui.GetWindowRect(game_window_handle)
            except Exception:
                # Handle invalid handle
                time.sleep(1)
                continue

            w = rect[2] - rect[0]
            h = rect[3] - rect[1]
            if w <= 0 or h <= 0: continue
            
            monitor = {"top": rect[1], "left": rect[0], "width": w, "height": h}
            
            # SAFETY & FOCUS CHECK
            try:
                fg_hwnd = win32gui.GetForegroundWindow()
                
                # Performance optimization: if matches perfectly, skip logic
                if fg_hwnd == game_window_handle:
                    pass 
                else:
                    fg_title = win32gui.GetWindowText(fg_hwnd).lower()
                    
                    # Auto-Fix: If the foreground window is Osu!, update our handle!
                    # This handles restarts or different window modes
                    if "osu!" in fg_title:
                         if fg_hwnd != game_window_handle:
                             # Sanitize title for log
                             safe_title = fg_title.encode('ascii', 'ignore').decode()
                             logging.info(f"[BOT] Re-Hooking Osu! New HWND: {fg_hwnd} (Title: {safe_title})")
                             print(f"[BOT] Re-Hooking Osu! New HWND: {fg_hwnd}")
                             game_window_handle = fg_hwnd
                    else:
                         # Not Osu!
                         # Log only once every 5 seconds
                         if int(time.time()) % 5 == 0:
                             safe_fg = fg_title.encode('ascii', 'ignore').decode()
                             logging.info(f"[BOT] Paused. Focused: '{safe_fg}'")
                         time.sleep(1)
                         continue
            except Exception as e:
                pass

            # 1. Capture
            img = np.array(sct.grab(monitor))
            
            # SAVE DEBUG IMAGE FREQUENTLY (Every ~20 frames approx 0.05 chance could be too spammy, let's do simple counter)
            # Actually just save if we haven't nicely
            try:
                cv2.imwrite("osu_debug.jpg", img)
            except: pass

            # 2. DETECT (Hybrid: Color-Based -> Fallback to Hough)
            # A) Color Based (HSV)
            hsv = cv2.cvtColor(img[:,:,:3], cv2.COLOR_BGR2HSV)
            lower_vibrant = np.array([0, 70, 70])
            upper_vibrant = np.array([179, 255, 255])
            mask = cv2.inRange(hsv, lower_vibrant, upper_vibrant)
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            circles = []
            for cnt in contours:
                area = cv2.contourArea(cnt)
                if area > 200 and area < 5000:
                    M = cv2.moments(cnt)
                    if M["m00"] != 0:
                        cX = int(M["m10"] / M["m00"])
                        cY = int(M["m01"] / M["m00"])
                        circles.append([cX, cY, int(np.sqrt(area/np.pi))])

            # B) Fallback: HoughCircles (Geometry based) if Color failed
            if len(circles) == 0:
                frame = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                # Apply blur to reduce noise
                gray = cv2.GaussianBlur(gray, (9, 9), 2)
                
                hough_circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, 
                                        dp=1.2, minDist=60, 
                                        param1=50, param2=30, # Increased param2 to reduce false positives
                                        minRadius=15, maxRadius=100)
                
                if hough_circles is not None:
                     hough_circles = np.round(hough_circles[0, :]).astype("int")
                     for (hx, hy, hr) in hough_circles:
                         circles.append([hx, hy, hr])
                     # logging.info(f"[BOT] Used Fallback Detection (Found {len(circles)})")

            if len(circles) > 0:
                circles = np.array(circles)
                # Pick one random valid circle
                (x, y, r) = circles[0] # Pick first one found
                
                logging.info(f"[BOT] [FOUND] Found {len(circles)} targets. Aiming at: {x},{y}")
            
                # 3. Imperfection (Lowered to 5%)
                if random.random() < 0.05: 
                    logging.info("[BOT] [X] Whiffed (Simulated)")
                    time.sleep(0.05)
                    continue

                # 4. Input
                jx = random.randint(-5, 5) # Less jitter
                jy = random.randint(-5, 5)
                
                target_x = rect[0] + x + jx
                target_y = rect[1] + y + jy
                
                try:
                    # Input Logic (SendInput)
                    _move_absolute(int(target_x), int(target_y))
                    
                    key = 'z' if random.random() > 0.5 else 'x'
                    keyboard.press(key)
                    # Very fast tap
                    time.sleep(random.uniform(0.01, 0.03)) 
                    keyboard.release(key)
                    
                    # Force click 
                    _click()
                    
                except Exception as ex:
                    logging.error(f"Input error: {ex}")
                
                time.sleep(0.02) # Faster polling
            else:
                # logging.info("No circles found") 
                time.sleep(0.001)

        except Exception as e:
            print(f"[BOT] Loop Err: {e}")
            time.sleep(0.5)

@app.route('/bot/start', methods=['POST'])
def start_bot():
    global bot_running, bot_thread
    if bot_running: return jsonify({"status": "already_running"})
    
    bot_running = True
    bot_thread = threading.Thread(target=osu_bot_loop)
    bot_thread.daemon = True
    bot_thread.start()
    return jsonify({"success": True, "message": "Bot started"})

@app.route('/bot/stop', methods=['POST'])
def stop_bot():
    global bot_running
    bot_running = False
    return jsonify({"success": True, "message": "Bot stopped"})

@app.route('/launch', methods=['POST'])
def launch_game():
    data = request.json
    path = data.get('path')
    
    if not path:
        return jsonify({"error": "No path provided"}), 400

    try:
        print(f"[LAUNCHER] Starting: {path}")
        if path.startswith('steam://') or path.startswith('http') or path.startswith('minecraft:'):
            # Open URL protocols (Steam, Web)
            import os
            os.startfile(path)
        else:
            # Run Executable
            subprocess.Popen(path)
            
        return jsonify({"success": True})
    except Exception as e:
        print(f"[LAUNCHER] Error: {e}")
        return jsonify({"error": str(e)}), 500

# --- CTYPES INPUT HELPERS ---
import ctypes
from ctypes import wintypes

# C Structs for SendInput
class MOUSEINPUT(ctypes.Structure):
    _fields_ = [("dx", ctypes.c_long),
                ("dy", ctypes.c_long),
                ("mouseData", ctypes.c_ulong),
                ("dwFlags", ctypes.c_ulong),
                ("time", ctypes.c_ulong),
                ("dwExtraInfo", ctypes.POINTER(ctypes.c_ulong))]

class INPUT(ctypes.Structure):
    _fields_ = [("type", ctypes.c_ulong),
                ("mi", MOUSEINPUT)]

LPINPUT = ctypes.POINTER(INPUT)

def _send_input(dx, dy, flags):
    x = INPUT(type=0, mi=MOUSEINPUT(dx=dx, dy=dy, mouseData=0, dwFlags=flags, time=0, dwExtraInfo=None))
    ctypes.windll.user32.SendInput(1, ctypes.byref(x), ctypes.sizeof(x))

def _move_absolute(x, y):
    # Get Screen Res
    sw = ctypes.windll.user32.GetSystemMetrics(0)
    sh = ctypes.windll.user32.GetSystemMetrics(1)
    
    # Normalize to 0..65535
    nx = int(x * 65535 / sw)
    ny = int(y * 65535 / sh)
    
    _send_input(nx, ny, 0x0001 | 0x8000) # MOVE | ABSOLUTE

def _click():
    _send_input(0, 0, 0x0002) # LEFTDOWN
    time.sleep(0.02)
    _send_input(0, 0, 0x0004) # LEFTUP

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

# ... (Previous Code)

if __name__ == '__main__':
    print("Lira Game Bridge Service Started on Port 5000")
    
    if not is_admin():
        print("\n\n" + "!"*50)
        print("WARNING: SCRIPT NOT RUNNING AS ADMIN")
        print("Osu! inputs will likely be BLOCKED.")
        print("Please close this window, right click 'start_bridge.bat' and select 'Run as Administrator'")
        print("!"*50 + "\n\n")
        logging.warning("NOT RUNNING AS ADMIN - INPUTS MAY FAIL")
    else:
        print("[OK] Running as Administrator")
        logging.info("Running as Administrator")

    app.run(host='0.0.0.0', port=5000)
