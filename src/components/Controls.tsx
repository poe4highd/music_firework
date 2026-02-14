import React from 'react';

interface ControlsProps {
    isPlaying: boolean;
    onTogglePlay: () => void;
    onReset: () => void;
    fileName: string;
    visualMode: 'universe' | 'firework';
    onModeChange: (mode: 'universe' | 'firework') => void;
}

const Controls: React.FC<ControlsProps> = ({ isPlaying, onTogglePlay, onReset, fileName, visualMode, onModeChange }) => {
    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
            <div className="glass px-6 py-4 rounded-2xl flex items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Now Playing</p>
                    <p className="text-white font-medium truncate text-sm">{fileName}</p>
                </div>

                {/* Mode Toggle */}
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => onModeChange('universe')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${visualMode === 'universe'
                                ? 'bg-white text-black shadow-lg'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        UNIVERSE
                    </button>
                    <button
                        onClick={() => onModeChange('firework')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${visualMode === 'firework'
                                ? 'bg-white text-black shadow-lg'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        FIREWORK
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onTogglePlay}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-black hover:bg-gray-200 transition-colors shadow-lg"
                    >
                        {isPlaying ? (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                        ) : (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        )}
                    </button>

                    <button
                        onClick={onReset}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10"
                        title="Change Track"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Controls;
