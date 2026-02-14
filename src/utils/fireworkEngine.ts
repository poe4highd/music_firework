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
}

export class FireworkEngine {
    particles: FireworkParticle[] = [];
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    keyCounts: number = 88;

    constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
    }

    resize(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    createFireworkBatch(x: number, y: number, color: string, intensity: number) {
        const count = Math.floor(15 + intensity * 25);
        for (let i = 0; i < count; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
            const speed = 3 + Math.random() * 10 * intensity;
            const life = 0.5 + Math.random() * 1.0;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1,
                color,
                size: 1.5 + Math.random() * 2.5,
                life,
                maxLife: life,
                gravity: 0.18,
                friction: 0.96
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.vx *= p.friction;
            p.vy *= p.friction;
            p.vy += p.gravity;
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.016;
            p.alpha = Math.max(0, p.life / p.maxLife);
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw(data: Uint8Array | null) {
        this.drawBackground();
        this.drawGrassAndKeys(data);
        this.drawParticles();
    }

    private drawBackground() {
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

        for (let i = 0; i < this.keyCounts; i++) {
            const x = i * keyWidth;
            const freqIndex = Math.floor(i * (data?.length || 1024) / this.keyCounts);
            const val = data ? data[freqIndex] : 0;
            const intensity = val / 255;
            const centerX = x + keyWidth / 2;

            // Draw segmented grass
            this.ctx.save();
            const grassGrad = this.ctx.createLinearGradient(x, grassTopY, x, this.height);
            // Highlight grass if note is active
            const baseHue = 150; // Green
            const l = 10 + intensity * 30;
            grassGrad.addColorStop(0, `hsl(${baseHue}, 50%, ${l + 10}%)`);
            grassGrad.addColorStop(1, `hsl(${baseHue}, 60%, ${l}%)`);
            this.ctx.fillStyle = grassGrad;
            this.ctx.fillRect(x, grassTopY, keyWidth, grassHeight);

            // Draw blades aligned with key center
            if (intensity > 0.3) {
                this.ctx.strokeStyle = `hsla(${baseHue}, 70%, 70%, ${intensity * 0.4})`;
                this.ctx.lineWidth = 1;
                for (let b = 0; b < 3; b++) {
                    const bx = x + Math.random() * keyWidth;
                    const bh = 5 + Math.random() * 15 * intensity;
                    this.ctx.beginPath();
                    this.ctx.moveTo(bx, grassTopY);
                    this.ctx.lineTo(bx + (Math.random() - 0.5) * 4, grassTopY - bh);
                    this.ctx.stroke();
                }
            }
            this.ctx.restore();

            // Firework logic
            if (intensity > 0.75 && Math.random() > 0.92) {
                // Color mapping: Low keys (red/orange) -> High keys (blue/purple)
                const hue = (i / this.keyCounts) * 240 + 20;
                const color = `hsla(${hue}, 100%, 75%, 1)`;
                this.createFireworkBatch(centerX, grassTopY, color, intensity);
            }

            // Piano key rendering
            const keyHeight = 6;
            this.ctx.fillStyle = intensity > 0.4 ? '#fff' : 'rgba(255, 255, 255, 0.2)';
            if (intensity > 0.6) {
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = '#fff';
            }
            this.ctx.fillRect(x, grassTopY - keyHeight / 2, keyWidth - 1, keyHeight);
            this.ctx.shadowBlur = 0;
        }
    }

    private drawParticles() {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'lighter';
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.restore();
    }
}
