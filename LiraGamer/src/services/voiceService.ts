import axios from 'axios';

const XTTS_SERVER_URL = 'http://localhost:8020'; // Ajuste conforme necessário

export const voiceService = {
  async speak(text: string, speaker_wav: string = 'lira_voice.wav', language: string = 'en') {
    try {
      // Exemplo de payload para o servidor XTTS padrão (coqui-ai-tts)
      // O endpoint exato depende de como você está rodando o servidor (api_server.py do TTS)
      const response = await axios.post(`${XTTS_SERVER_URL}/tts_to_audio/`, {
        text: text,
        speaker_wav: speaker_wav,
        language_id: language
      }, {
        responseType: 'blob' // Receber como blob de áudio
      });

      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);
      await audio.play();
      
      return true;
    } catch (error) {
      console.error('TTS Error:', error);
      return false;
    }
  },

  // Fallback simples usando a API do navegador se o XTTS estiver offline
  speakBrowser(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    // Tentar achar uma voz feminina em inglês ou português
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Microsoft Maria') || v.name.includes('Google US English'));
    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.speak(utterance);
  }
};
