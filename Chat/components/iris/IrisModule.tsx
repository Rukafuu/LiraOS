
import React, {useCallback, useEffect, useState} from 'react';
// import {Video} from '@google/genai';
import {CurvedArrowDownIcon} from './icons';
import LoadingIndicator from './LoadingIndicator';
import PromptForm from './PromptForm';
import VideoResult from './VideoResult';
import {generateVideo} from '../../services/geminiVideoService';
import {
  AppState,
  GenerateVideoParams,
  GenerationMode,
  Resolution,
  VideoFile,
} from './types';
import { IrisHistory } from './IrisHistory';
import { History as HistoryIcon, Key, Video as VideoIcon, Eye } from 'lucide-react';
import { IrisVision } from './IrisVision';

interface IrisModuleProps {
    onClose?: () => void;
}

const IrisModule: React.FC<IrisModuleProps> = ({ onClose }) => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastConfig, setLastConfig] = useState<GenerateVideoParams | null>(null);
  const [lastVideoObject, setLastVideoObject] = useState<any | null>(null);
  const [lastVideoBlob, setLastVideoBlob] = useState<Blob | null>(null);
  const [moduleMode, setModuleMode] = useState<'video' | 'vision'>('video');
  
  // API Key State
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyInput, setShowKeyInput] = useState<boolean>(true);
  const [tempKey, setTempKey] = useState('');

  // Form State
  const [initialFormValues, setInitialFormValues] = useState<GenerateVideoParams | null>(null);

  // History State
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load API Key
  useEffect(() => {
    const savedKey = localStorage.getItem('lira_video_api_key');
    if (savedKey) {
        setApiKey(savedKey);
        setShowKeyInput(false);
    }
  }, []);

  // Load History
  useEffect(() => {
    if (appState === AppState.IDLE) {
        const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';
        const token = localStorage.getItem('lira_session') ? JSON.parse(localStorage.getItem('lira_session')!).token : '';
        if (token) {
            fetch(`${API_BASE_URL}/api/iris/history?limit=10`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setHistory(data);
            })
            .catch(err => console.error('Failed to load history', err));
        }
    }
  }, [appState]);

  const saveKey = () => {
    if (tempKey.trim().length > 5) {
        localStorage.setItem('lira_video_api_key', tempKey.trim());
        setApiKey(tempKey.trim());
        setShowKeyInput(false);
    }
  };

  const handleEditKey = () => {
      setTempKey(apiKey);
      setShowKeyInput(true);
  };

  const showStatusError = (message: string) => {
    setErrorMessage(message);
    setAppState(AppState.ERROR);
  };

  const handleGenerate = useCallback(async (params: GenerateVideoParams) => {
    if (!apiKey) {
        setShowKeyInput(true);
        return;
    }

    setAppState(AppState.LOADING);
    setErrorMessage(null);
    setLastConfig(params);
    setInitialFormValues(null);

    try {
      const {objectUrl, blob, video, uri} = await generateVideo(params, apiKey);
      setVideoUrl(objectUrl);
      setLastVideoBlob(blob);
      setLastVideoObject(video);
      setAppState(AppState.SUCCESS);

      // Save to History
      const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';
      const token = localStorage.getItem('lira_session') ? JSON.parse(localStorage.getItem('lira_session')!).token : '';
      
      const historyPayload = {
          videoUrl: uri, 
          prompt: params.prompt || 'Generated Video',
          model: params.model,
          aspectRatio: params.aspectRatio,
          resolution: params.resolution,
          thumbnailUrl: '' 
      };

      fetch(`${API_BASE_URL}/api/iris/history`, {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(historyPayload)
      }).catch(err => console.error('Failed to save history:', err));

    } catch (error) {
      console.error('Video generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      
      if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403')) {
          setErrorMessage('Chave de API inválida ou sem permissões. Por favor verifique sua chave.');
          setShowKeyInput(true); 
      } else {
        setErrorMessage(`Falha na geração: ${errorMessage}`);
      }
      setAppState(AppState.ERROR);
    }
  }, [apiKey]);

  const handleRetry = useCallback(() => {
    if (lastConfig) {
      handleGenerate(lastConfig);
    }
  }, [lastConfig, handleGenerate]);

  const handleNewVideo = useCallback(() => {
    setAppState(AppState.IDLE);
    setVideoUrl(null);
    setErrorMessage(null);
    setLastConfig(null);
    setLastVideoObject(null);
    setLastVideoBlob(null);
    setInitialFormValues(null);
  }, []);

  const handleTryAgainFromError = useCallback(() => {
    if (lastConfig) {
      setInitialFormValues(lastConfig);
      setAppState(AppState.IDLE);
      setErrorMessage(null);
    } else {
      handleNewVideo();
    }
  }, [lastConfig, handleNewVideo]);

  const handleExtend = useCallback(async () => {
    if (lastConfig && lastVideoBlob && lastVideoObject) {
      try {
        const file = new File([lastVideoBlob], 'last_video.mp4', {
          type: lastVideoBlob.type,
        });
        const videoFile: VideoFile = {file, base64: ''};

        setInitialFormValues({
          ...lastConfig,
          mode: GenerationMode.EXTEND_VIDEO,
          prompt: '',
          inputVideo: videoFile,
          inputVideoObject: lastVideoObject,
          resolution: Resolution.P720,
          startFrame: null,
          endFrame: null,
          referenceImages: [],
          styleImage: null,
          isLooping: false,
        });

        setAppState(AppState.IDLE);
        setVideoUrl(null);
        setErrorMessage(null);
      } catch (error) {
        console.error('Failed to process video for extension:', error);
        showStatusError(`Failed to prepare video for extension: ${(error as Error).message}`);
      }
    }
  }, [lastConfig, lastVideoBlob, lastVideoObject]);

  const handleSelectHistory = (item: any) => {
      setVideoUrl(item.videoUrl);
      setAppState(AppState.SUCCESS);
      setErrorMessage(null);
  };

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';
      const token = localStorage.getItem('lira_session') ? JSON.parse(localStorage.getItem('lira_session')!).token : '';
      
      try {
          await fetch(`${API_BASE_URL}/api/iris/history/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          setHistory(prev => prev.filter(i => i.id !== id));
      } catch (err) {
          console.error("Failed to delete", err);
      }
  };

  const renderError = (message: string) => (
    <div className="text-center bg-red-900/20 border border-red-500/50 p-8 rounded-xl max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-red-400 mb-4">Erro na Geração</h2>
      <p className="text-red-300 mb-6">{message}</p>
      <button
        onClick={handleTryAgainFromError}
        className="px-6 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors text-white font-medium">
        Tentar Novamente
      </button>
    </div>
  );

  if (showKeyInput) {
      return (
          <div className="flex flex-col items-center justify-center p-8 h-full min-h-[400px] animate-in fade-in zoom-in-95">
              <div className="max-w-md w-full bg-[#1A1A1E] border border-white/10 p-8 rounded-2xl shadow-2xl relative">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-purple-500/10 rounded-full">
                        <Key className="w-8 h-8 text-purple-400" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-center text-white mb-2">Configurar Lira Iris</h2>
                <p className="text-gray-400 text-center mb-6 text-sm">
                    Para usar o Gerador de Vídeo (Google Veo), você precisa de uma chave de API do Google Vertex AI ou AI Studio.
                </p>
                <input 
                    type="password"
                    placeholder="Cole sua API Key aqui..."
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={saveKey}
                        disabled={tempKey.length < 5}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        Salvar e Começar
                    </button>
                    {apiKey && (
                        <button 
                            onClick={() => setShowKeyInput(false)}
                            className="w-full bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-medium py-2 rounded-lg transition-all">
                            Cancelar
                        </button>
                    )}
                </div>
                <p className="text-xs text-center text-gray-500 mt-4">
                    Sua chave é salva apenas no seu navegador logalmente.
                </p>
              </div>
          </div>
      )
  }

  return (
    <div className="h-full flex flex-col font-sans overflow-hidden bg-[#09090b]">
        <div className="absolute top-4 right-16 z-20 flex gap-2">
            <button 
                onClick={() => setShowHistory(!showHistory)} 
                className={`text-xs flex items-center gap-2 transition-colors px-3 py-1.5 rounded-full border border-white/10 ${showHistory ? 'bg-purple-500 text-white' : 'bg-black/50 text-gray-400 hover:text-white'}`}>
                <HistoryIcon className="w-3 h-3" />
                History
            </button>
            <button 
                onClick={handleEditKey} 
                className="text-xs text-gray-500 hover:text-white transition-colors underline bg-black/50 px-2 py-1 rounded">
                Config Key
            </button>
        </div>

      <header className="py-6 flex flex-col justify-center items-center px-8 relative z-10 shrink-0 gap-4">
        <h1 className="text-4xl font-bold tracking-tight text-center bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Lira Iris <span className="text-xs font-normal text-gray-500 tracking-normal ml-2 align-middle border border-gray-700 px-2 py-0.5 rounded-full">Beta</span>
        </h1>
        
        {/* Mode Switcher */}
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
            <button 
                onClick={() => setModuleMode('video')}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${moduleMode === 'video' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
            >
                <VideoIcon size={14} /> Video Gen (Veo)
            </button>
            <button 
                onClick={() => setModuleMode('vision')}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${moduleMode === 'vision' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
            >
                <Eye size={14} /> Computer Vision
            </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto w-full flex-grow flex flex-col p-4 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/5 to-transparent pointer-events-none" />
        
        {moduleMode === 'vision' ? (
            <IrisVision />
        ) : (
            appState === AppState.IDLE ? (
            <div className="flex flex-col h-full">
                <div className="flex-grow flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-light text-gray-300">
                        O que vamos criar hoje?
                        </h2>
                        <p className="text-gray-500 max-w-lg mx-auto">
                            Descreva sua ideia, faça upload de imagens ou use referências para gerar vídeos incríveis com o Google Veo.
                        </p>
                    </div>
                <CurvedArrowDownIcon className="w-16 h-16 text-gray-700 opacity-40 animate-bounce" />
                </div>
                <div className="pb-4 animate-in slide-in-from-bottom-10 fade-in duration-500">
                <PromptForm
                    onGenerate={handleGenerate}
                    initialValues={initialFormValues}
                />
                </div>
            </div>
            ) : (
            <div className="flex-grow flex items-center justify-center">
                {appState === AppState.LOADING && <LoadingIndicator />}
                
                {appState === AppState.SUCCESS && videoUrl && (
                <VideoResult
                    videoUrl={videoUrl}
                    onRetry={handleRetry}
                    onNewVideo={handleNewVideo}
                    onExtend={handleExtend}
                    canExtend={lastConfig?.resolution === Resolution.P720}
                />
                )}
                
                {appState === AppState.SUCCESS && !videoUrl && renderError('Vídeo gerado, mas a URL não foi encontrada.')}
                
                {appState === AppState.ERROR && errorMessage && renderError(errorMessage)}
            </div>
            )
        )}
      </div>
      
      {showHistory && (
          <IrisHistory 
            history={history} 
            onSelect={handleSelectHistory} 
            onDelete={handleDeleteHistory}
            onClose={() => setShowHistory(false)}
          />
      )}
    </div>
  );
};

export default IrisModule;
