from PIL import Image
import os

# Usar a imagem editada (sem barra fake)
input_image = r"C:\Users\conta\.gemini\antigravity\brain\82e48b02-e3f5-49c9-b15f-816d2fc422b1\lira_installer_fixed_1767676868784.png"
output_dir = r"C:\Users\conta\Documents\Lira\Chat\src-tauri\wix"

# Criar diretório se não existir
os.makedirs(output_dir, exist_ok=True)

# Abrir imagem original
img = Image.open(input_image)
print(f"✓ Imagem carregada: {img.size[0]}x{img.size[1]}")

# Converter para RGB (BMP não suporta alpha)
img_rgb = img.convert("RGB")

# Criar banner (493x58) - cortar do topo
banner = img_rgb.crop((0, 0, img.size[0], min(58, img.size[1])))
banner = banner.resize((493, 58), Image.Resampling.LANCZOS)
banner.save(os.path.join(output_dir, "banner.bmp"))
print("✓ Banner criado (493x58)")

# Criar dialog (493x312) - redimensionar a imagem completa
dialog = img_rgb.resize((493, 312), Image.Resampling.LANCZOS)
dialog.save(os.path.join(output_dir, "dialog.bmp"))
print("✓ Dialog criado (493x312)")

print(f"\n✨ Imagens prontas em: {output_dir}")
print("\nArquivos criados:")
print("  - banner.bmp (topo do instalador)")
print("  - dialog.bmp (tela de boas-vindas SEM barra fake)")
print("\n💡 Agora o loader real do Windows vai aparecer limpo!")
