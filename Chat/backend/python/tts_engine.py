import sys
import asyncio
import edge_tts
import os
import uuid
import subprocess

# Anime Voice Configuration
# User Choice: Francisca (Best Tone). 
# +20Hz: Middle ground between "Mature" (+10) and "Helium" (+30).
VOICE = "pt-BR-FranciscaNeural"
PITCH = "+20Hz"
RATE = "+10%"

async def generate_and_play(text):
    if not text:
        return

    output_file = os.path.join(os.getcwd(), f"tts_{uuid.uuid4()}.mp3")
    
    try:
        # 1. Generate Audio
        communicate = edge_tts.Communicate(text, VOICE, pitch=PITCH, rate=RATE)
        await communicate.save(output_file)

        # CHECK: If --generate-only is passed, we just print filepath and exit
        if "--generate-only" in sys.argv:
            print(output_file) # Print path to stdout for Node to capture
            return # Skip playback and cleanup (Node handles cleanup)

        # 2. Play Audio via PowerShell (Robust Mode)
        # We wait for NaturalDuration to be available before playing/waiting.
        ps_script = f"""
        Add-Type -AssemblyName presentationCore; 
        $mediaPlayer = New-Object System.Windows.Media.MediaPlayer;
        $mediaPlayer.Open('{output_file}');
        
        # Wait up to 5s for media to load duration
        for ($i=0; $i -lt 50; $i++) {{
            if ($mediaPlayer.NaturalDuration.HasTimeSpan) {{ break }}; 
            Start-Sleep -Milliseconds 100 
        }}
        
        $mediaPlayer.Play();
        
        # Init buffer wait
        Start-Sleep -Milliseconds 200;
        
        # Wait until finished
        while ($mediaPlayer.NaturalDuration.HasTimeSpan -and $mediaPlayer.Position -lt $mediaPlayer.NaturalDuration.TimeSpan) {{ 
            Start-Sleep -Milliseconds 100 
        }}
        
        $mediaPlayer.Close();
        """
        
        # Running visible for debug? No, stick to default (hidden) but robust.
        subprocess.run(["powershell", "-c", ps_script], check=True)

    except Exception as e:
        print(f"Error during TTS: {e}", file=sys.stderr)
    finally:
        # 3. Cleanup
        if os.path.exists(output_file):
            try:
                os.remove(output_file)
            except:
                pass

if __name__ == "__main__":
    if len(sys.argv) > 1:
        text_input = " ".join(sys.argv[1:])
        asyncio.run(generate_and_play(text_input))
    else:
        print("Usage: python tts_engine.py \"Text to speak\"")
