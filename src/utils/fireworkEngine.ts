export interface FireworkParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    color: string;
    size: number;
    life: number;
    maxLife: number;
    gravity: number;
    friction: number;
    type: 'spark' | 'note';
    shape?: string; // ♩, ♪, ♫
    rotation?: number;
    rotationSpeed?: number;
}

export interface SmokeParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    size: number;
    life: number;
    maxLife: number;
}

export class FireworkEngine {
    particles: FireworkParticle[] = [];
    smoke: SmokeParticle[] = [];
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    keyCounts: number = 88;
    noteShapes = ['♩', '♪', '♫', '♬'];

    constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
    }

    resize(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    createNoteParticle(x: number, y: number, color: string, intensity: number) {
        const shape = this.noteShapes[Math.floor(Math.random() * this.noteShapes.length)];
        const life = 1.0 + Math.random() * 1.5;
        this.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 2,
            vy: -2 - Math.random() * 4 * intensity,
            alpha: 1,
            color,
            size: 16 + intensity * 24,
            life,
            maxLife: life,
            gravity: -0.02, // Slighly floats up
            friction: 0.98,
            type: 'note',
            shape,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1
        });
    }

    createSmoke(x: number, y: number) {
        const life = 1.0 + Math.random() * 1.0;
        this.smoke.push({
            x, y,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -0.5 - Math.random() * 0.5,
            alpha: 0.3,
            size: 10 + Math.random() * 20,
            life,
            maxLife: life
        });
    }

    createFireworkBatch(x: number, y: number, color: string, intensity: number) {
        // Sparks
        const count = Math.floor(10 + intensity * 15);
        for (let i = 0; i < count; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
            const speed = 2 + Math.random() * 8 * intensity;
            const life = 0.4 + Math.random() * 0.6;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1,
                color,
                size: 1 + Math.random() * 2,
                life,
                maxLife: life,
                gravity: 0.15,
                friction: 0.96,
                type: 'spark'
            });
        }

        // Always one big note
        this.createNoteParticle(x, y, color, intensity);
    }

    update() {
        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.vx *= p.friction;
            p.vy *= p.friction;
            p.vy += p.gravity;
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.016;
            p.alpha = Math.max(0, p.life / p.maxLife);

            if (p.type === 'note') {
                p.rotation! += p.rotationSpeed!;
                if (Math.random() > 0.8) this.createSmoke(p.x, p.y);
            }

            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Smoke
        for (let i = this.smoke.length - 1; i >= 0; i--) {
            const s = this.smoke[i];
            s.x += s.vx;
            s.y += s.vy;
            s.size += 0.5;
            s.life -= 0.016;
            s.alpha = Math.max(0, (s.life / s.maxLife) * 0.3);
            if (s.life <= 0) this.smoke.splice(i, 1);
        }
    }

    private lastProcessTime: number = 0;
    private mockData: any = null;

    setMockData(data: any) {
        this.mockData = data;
    }

    draw(data: Uint8Array | null, time: number = 0) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawBackground();

        if (this.mockData) {
            this.drawDataDriven(time);
        } else {
            this.drawGrassAndKeys(data);
        }

        this.drawSmoke();
        this.drawParticles();
    }

    private drawDataDriven(time: number) {
        if (!this.mockData) return;

        const { drums, vocals, bass, other } = this.mockData.tracks;
        const grassTopY = this.height * 0.75;

        // 1. Drums -> Fireworks Trigger (Onset)
        // Check for new onsets between lastProcessTime and current time
        if (drums.events) {
            drums.events.forEach((onset: number) => {
                if (onset > this.lastProcessTime && onset <= time) {
                    const x = this.width * (0.3 + Math.random() * 0.4); // Random center-ish
                    const intensity = this.getInterpolatedValue(drums.energy, time, 0.1);
                    const hue = 0; // Red for drums
                    this.createFireworkBatch(x, grassTopY, `hsla(${hue}, 100%, 70%, 1)`, intensity || 0.8);
                }
            });
        }

        // 2. Vocals -> Central Glow (Energy)
        const vocalIntensity = this.getInterpolatedValue(vocals.energy, time, 0.1);
        if (vocalIntensity > 0) {
            const centerX = this.width / 2;
            const centerY = this.height / 2;
            const grad = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 100 + vocalIntensity * 200);
            const centroidNorm = this.getInterpolatedValue(vocals.centroid, time, 0.1) || 0;
            const hue = 40 + centroidNorm * 240; // Map 0-1 to hue 40 (orange) - 280 (purple)
            grad.addColorStop(0, `hsla(${hue}, 100%, 60%, ${vocalIntensity * 0.3})`);
            grad.addColorStop(1, 'transparent');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        // 3. Bass -> Floor Vibration
        const bassIntensity = this.getInterpolatedValue(bass.energy, time, 0.1);
        this.ctx.fillStyle = `rgba(100, 50, 255, ${bassIntensity * 0.2})`;
        this.ctx.fillRect(0, grassTopY, this.width, this.height - grassTopY);

        // 4. Other -> Floating Notes
        if (other.onsets) {
            other.onsets.forEach((onset: number) => {
                if (onset > this.lastProcessTime && onset <= time) {
                    const x = Math.random() * this.width;
                    const val = this.getInterpolatedValue(other.energy, time, 0.1);
                    this.createNoteParticle(x, grassTopY, 'rgba(255, 255, 255, 0.8)', val || 0.5);
                }
            });
        }

        this.lastProcessTime = time;
    }

    private getInterpolatedValue(arr: number[] | undefined, time: number, step: number): number {
        if (!arr || arr.length === 0) return 0;
        const index = Math.floor(time / step);
        if (index >= arr.length) return arr[arr.length - 1];
        if (index < 0) return arr[0];

        // Simple linear interpolation
        const nextIndex = Math.min(index + 1, arr.length - 1);
        const t = (time % step) / step;
        return arr[index] * (1 - t) + arr[nextIndex] * t;
    }

    private drawBackground() {
        // ... (remaining code unchanged)
        const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, '#000814');
        grad.addColorStop(0.7, '#001d3d');
        grad.addColorStop(1, '#003566');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    private drawGrassAndKeys(data: Uint8Array | null) {
        const keyWidth = this.width / this.keyCounts;
        const grassHeight = this.height * 0.25;
        const grassTopY = this.height - grassHeight;

        // Logarithmic Mapping to 88 Keys:
        // Piano Range: A0 (27.5Hz) to C8 (4186Hz)
        // FFT Bins (1024 points, 44.1kHz): Bin size ~43Hz.
        // We focus on the audible piano range to spread energy across all keys.
        const minFreq = 20;
        const maxFreq = 5000;
        const logMin = Math.log10(minFreq);
        const logMax = Math.log10(maxFreq);

        for (let i = 0; i < this.keyCounts; i++) {
            const x = i * keyWidth;

            // Calculate logarithmic frequency for this key
            const logFreq = logMin + (i / this.keyCounts) * (logMax - logMin);
            const freq = Math.pow(10, logFreq);

            // Map frequency to FFT index (assuming 44100 sample rate and 1024 FFT size)
            const freqIndex = Math.floor(freq / 43.06);

            const val = data ? data[Math.min(freqIndex, (data.length - 1))] : 0;
            const intensity = val / 255;
            const centerX = x + keyWidth / 2;

            // Draw segmented grass
            this.ctx.save();
            const grassGrad = this.ctx.createLinearGradient(x, grassTopY, x, this.height);
            const baseHue = 150;
            const l = 8 + intensity * 25;
            grassGrad.addColorStop(0, `hsl(${baseHue}, 40%, ${l + 8}%)`);
            grassGrad.addColorStop(1, `hsl(${baseHue}, 50%, ${l}%)`);
            this.ctx.fillStyle = grassGrad;
            this.ctx.fillRect(x, grassTopY, keyWidth, grassHeight);
            this.ctx.restore();

            // Firework logic - precise trigger
            if (intensity > 0.8 && Math.random() > 0.94) {
                const hue = (i / this.keyCounts) * 220 + 40;
                const color = `hsla(${hue}, 100%, 75%, 1)`;
                this.createFireworkBatch(centerX, grassTopY, color, intensity);
            }

            // Piano key rendering
            const keyHeight = 6;
            this.ctx.fillStyle = intensity > 0.4 ? '#fff' : 'rgba(255, 255, 255, 0.15)';
            if (intensity > 0.6) {
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#fff';
            }
            this.ctx.fillRect(x, grassTopY - keyHeight / 2, keyWidth - 1, keyHeight);
            this.ctx.shadowBlur = 0;
        }
    }

    private drawSmoke() {
        this.ctx.save();
        this.smoke.forEach(s => {
            const grad = this.ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size);
            grad.addColorStop(0, `rgba(200, 200, 220, ${s.alpha})`);
            grad.addColorStop(1, 'transparent');
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.restore();
    }

    private drawParticles() {
        this.ctx.save();
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.alpha;
            if (p.type === 'spark') {
                this.ctx.globalCompositeOperation = 'lighter';
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Note Particle
                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.rotation!);
                this.ctx.font = `${p.size}px serif`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillStyle = p.color;
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = p.color;
                this.ctx.fillText(p.shape!, 0, 0);
                this.ctx.restore();
            }
        });
        this.ctx.restore();
    }
}
