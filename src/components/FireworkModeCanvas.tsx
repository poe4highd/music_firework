import React, { useRef, useEffect } from 'react';
import { FireworkEngine } from '../utils/fireworkEngine';
import type { AnalysisFrame } from '../hooks/useAudioAnalyzer';

interface FireworkModeCanvasProps {
    getFrequencyData: () => Uint8Array | null;
    getCurrentTime: () => number;
    analysisData: AnalysisFrame[];
    isPlaying: boolean;
}

const FireworkModeCanvas: React.FC<FireworkModeCanvasProps> = ({
    getFrequencyData,
    getCurrentTime
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<FireworkEngine | null>(null);

    useEffect(() => {
        // Fetch Mock Data
        fetch('/mock_audio_data.json')
            .then(res => res.json())
            .then(data => {
                if (engineRef.current) {
                    engineRef.current.setMockData(data);
                }
            })
            .catch(err => console.error('Failed to load mock data:', err));
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (engineRef.current) {
                engineRef.current.resize(canvas.width, canvas.height);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        if (!engineRef.current) {
            engineRef.current = new FireworkEngine(ctx, canvas.width, canvas.height);
        }

        let animationId: number;

        const render = () => {
            if (engineRef.current) {
                const data = getFrequencyData();
                const time = getCurrentTime();
                engineRef.current.update();
                engineRef.current.draw(data, time);
            }
            animationId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
        };
    }, [getFrequencyData, getCurrentTime]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none"
        />
    );
};

export default FireworkModeCanvas;
