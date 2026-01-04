import React, { useRef, useEffect } from 'react';
import { ParticleEngine } from '../utils/particleEngine';
import type { AnalysisFrame } from '../hooks/useAudioAnalyzer';

interface FireworkCanvasProps {
    getFrequencyData: () => Uint8Array | null;
    getCurrentTime: () => number;
    analysisData: AnalysisFrame[];
    isPlaying: boolean;
}

const FireworkCanvas: React.FC<FireworkCanvasProps> = ({
    getFrequencyData,
    getCurrentTime,
    analysisData,
    isPlaying
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<ParticleEngine | null>(null);
    const lastBassTime = useRef(0);
    const lastMidTime = useRef(0);
    const lastHighTime = useRef(0);
    const lastShiftTime = useRef(0);

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

        engineRef.current = new ParticleEngine(ctx, canvas.width, canvas.height);

        let animationId: number;

        const render = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (engineRef.current) {
                if (isPlaying) {
                    const time = getCurrentTime();
                    const frameIndex = Math.floor(time * 30);
                    const data = getFrequencyData();

                    let subVal = 0, kickVal = 0, vocVal = 0, hiVal = 0;

                    if (analysisData.length > 0 && frameIndex < analysisData.length) {
                        const frame = analysisData[frameIndex];
                        subVal = frame.subBass;
                        kickVal = frame.kick;
                        vocVal = frame.vocals;
                        hiVal = frame.highs;
                        analyzePhonetic(frame);
                    } else if (data) {
                        subVal = data[2] || 0;
                        kickVal = data[10] || 0;
                        vocVal = data[40] || 0;
                        hiVal = data[100] || 0;
                        analyzeRealtime(data);
                    }

                    const isClimax = kickVal > 240 || vocVal > 245 || hiVal > 240;

                    if (isPlaying) {
                        // Random Ship Battle Trigger (linked to energy)
                        if (time > 10 && Math.random() < 0.0005) {
                            engineRef.current.triggerShipBattle();
                        }

                        // Occasional Supernova on Climax
                        if (isClimax && Math.random() > 0.98) {
                            engineRef.current.createSupernova(
                                Math.random() * canvas.width,
                                Math.random() * canvas.height
                            );
                        }

                        // Random Meteors
                        if ((vocVal > 220 || hiVal > 180) && Math.random() > 0.95) {
                            engineRef.current.createMeteor();
                        }

                        // Star Shift Triggers (Every 5-10 seconds during intense peaks)
                        if (isClimax && time - lastShiftTime.current > 5 + Math.random() * 5) {
                            const rand = Math.random();
                            let mode: 'rotate' | 'drift' | 'zoom' = 'rotate';
                            if (rand > 0.66) mode = 'zoom';
                            else if (rand > 0.33) mode = 'drift';

                            engineRef.current.triggerStarShift(mode);
                            lastShiftTime.current = time;
                        }
                    }

                    engineRef.current.update(isClimax, isPlaying, time);
                    engineRef.current.draw(vocVal, subVal, kickVal, hiVal);
                }
            }

            animationId = requestAnimationFrame(render);
        };

        const analyzePhonetic = (frame: AnalysisFrame) => {
            const now = performance.now();

            // Sub-Bass (Plosives / Heavy beats)
            if (frame.subBass > 200 && now - lastBassTime.current > 400) {
                engineRef.current?.createFirework(
                    Math.random() * canvas.width,
                    canvas.height * 0.8,
                    'bass',
                    `hsl(340, 90%, 55%)`,
                    { count: 70, speed: 12, sizeScale: 1.5 }
                );
                lastBassTime.current = now;
            }

            // Highs (Fricatives/Sharp sounds - S, T, TS, P)
            // Trigger sharp, directional 'needle' fireworks
            if (frame.highs > 140 && now - lastHighTime.current > 150) {
                const angle = (Math.random() - 0.5) * Math.PI; // Upwards
                const isPlosiveHigh = frame.highs > 220; // Extra sharp peak

                engineRef.current?.createFirework(
                    Math.random() * canvas.width,
                    canvas.height * 0.2 + Math.random() * canvas.height * 0.2,
                    'high',
                    isPlosiveHigh ? '#fff' : `hsl(180, 100%, 75%)`,
                    {
                        count: isPlosiveHigh ? 30 : 15,
                        speed: isPlosiveHigh ? 25 : 20,
                        direction: angle,
                        spread: 0.1,
                        sizeScale: isPlosiveHigh ? 1.2 : 0.8
                    }
                );
                lastHighTime.current = now;
            }

            // Vocals (Vowels/Nasals)
            // Bloom based on "richness" (using ratio of vocals to highs)
            const richness = frame.vocals / (frame.highs + 1);
            if (frame.vocals > 160 && now - lastMidTime.current > 300) {
                const currentSize = richness > 1.8 ? 2.5 : 1.2;
                const color = richness > 1.8 ? 280 : 200; // Nasals/Deep = Purple, Light = Blue

                engineRef.current?.createFirework(
                    Math.random() * canvas.width,
                    canvas.height * 0.4 + Math.random() * canvas.height * 0.2,
                    'mid',
                    `hsl(${color}, 80%, 65%)`,
                    {
                        count: 40 + (richness * 10),
                        speed: 6 + richness,
                        sizeScale: currentSize
                    }
                );
                lastMidTime.current = now;
            }
        };

        const analyzeRealtime = (data: Uint8Array) => {
            const sub = avg(data.slice(0, 4));
            const mid = avg(data.slice(15, 40));
            const high = avg(data.slice(80, 120));
            const now = performance.now();

            if (sub > 210 && now - lastBassTime.current > 400) {
                spawnFirework('bass', `hsl(340, 90%, 55%)`, 0.8);
                lastBassTime.current = now;
            }
            if (mid > 160 && now - lastMidTime.current > 300) {
                spawnFirework('mid', `hsl(210, 85%, 60%)`, 0.5);
                lastMidTime.current = now;
            }
            if (high > 100 && now - lastHighTime.current > 150) {
                spawnFirework('high', `hsl(50, 100%, 75%)`, 0.2);
                lastHighTime.current = now;
            }
        };

        const spawnFirework = (type: 'bass' | 'mid' | 'high', color: string, yPos: number) => {
            engineRef.current?.createFirework(
                Math.random() * canvas.width,
                canvas.height * yPos + Math.random() * canvas.height * 0.1,
                type,
                color
            );
        };

        const avg = (arr: Uint8Array) => arr.reduce((a, b) => a + b, 0) / arr.length;

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
        };
    }, [isPlaying, analysisData, getCurrentTime, getFrequencyData]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none"
        />
    );
};

export default FireworkCanvas;
