from PIL import Image
import os
import glob
import sys

# Forces UTF-8 output if possible, but safe strings are better
sys.stdout.reconfigure(encoding='utf-8')

# Path to textures
TEXTURE_DIR = r"c:\Users\conta\Documents\Lira\Chat\public\assets\model\lira\youling.4096"

def fix_textures():
    print(f"[INFO] Fixing textures in: {TEXTURE_DIR}")
    
    # Get png files
    png_files = glob.glob(os.path.join(TEXTURE_DIR, "texture_*.png"))
    
    if not png_files:
        print("[ERROR] No textures found!")
        return

    for png in png_files:
        filename = os.path.basename(png)
        print(f"Processing {filename}...")
        
        try:
            with Image.open(png) as img:
                print(f"  Original size: {img.size}")
                
                # Backup if not exists
                backup_path = png + ".bak"
                if not os.path.exists(backup_path):
                    img.save(backup_path, format="PNG")
                    print("  [OK] Backup created.")
                
                # Rescale to 2048 using high quality filter (LANCZOS)
                target_size = (2048, 2048)
                
                # Check aspect ratio
                if img.width != img.height:
                     scale = 0.5
                     target_size = (int(img.width * scale), int(img.height * scale))
                
                resized = img.resize(target_size, Image.Resampling.LANCZOS)
                print(f"  Resized to: {resized.size}")
                
                # Save over original
                resized.save(png)
                print("  [SAVED] Saved fixed texture.")
                
        except Exception as e:
            print(f"  [FAIL] Error processing {filename}: {e}")

if __name__ == "__main__":
    try:
        import PIL
        fix_textures()
    except ImportError:
        print("Installing Pillow...")
        os.system("pip install Pillow")
        # Try again after install
        try:
           import PIL
           fix_textures()
        except:
           print("Please run: pip install Pillow")
