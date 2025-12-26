
import win32api, win32con, time
import logging

logging.basicConfig(level=logging.INFO)

print("Testing Mouse Movement in 3 seconds...")
time.sleep(3)

try:
    print("Moving...")
    win32api.SetCursorPos((500, 500))
    time.sleep(0.5)
    win32api.mouse_event(win32con.MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    time.sleep(0.1)
    win32api.mouse_event(win32con.MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
    print("Click sent!")
except Exception as e:
    print(f"Error: {e}")

input("Press Enter to exit...")
