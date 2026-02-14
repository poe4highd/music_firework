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
    keyCounts: number = 88; // Standard piano keys

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
        const count = Math.floor(10 + intensity * 20);
        for (let i = 0; i < count; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
            const speed = 2 + Math.random() * 8 * intensity;
            const life = 0.6 + Math.random() * 0.8;
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
                friction: 0.97
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
        this.drawGrass();
        this.drawPianoKeys(data);
        this.drawParticles();
    }

    private drawBackground() {
        const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, '#000814');
        grad.addColorStop(1, '#001d3d');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    private drawGrass() {
        const grassHeight = this.height * 0.25;
        const grad = this.ctx.createLinearGradient(0, this.height - grassHeight, 0, this.height);
        grad.addColorStop(0, '#2d6a4f');
        grad.addColorStop(1, '#081c15');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, this.height - grassHeight, this.width, grassHeight);

        // Subtle grass blades
        this.ctx.strokeStyle = 'rgba(116, 198, 157, 0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.width; i += 4) {
            const h = Math.random() * 20;
            this.ctx.beginPath();
            this.ctx.moveTo(i, this.height - grassHeight);
            this.ctx.lineTo(i + (Math.random() - 0.5) * 5, this.height - grassHeight - h);
            this.ctx.stroke();
        }
    }

    private drawPianoKeys(data: Uint8Array | null) {
        const grassY = this.height * 0.75;
        const keyWidth = this.width / this.keyCounts;
        const keyHeight = 4;

        for (let i = 0; i < this.keyCounts; i++) {
            const val = data ? data[Math.floor(i * (data.length / this.keyCounts))] : 0;
            const intensity = val / 255;

            // Draw matching "firework" if intensity is high
            if (intensity > 0.7 && Math.random() > 0.9) {
                const x = i * keyWidth + keyWidth / 2;
                const color = `hsla(${200 + intensity * 60}, 100%, 70%, 1)`;
                this.createFireworkBatch(x, grassY, color, intensity);
            }

            this.ctx.fillStyle = intensity > 0.5 ? '#fff' : 'rgba(255, 255, 255, 0.3)';
            this.ctx.shadowBlur = intensity * 20;
            this.ctx.shadowColor = '#fff';
            this.ctx.fillRect(i * keyWidth, grassY - keyHeight / 2, keyWidth - 1, keyHeight);
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
