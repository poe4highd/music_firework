import { useState, useCallback, useRef } from 'react';

export interface AnalysisFrame {
    subBass: number;   // 20-60Hz
    kick: number;      // 60-250Hz
    vocals: number;    // 500-2000Hz
    highs: number;     // 4000Hz+
}

export const useAudioAnalyzer = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioLoaded, setAudioLoaded] = useState(false);
    const [analysisData, setAnalysisData] = useState<AnalysisFrame[]>([]);

    const audioContext = useRef<AudioContext | null>(null);
    const analyzer = useRef<AnalyserNode | null>(null);
    const source = useRef<AudioBufferSourceNode | null>(null);
    const dataArray = useRef<Uint8Array | null>(null);
    const audioBuffer = useRef<AudioBuffer | null>(null);
    const startTime = useRef<number>(0);
    const pausedAt = useRef<number>(0);

    const preAnalyze = async (buffer: AudioBuffer) => {
        const frameRate = 30; // 30Hz sampling
        const duration = buffer.duration;
        const totalFrames = Math.floor(duration * frameRate);
        const frames: AnalysisFrame[] = [];

        // We use a simpler approach for speed: FFT analysis over chunks of the buffer
        // OfflineAudioContext is powerful but can be overkill for just visual pulsing
        const channelData = buffer.getChannelData(0);
        const sampleRate = buffer.sampleRate;
        const samplesPerFrame = Math.floor(sampleRate / frameRate);

        for (let i = 0; i < totalFrames; i++) {
            const startIdx = i * samplesPerFrame;
            const endIdx = startIdx + samplesPerFrame;
            if (endIdx > channelData.length) break;

            const chunk = channelData.slice(startIdx, endIdx);

            // Faux-FFT using weighted buckets
            let sub = 0, kick = 0, voc = 0, hi = 0;
            const len = chunk.length;

            for (let j = 0; j < len; j++) {
                const val = Math.abs(chunk[j]);
                // We use indices as a proxy for frequency in this simplified model
                // For better results, interleaved sampling or simple windowing
                if (j % 10 < 2) sub += val;
                else if (j % 10 < 4) kick += val;
                else if (j % 10 < 7) voc += val;
                else hi += val;
            }

            frames.push({
                subBass: (sub / (len * 0.2)) * 255 * 3,
                kick: (kick / (len * 0.2)) * 255 * 2.5,
                vocals: (voc / (len * 0.3)) * 255 * 2.2,
                highs: (hi / (len * 0.3)) * 255 * 3.5
            });
        }
        return frames;
    };

    const loadAudio = useCallback(async (file: File) => {
        if (!audioContext.current) {
            audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const arrayBuffer = await file.arrayBuffer();
        const decodedBuffer = await audioContext.current.decodeAudioData(arrayBuffer);
        audioBuffer.current = decodedBuffer;

        if (!analyzer.current) {
            analyzer.current = audioContext.current.createAnalyser();
            analyzer.current.fftSize = 1024; // Better resolution for real-time wave
            dataArray.current = new Uint8Array(analyzer.current.frequencyBinCount);
        }

        // Optional: Pre-analyze for smoother data
        const preData = await preAnalyze(decodedBuffer);
        setAnalysisData(preData);
        setAudioLoaded(true);
    }, []);

    const play = useCallback(() => {
        if (!audioContext.current || !audioBuffer.current || !analyzer.current) return;

        if (audioContext.current.state === 'suspended') {
            audioContext.current.resume();
        }

        source.current = audioContext.current.createBufferSource();
        source.current.buffer = audioBuffer.current;
        source.current.connect(analyzer.current);
        analyzer.current.connect(audioContext.current.destination);

        const offset = pausedAt.current;
        source.current.start(0, offset);
        startTime.current = audioContext.current.currentTime - offset;
        setIsPlaying(true);

        source.current.onended = () => {
            setIsPlaying(false);
        };
    }, []);

    const pause = useCallback(() => {
        if (source.current && isPlaying) {
            source.current.stop();
            pausedAt.current = audioContext.current!.currentTime - startTime.current;
            setIsPlaying(false);
        }
    }, [isPlaying]);

    const togglePlay = useCallback(() => {
        if (isPlaying) {
            pause();
        } else {
            play();
        }
    }, [isPlaying, play, pause]);

    const getFrequencyData = useCallback(() => {
        if (!analyzer.current || !dataArray.current) return null;
        analyzer.current.getByteFrequencyData(dataArray.current as any);
        return dataArray.current;
    }, []);

    const getCurrentTime = useCallback(() => {
        if (!audioContext.current) return 0;
        if (!isPlaying) return pausedAt.current;
        return audioContext.current.currentTime - startTime.current;
    }, [isPlaying]);

    const [aiStatus, setAiStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'failed'>('idle');
    const [aiProgress, setAiProgress] = useState('');
    const [aiData, setAiData] = useState<any>(null);

    const processWithAI = useCallback(async (file: File) => {
        setAiStatus('uploading');
        setAiProgress('正在上传音频...');

        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002';

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('include_audio', 'false');

            const uploadResp = await fetch(`${API_BASE}/api/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!uploadResp.ok) throw new Error('上传失败');
            const { task_id } = await uploadResp.json();

            setAiStatus('processing');
            setAiProgress('准备处理...');

            // Polling
            const poll = async () => {
                const res = await fetch(`${API_BASE}/api/task/${task_id}`).then(r => r.json());
                if (res.status === 'completed') {
                    setAiProgress('正在获取分析结果...');
                    const analysis = await fetch(`${API_BASE}${res.files[0]}`).then(r => r.json());
                    setAiData(analysis);
                    setAiStatus('completed');
                    setAiProgress('处理完成！');
                    return;
                }
                if (res.status === 'failed') {
                    throw new Error(res.error || '后端处理失败');
                }
                setAiProgress(res.progress || '正在分析中...');
                setTimeout(poll, 3000);
            };

            await poll();
        } catch (err: any) {
            console.error(err);
            setAiStatus('failed');
            setAiProgress(`错误: ${err.message}`);
        }
    }, []);

    return {
        loadAudio,
        togglePlay,
        isPlaying,
        audioLoaded,
        getFrequencyData,
        getCurrentTime,
        analysisData,
        analyzer: analyzer.current,
        // AI Integration
        processWithAI,
        aiStatus,
        aiProgress,
        aiData
    };
};

