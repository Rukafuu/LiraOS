import time
import requests
import mss
import numpy as np
import cv2
import json
import pyautogui
import os
import random

# URL do servidor da Lira Gamer (Electron Main Process)
SERVER_URL = "http://localhost:3001/game-event"

# Área de captura (Full Screen by default - otimizar depois para janela específica)
MONITOR = {"top": 0, "left": 0, "width": 1920, "height": 1080}
TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), 'templates')

# Flags
AUTO_CLICK = True # Mude para True para permitir cliques reais
DEBUG_SHOW = False  # Mostra a janela do que a Lira está vendo
LAST_CLICK_TIME = 0

def send_event(game, description, event_type="visual"):
    try:
        payload = {
            "game": game,
            "description": description,
            "type": event_type,
            "timestamp": time.time()
        }
        requests.post(SERVER_URL, json=payload, timeout=0.1)
        # print(f"[SENT] {description}")
    except:
        pass

def human_click(x, y):
    global LAST_CLICK_TIME
    if time.time() - LAST_CLICK_TIME < 2.0: # Cooldown de 2s para segurança
        return

    print(f"[ACTION] Clicking at {x}, {y}")
    
    if not AUTO_CLICK:
        return
        
    # Movimento levemente aleatório para parecer humano
    duration = random.uniform(0.1, 0.4)
    # Move para a coordenada absoluta (ajustando pelo offset do monitor se necessário)
    # PyAutoGUI usa coordenadas globais da tela principal. Se for monitor 2, precisa somar.
    # Assumindo Monitor 1 (0,0) por enquanto.
    
    screen_x = MONITOR["left"] + x
    screen_y = MONITOR["top"] + y
    
    try:
        pyautogui.moveTo(screen_x, screen_y, duration=duration, tween=pyautogui.easeOutQuad)
        pyautogui.click()
        LAST_CLICK_TIME = time.time()
    except Exception as e:
        print(f"Click failed: {e}")

def find_template(screen_img, template_path, threshold=0.8):
    # ... (código existente mantido, a ferramenta vai preservar o que não mudei se o contexto estiver certo, mas vou repetir a função finds_template para garantir integridade se for um replace partial)
    if not os.path.exists(template_path): return None
    
    template_orig = cv2.imread(template_path)
    if template_orig is None: return None
    
    screen_gray = cv2.cvtColor(screen_img, cv2.COLOR_BGR2GRAY)
    templ_gray = cv2.cvtColor(template_orig, cv2.COLOR_BGR2GRAY)
    
    found = None

    for scale in np.linspace(0.8, 1.2, 10): 
        resized = cv2.resize(templ_gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
        if resized.shape[0] > screen_gray.shape[0] or resized.shape[1] > screen_gray.shape[1]: continue
        result = cv2.matchTemplate(screen_gray, resized, cv2.TM_CCOEFF_NORMED)
        min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)
        if found is None or max_val > found[0]: found = (max_val, max_loc, r := float(templ_gray.shape[1]) / resized.shape[1], resized.shape)

    if found and found[0] >= threshold:
        max_val, max_loc, r, shape = found
        w, h = int(shape[1] * r), int(shape[0] * r)
        center_x = int(max_loc[0] + w/2)
        center_y = int(max_loc[1] + h/2)
        return (center_x, center_y, max_loc, (w, h))
    return None

def detect_visuals(sct):
    screenshot = np.array(sct.grab(MONITOR))
    frame = cv2.cvtColor(screenshot, cv2.COLOR_BGRA2BGR)
    
    if os.path.exists(TEMPLATE_DIR):
        files = [f for f in os.listdir(TEMPLATE_DIR) if f.endswith(".png")]
        for filename in files:
            path = os.path.join(TEMPLATE_DIR, filename)
            match = find_template(frame, path, threshold=0.8) # Threshold fixo
            
            if match:
                cx, cy, top_left, size = match
                
                # --- AÇÃO: CLICAR NO ALVO ---
                human_click(cx, cy)
                
                cv2.rectangle(frame, top_left, (top_left[0]+size[0], top_left[1]+size[1]), (0, 255, 0), 2)
                cv2.putText(frame, f"{filename}", (top_left[0], top_left[1]-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                return f"Found object: {filename}", frame
    
    # ... (Detecção de dano continua aqui)
    lower_red = np.array([0, 0, 150])
    upper_red = np.array([50, 50, 255])
    mask = cv2.inRange(frame, lower_red, upper_red)
    if np.sum(mask > 0) / (MONITOR['width'] * MONITOR['height']) > 0.3:
        return "Takes heavy damage!", frame

    return None, frame

def main():
    print(f"Lira Vision Agent V3 Started. Sending to {SERVER_URL}")
    print(f"Looking for templates in: {TEMPLATE_DIR}")
    
    if os.path.exists(TEMPLATE_DIR):
        files = os.listdir(TEMPLATE_DIR)
        print(f"Found {len(files)} files in template folder: {files}")
    else:
        print(f"[ERROR] Template folder does not exist: {TEMPLATE_DIR}")
    
    DEBUG_DIR = os.path.join(os.path.dirname(__file__), 'debug')
    if not os.path.exists(DEBUG_DIR): os.makedirs(DEBUG_DIR)

    with mss.mss() as sct:
        # Check monitor 1. Se tiver problemas, tente mudar para 2 ou 0
        monitor = sct.monitors[1] 
        print(f"Capturing Screen: {monitor}")
        global MONITOR
        MONITOR = {"top": monitor["top"], "left": monitor["left"], "width": monitor["width"], "height": monitor["height"]}

    last_event_time = 0
    COOLDOWN = 2.0 
    
    with mss.mss() as sct:
        frame_count = 0
        while True:
            try:
                current_time = time.time()
                frame_count += 1
                
                screenshot = np.array(sct.grab(MONITOR))
                frame = cv2.cvtColor(screenshot, cv2.COLOR_BGRA2BGR)
                
                # --- AUTO SNAPSHOT PARA DEBUG (A CADA 5 SEGUNDOS) ---
                if frame_count % 50 == 0: 
                    snap_path = os.path.join(DEBUG_DIR, "lira_view.png")
                    cv2.imwrite(snap_path, frame)
                    # print(f"[DEBUG] Saved snapshot to {snap_path}")

                # --- DEBUG CHECK ---
                if frame_count % 30 == 0: # Print status every ~3 seconds
                     if os.path.exists(TEMPLATE_DIR):
                        for filename in os.listdir(TEMPLATE_DIR):
                            if not filename.endswith(".png"): continue
                            path = os.path.join(TEMPLATE_DIR, filename)
                            templ = cv2.imread(path)
                            # ... (resto igual)
                            if templ is None: continue
                            
                            res = cv2.matchTemplate(frame, templ, cv2.TM_CCOEFF_NORMED)
                            min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(res)
                            print(f"[DEBUG] {filename} match score: {max_val:.4f} (Required: 0.8)")
                
                # Run the actual detector
                event_text, processed_frame = detect_visuals(sct)

                if event_text:
                    if current_time - last_event_time > COOLDOWN:
                         print(f"!!! TRIGGER EVENT: {event_text}")
                         send_event("VisualEngine", event_text)
                         last_event_time = current_time
                
                # time.sleep(0.1) 
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"Loop error: {e}")
                time.sleep(1)
        
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
