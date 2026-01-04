import React, { useState } from 'react';

interface LandingPageProps {
    onFileSelect: (file: File) => void;
    onTryExample: () => void;
    audioLoaded: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onFileSelect, onTryExample, audioLoaded }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('audio/')) {
            onFileSelect(file);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    };

    if (audioLoaded) return null;

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-10 px-4">
            <div
                className={`glass p-8 md:p-12 rounded-3xl max-w-2xl w-full text-center transition-all duration-500 transform ${isDragging ? 'scale-105 border-white/40 bg-white/10' : 'scale-100'
                    }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
            >
                <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent text-glow">
                    Music Fireworks
                </h1>

                <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                    Watch your favorite tracks explode into a symphony of light.
                    Upload an MP3 to see the bass, vocals, and treble come alive as fireworks.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <h3 className="text-blue-400 font-semibold mb-1">Low (Bass)</h3>
                        <p className="text-xs text-gray-400">Large rhythmic explosions</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <h3 className="text-pink-400 font-semibold mb-1">Mids (Vocals)</h3>
                        <p className="text-xs text-gray-400">Colorful vibrant bursts</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <label className="cursor-pointer px-8 py-3 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-colors shadow-lg shadow-white/10">
                        Choose MP3
                        <input type="file" className="hidden" accept="audio/*" onChange={handleFileChange} />
                    </label>

                    <button
                        onClick={onTryExample}
                        className="px-8 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-full hover:bg-white/20 transition-all backdrop-blur-sm"
                    >
                        Try Example
                    </button>
                </div>

                <p className="mt-8 text-sm text-gray-500 animate-pulse">
                    Drag and drop your music file anywhere to begin
                </p>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-8 text-center opacity-50 max-w-lg">
                <div>
                    <span className="block text-2xl mb-1">🎵</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold">Analysis</span>
                </div>
                <div>
                    <span className="block text-2xl mb-1">✨</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold">Visualization</span>
                </div>
                <div>
                    <span className="block text-2xl mb-1">⚡</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold">Realtime</span>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
