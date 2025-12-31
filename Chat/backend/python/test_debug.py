import asyncio
import edge_tts
import os

VOICE = "pt-BR-FranciscaNeural"
PITCH = "+20Hz"
RATE = "+10%"
OUTPUT = "debug_voice.mp3"

async def main():
    print(f"Generating balanced audio with {VOICE} (Pitch: {PITCH})...")
    communicate = edge_tts.Communicate("Voltei para a Francisca! Ajustei para ficar jovem, mas natural. É essa a voz definitiva?", VOICE, pitch=PITCH, rate=RATE)
    await communicate.save(OUTPUT)
    
    print(f"Opening {OUTPUT} in default player...")
    os.startfile(OUTPUT)

if __name__ == "__main__":
    asyncio.run(main())
