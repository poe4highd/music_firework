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
    getFrequencyData
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<FireworkEngine | null>(null);

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

        engineRef.current = new FireworkEngine(ctx, canvas.width, canvas.height);

        let animationId: number;

        const render = () => {
            if (engineRef.current) {
                const data = getFrequencyData();
                engineRef.current.update();
                engineRef.current.draw(data);
            }
            animationId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
        };
    }, [getFrequencyData]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none"
        />
    );
};

export default FireworkModeCanvas;
