import { useState, useCallback } from 'react';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import LandingPage from './components/LandingPage';
import FireworkCanvas from './components/FireworkCanvas'; // This is the 'Universe' mode
import FireworkModeCanvas from './components/FireworkModeCanvas'; // This is the new 'Firework' mode
import Controls from './components/Controls';

function App() {
  const {
    loadAudio,
    togglePlay,
    isPlaying,
    audioLoaded,
    getFrequencyData,
    getCurrentTime,
    analysisData
  } = useAudioAnalyzer();
  const [fileName, setFileName] = useState('');
  const [visualMode, setVisualMode] = useState<'universe' | 'firework'>('universe');

  const handleFileSelect = useCallback(async (file: File) => {
    setFileName(file.name);
    await loadAudio(file);
    togglePlay(); // Auto play after load
  }, [loadAudio, togglePlay]);

  const handleTryExample = useCallback(async () => {
    try {
      setFileName('Example: Badminton');
      const response = await fetch('/Badminton.mp3');
      if (!response.ok) throw new Error('Failed to fetch');
      const blob = await response.blob();
      const file = new File([blob], 'Badminton.mp3', { type: 'audio/mp3' });
      await loadAudio(file);
      togglePlay();
    } catch (e) {
      console.error(e);
      alert('Failed to load example. Please upload your own MP3!');
    }
  }, [loadAudio, togglePlay]);

  const handleReset = () => {
    window.location.reload(); // Simple way to reset everything
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {visualMode === 'universe' ? (
        <FireworkCanvas
          getFrequencyData={getFrequencyData}
          getCurrentTime={getCurrentTime}
          analysisData={analysisData}
          isPlaying={isPlaying}
        />
      ) : (
        <FireworkModeCanvas
          getFrequencyData={getFrequencyData}
          getCurrentTime={getCurrentTime}
          analysisData={analysisData}
          isPlaying={isPlaying}
        />
      )}

      <LandingPage
        onFileSelect={handleFileSelect}
        onTryExample={handleTryExample}
        audioLoaded={audioLoaded}
      />

      {audioLoaded && (
        <Controls
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onReset={handleReset}
          fileName={fileName}
          visualMode={visualMode}
          onModeChange={setVisualMode}
        />
      )}

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[128px] animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[128px] animate-pulse-slow"></div>
      </div>
    </div>
  );
}

export default App;
