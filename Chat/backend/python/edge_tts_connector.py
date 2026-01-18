import sys
import asyncio
import edge_tts

async def main():
    text = sys.argv[1]
    output_file = sys.argv[2]
    voice = "pt-BR-FranciscaNeural"
    
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_file)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python edge_tts_connector.py <text> <output_file>")
        sys.exit(1)
        
    # Fix para Windows Event Loop se rodar localmente, mas no Linux/Railway funciona padrão
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
