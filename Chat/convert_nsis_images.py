from PIL import Image
import os

# Usar a nova imagem otimizada para NSIS
input_image = r"C:\Users\conta\.gemini\antigravity\brain\82e48b02-e3f5-49c9-b15f-816d2fc422b1\lira_installer_nsis_1767677927223.png"
output_dir = r"C:\Users\conta\Documents\Lira\Chat\src-tauri\icons"

# Criar diretório se não existir
os.makedirs(output_dir, exist_ok=True)

# Abrir imagem
img = Image.open(input_image)
print(f"✓ Imagem carregada: {img.size[0]}x{img.size[1]}")

# Converter para RGB
img_rgb = img.convert("RGB")

# NSIS usa 164x314 para header
header = img_rgb.resize((164, 314), Image.Resampling.LANCZOS)
header.save(os.path.join(output_dir, "installer-header.bmp"))
print("✓ Header NSIS criado (164x314)")

# NSIS também pode usar sidebar 164x314
sidebar = img_rgb.resize((164, 314), Image.Resampling.LANCZOS)
sidebar.save(os.path.join(output_dir, "installer-sidebar.bmp"))
print("✓ Sidebar NSIS criado (164x314)")

print(f"\n✨ Imagens prontas em: {output_dir}")
