export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    color: string;
    size: number;
    life: number;
    maxLife: number;
    friction: number;
    gravity: number;
}

export interface Meteor {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    life: number;
}

export interface Supernova {
    x: number;
    y: number;
    size: number;
    maxSize: number;
    alpha: number;
    color: string;
    life: number;
}

export interface Ship {
    x: number;
    y: number;
    vx: number;
    vy: number;
    baseY: number;
    type: 'cigar' | 'ufo';
    side: 'left' | 'right';
    health: number;
    lastShot: number;
    angle: number;           // For UFO S-curves
    speedPhase: number;      // For UFO slow-down/backward
    isExploding: boolean;
    oscillateSpeed: number;
    vertAmp: number;         // Individual oscillation amplitude
    driftY: number;          // Slow vertical drift speed
    pathOffset: number;      // Random start phase for path jitter
}

export interface Projectile {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    type: 'laser' | 'wave';
}

export interface OrbitConfig {
    r: number;
    e: number;
    tilt: number;
    color: string;
    baseSpeed: number;
}

export type FireworkType = 'bass' | 'mid' | 'high';

export class ParticleEngine {
    particles: Particle[] = [];
    meteors: Meteor[] = [];
    ships: Ship[] = [];
    projectiles: Projectile[] = [];
    supernovas: Supernova[] = [];
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    stars: { x: number, y: number, px: number, py: number, size: number, opacity: number, breatheSpeed: number, offset: number, angle: number, dist: number }[] = [];
    orbitTimes: number[] = new Array(8).fill(0);
    startTime: number = 0;
    orbits: OrbitConfig[] = [];
    nebulae: { x: number, y: number, r: number, color: string }[] = [];
    starShiftMode: 'normal' | 'rotate' | 'drift' | 'zoom' = 'normal';
    starShiftTime: number = 0;
    starShiftDuration: number = 2500;
    starShiftDirection: number = 1; // 1 or -1
    starShiftSpeed: number = 1;
    starShiftAngle: number = 0;

    // Internal Visibility States for exit sequence
    visStars: number = 0;
    visCore: number = 0;
    visSolar: number = 0;
    visComet: number = 0;
    exitStartTimes: { stars?: number, core?: number, solar?: number, comet?: number } = {};

    constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.initStars();
        this.initNebulae();
        this.randomizeOrbits();
        this.startTime = Date.now();
    }

    initNebulae() {
        this.nebulae = [];
        const colors = [
            'hsla(260, 80%, 30%, 0.15)', // Purple
            'hsla(200, 90%, 25%, 0.12)', // Deep Blue
            'hsla(320, 70%, 35%, 0.10)', // Pink/Nebula
            'hsla(180, 80%, 20%, 0.08)'  // Cyan
        ];
        for (let i = 0; i < 5; i++) {
            this.nebulae.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                r: this.width * (0.3 + Math.random() * 0.4),
                color: colors[i % colors.length]
            });
        }
    }

    randomizeOrbits() {
        this.orbits = [];
        const baseColors = [30, 50, 200, 10, 40, 60, 190, 220]; // Original base hue hints
        for (let i = 0; i < 8; i++) {
            this.orbits.push({
                r: 0.12 + (i * 0.08) + (Math.random() * 0.04),
                e: 0.3 + Math.random() * 0.5,
                tilt: (Math.random() - 0.5) * 1.2,
                color: `${baseColors[i]}, ${70 + Math.random() * 20}%, ${60 + Math.random() * 20}%`,
                baseSpeed: 0.002 + (0.02 / (i + 1)) + (Math.random() * 0.005)
            });
        }
    }

    initStars() {
        this.stars = [];
        const cx = this.width / 2;
        const cy = this.height / 2;
        for (let i = 0; i < 400; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const dist = Math.hypot(x - cx, y - cy);
            const angle = Math.atan2(y - cy, x - cx);
            this.stars.push({
                x, y, px: x, py: y,
                size: Math.random() * 1.5,
                opacity: Math.random(),
                breatheSpeed: 0.001 + Math.random() * 0.003,
                offset: Math.random() * Math.PI * 2,
                angle, dist
            });
        }
    }

    triggerStarShift(mode: 'rotate' | 'drift' | 'zoom') {
        if (this.starShiftMode !== 'normal') return;
        this.starShiftMode = mode;
        this.starShiftTime = Date.now();
        this.starShiftDirection = Math.random() > 0.5 ? 1 : -1;
        this.starShiftAngle = Math.random() * Math.PI * 2;

        // Custom duration/speed for zoom
        if (mode === 'zoom') {
            this.starShiftDuration = 4000;
            this.starShiftSpeed = 0.5 + Math.random() * 0.5; // Slower
        } else {
            this.starShiftDuration = 2500;
            this.starShiftSpeed = 0.6 + Math.random() * 1.8;
        }
    }

    resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.initStars();
        this.initNebulae();
    }

    createFirework(x: number, y: number, type: FireworkType, color: string, options: {
        count?: number,
        speed?: number,
        direction?: number,
        spread?: number,
        sizeScale?: number
    } = {}) {
        let count = options.count || 0;
        let speedMult = options.speed || 1;
        let sizeScale = options.sizeScale || 1;
        let sizeRange = [1, 3];

        if (!options.count) {
            switch (type) {
                case 'bass': count = 60; speedMult = 10; sizeRange = [2, 4]; break;
                case 'mid': count = 40; speedMult = 6; sizeRange = [1.5, 3]; break;
                case 'high': count = 20; speedMult = 15; sizeRange = [1, 2]; break;
            }
        }

        if (this.particles.length > 4000) return;

        for (let i = 0; i < count; i++) {
            const angle = options.direction !== undefined
                ? options.direction + (Math.random() - 0.5) * (options.spread || Math.PI * 2)
                : Math.random() * Math.PI * 2;

            const speed = Math.random() * speedMult;
            const life = 0.5 + Math.random() * 1.2;

            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1,
                color,
                size: (sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0])) * sizeScale,
                life,
                maxLife: life,
                friction: 0.96,
                gravity: type === 'bass' ? 0.2 : 0.05
            });
        }
    }

    createSupernova(x: number, y: number) {
        this.supernovas.push({
            x, y,
            size: 0,
            maxSize: 300 + Math.random() * 400,
            alpha: 1,
            color: `hsl(${Math.random() * 360}, 80%, 90%)`,
            life: 1
        });
    }

    createMeteor() {
        const side = Math.random() > 0.5;
        const x = side ? -10 : this.width + 10;
        const y = Math.random() * this.height * 0.4;
        const vx = side ? 15 + Math.random() * 10 : -(15 + Math.random() * 10);
        const vy = 2 + Math.random() * 4;

        this.meteors.push({
            x, y, vx, vy,
            size: 2 + Math.random() * 2,
            color: `hsl(${Math.random() * 60 + 180}, 100%, 80%)`,
            life: 1
        });
    }

    triggerShipBattle() {
        if (this.ships.length > 0) return;

        // Wider starting range: middle 60% of screen
        const leftY = Math.random() * this.height * 0.6 + this.height * 0.2;
        const rightY = Math.random() * this.height * 0.6 + this.height * 0.2;

        this.ships.push({
            x: -250, y: leftY,
            vx: 1.8 + Math.random() * 1.5,
            vy: 0,
            baseY: leftY,
            type: 'cigar', side: 'left',
            health: 200, lastShot: 0, angle: 0, speedPhase: 0, isExploding: false,
            oscillateSpeed: 0.0015 + Math.random() * 0.003,
            vertAmp: 50 + Math.random() * 150,
            driftY: (Math.random() - 0.5) * 0.8,
            pathOffset: Math.random() * Math.PI * 2
        });

        this.ships.push({
            x: this.width + 250, y: rightY,
            vx: -(2.0 + Math.random() * 1.5),
            vy: 0,
            baseY: rightY,
            type: 'ufo', side: 'right',
            health: 180, lastShot: 0, angle: 0, speedPhase: 0, isExploding: false,
            oscillateSpeed: 0.02 + Math.random() * 0.05,
            vertAmp: 80 + Math.random() * 180,
            driftY: (Math.random() - 0.5) * 1.0,
            pathOffset: Math.random() * Math.PI * 2
        });
    }

    update(isHighEnergy: boolean, isPlaying: boolean, currentTime: number) {
        const now = Date.now();

        // Handle Staggered Entry/Exit
        if (isPlaying) {
            // Entry sequence
            this.visStars = Math.min(this.visStars + 0.01, Math.min(currentTime / 2, 1));
            this.visCore = Math.min(this.visCore + 0.01, Math.max(0, Math.min((currentTime - 2) / 2, 1)));
            this.visSolar = Math.min(this.visSolar + 0.01, Math.max(0, Math.min((currentTime - 4) / 4, 1)));
            this.visComet = Math.min(this.visComet + 0.01, Math.max(0, Math.min((currentTime - 3) / 3, 1)));
            this.exitStartTimes = {};
        } else {
            // Exit sequence with random delays
            if (!this.exitStartTimes.stars) {
                const delays = [0, 500, 1000, 1500].sort(() => Math.random() - 0.5);
                this.exitStartTimes = {
                    stars: now + delays[0],
                    core: now + delays[1],
                    solar: now + delays[2],
                    comet: now + delays[3]
                };
            }
            if (now > (this.exitStartTimes.stars || 0)) this.visStars = Math.max(0, this.visStars - 0.01);
            if (now > (this.exitStartTimes.core || 0)) this.visCore = Math.max(0, this.visCore - 0.015);
            if (now > (this.exitStartTimes.solar || 0)) this.visSolar = Math.max(0, this.visSolar - 0.008);
            if (now > (this.exitStartTimes.comet || 0)) this.visComet = Math.max(0, this.visComet - 0.012);
        }

        // Supernovas
        for (let i = this.supernovas.length - 1; i >= 0; i--) {
            const s = this.supernovas[i];
            s.size += (s.maxSize - s.size) * 0.05;
            s.life -= 0.01;
            s.alpha = Math.max(0, s.life);
            if (s.life <= 0) this.supernovas.splice(i, 1);
        }

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
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Star Shift Logic Update
        if (this.starShiftMode !== 'normal') {
            const elapsed = now - this.starShiftTime;
            if (elapsed > this.starShiftDuration) {
                this.starShiftMode = 'normal';
            } else {
                const cx = this.width / 2;
                const cy = this.height / 2;
                const progress = Math.sin((elapsed / this.starShiftDuration) * Math.PI); // Smooth in/out

                this.stars.forEach(star => {
                    star.px = star.x;
                    star.py = star.y;
                    const speed = this.starShiftSpeed * progress;

                    if (this.starShiftMode === 'rotate') {
                        star.angle += 0.05 * this.starShiftDirection * speed;
                        star.x = cx + Math.cos(star.angle) * star.dist;
                        star.y = cy + Math.sin(star.angle) * star.dist;
                    } else if (this.starShiftMode === 'drift') {
                        // Multi-directional drift based on starShiftAngle
                        const dx = Math.cos(this.starShiftAngle) * 50 * speed;
                        const dy = Math.sin(this.starShiftAngle) * 50 * speed;
                        star.x += dx;
                        star.y += dy;

                        // Wrap around screen
                        if (star.x < -100) star.x += this.width + 200;
                        if (star.x > this.width + 100) star.x -= this.width + 200;
                        if (star.y < -100) star.y += this.height + 200;
                        if (star.y > this.height + 100) star.y -= this.height + 200;
                    } else if (this.starShiftMode === 'zoom') {
                        // Radial expansion/contraction + light spiral
                        // Double displacement (from 0.8 to 1.6)
                        const zoomFactor = 1 + (this.starShiftDirection * 1.6 * speed);
                        const spiralFactor = 0.03 * this.starShiftDirection * speed;

                        const tempDist = star.dist * zoomFactor;
                        const tempAngle = star.angle + spiralFactor;

                        star.x = cx + Math.cos(tempAngle) * tempDist;
                        star.y = cy + Math.sin(tempAngle) * tempDist;
                    }
                });
            }
        } else {
            // Keep px sync for normal breathing stars
            this.stars.forEach(star => {
                star.px = star.x;
                star.py = star.y;
            });
        }

        // Meteors update...
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const m = this.meteors[i];
            m.x += m.vx; m.y += m.vy;
            if (m.x < -100 || m.x > this.width + 100 || m.y > this.height + 100) this.meteors.splice(i, 1);
        }

        // Ships & Advanced AI
        this.ships.forEach(ship => {
            if (ship.isExploding) return;

            // Dynamic complex flight path
            ship.angle += ship.oscillateSpeed;
            ship.speedPhase += 0.015;
            ship.baseY += ship.driftY; // Slow vertical migration

            // Combine two waves for "unpredictable" organic motion
            const mainOsc = Math.sin(ship.angle) * ship.vertAmp;
            const microOsc = Math.sin(ship.angle * 2.5 + ship.pathOffset) * (ship.vertAmp * 0.2);

            const speedMod = Math.sin(ship.speedPhase) * 6; // Unpredictable acceleration

            ship.y = ship.baseY + mainOsc + microOsc;
            ship.x += ship.vx + speedMod;

            // Combat Logic: Shot when close OR when music is high energy
            const other = this.ships.find(s => s !== ship);
            const isNear = other && Math.abs(ship.x - other.x) < 600;

            if ((isNear || isHighEnergy) && now - ship.lastShot > 500 && other) {
                if (ship.type === 'ufo') {
                    // UFO: Cyan wave/particles
                    this.projectiles.push({
                        x: ship.x, y: ship.y,
                        vx: other.x, vy: other.y,
                        color: 'rgba(50, 255, 255, 1)',
                        type: 'wave'
                    });
                    other.health -= 25;
                    this.createFirework(other.x, other.y, 'high', '#0ff', { count: 12, speed: 5 });
                } else {
                    // Cigar: High-speed double laser
                    const ang = Math.atan2(other.y - ship.y, other.x - ship.x);
                    this.projectiles.push({
                        x: ship.x, y: ship.y,
                        vx: Math.cos(ang) * 15,
                        vy: Math.sin(ang) * 15,
                        color: '#ff3333',
                        type: 'laser'
                    });
                }
                ship.lastShot = now;
            }
        });

        // Projectile update
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const pr = this.projectiles[i];
            if (pr.type === 'laser') {
                pr.x += pr.vx; pr.y += pr.vy;
                // Collision
                this.ships.forEach(s => {
                    if (Math.hypot(s.x - pr.x, s.y - pr.y) < 35) {
                        s.health -= 30;
                        this.createFirework(pr.x, pr.y, 'high', pr.color, { count: 20, speed: 8 });
                        this.projectiles.splice(i, 1);
                    }
                });
                if (pr.x < -250 || pr.x > this.width + 250) this.projectiles.splice(i, 1);
            } else {
                // Wave is instantaneous, remove next frame
                this.projectiles.splice(i, 1);
            }
        }

        // Ship death
        for (let i = this.ships.length - 1; i >= 0; i--) {
            const s = this.ships[i];
            if (s.health <= 0 || s.x < -700 || s.x > this.width + 700) {
                if (s.health <= 0) {
                    this.createFirework(s.x, s.y, 'bass', '#fff', { count: 180, speed: 22, sizeScale: 3 });
                    this.createFirework(s.x, s.y, 'mid', '#ff0', { count: 100, speed: 14 });
                    this.createSupernova(s.x, s.y);
                }
                this.ships.splice(i, 1);
            }
        }
    }

    drawNebulae() {
        this.nebulae.forEach(n => {
            this.ctx.save();
            const grad = this.ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
            grad.addColorStop(0, n.color);
            grad.addColorStop(1, 'transparent');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.restore();
        });
    }

    drawStars(visibility: number) {
        if (visibility <= 0) return;
        const now = Date.now();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineCap = 'round';

        this.stars.forEach(star => {
            const breath = Math.sin(now * star.breatheSpeed + star.offset) * 0.4 + 0.6;
            this.ctx.globalAlpha = visibility * star.opacity * breath;

            if (this.starShiftMode !== 'normal') {
                // Draw trails during shifts
                this.ctx.lineWidth = star.size;
                this.ctx.beginPath();
                this.ctx.moveTo(star.px, star.py);
                this.ctx.lineTo(star.x, star.y);
                this.ctx.stroke();
            } else {
                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(star.x, star.y, star.size, star.size);
            }
        });
        this.ctx.globalAlpha = 1;
    }

    drawSupernovas() {
        this.supernovas.forEach(s => {
            this.ctx.save();
            this.ctx.globalAlpha = s.alpha;
            const grad = this.ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size);
            grad.addColorStop(0, '#fff');
            grad.addColorStop(0.2, s.color);
            grad.addColorStop(1, 'transparent');
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    drawGalaxyCore(vocEnergy: number, visibility: number) {
        if (visibility <= 0) return;
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const pulse = (vocEnergy / 255) * 40;
        this.ctx.save();
        this.ctx.globalAlpha = visibility;
        const grad = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, (40 + pulse) * visibility);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.3, '#ffcc00');
        grad.addColorStop(0.6, 'rgba(255, 100, 0, 0.4)');
        grad.addColorStop(1, 'transparent');
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, (80 + pulse) * visibility, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawSolarSystem(sub: number, kick: number, voc: number, hi: number, visibility: number) {
        if (visibility <= 0) return;
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const energies = [sub, kick, voc, hi, sub, kick, voc, hi];

        this.ctx.save();
        this.ctx.globalCompositeOperation = 'lighter';

        this.orbits.forEach((orbit, i) => {
            const orbitThreshold = i / 8;
            const orbitVis = Math.max(0, Math.min((visibility - orbitThreshold) * 8, 1));
            if (orbitVis <= 0) return;

            const energy = energies[i];
            this.orbitTimes[i] += orbit.baseSpeed + (energy / 255) * 0.05;
            const rx = this.width * orbit.r + (energy * 0.1);
            const ry = rx * orbit.e;

            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(orbit.tilt);
            this.ctx.globalAlpha = orbitVis;

            const angle = this.orbitTimes[i];

            // Draw trailing arc instead of full orbit line
            // We draw about 1/3 to 1/2 of the ellipse backwards
            const trailLength = Math.PI * 0.8;
            const segments = 15;
            for (let j = 0; j < segments; j++) {
                const alpha = (1 - j / segments) * 0.25;
                const segAngle = angle - (j / segments) * trailLength;
                const sx = Math.cos(segAngle) * rx;
                const sy = Math.sin(segAngle) * ry;
                const prevSegAngle = angle - ((j + 1) / segments) * trailLength;
                const psx = Math.cos(prevSegAngle) * rx;
                const psy = Math.sin(prevSegAngle) * ry;

                this.ctx.beginPath();
                this.ctx.strokeStyle = `hsla(${orbit.color}, ${alpha})`;
                this.ctx.lineWidth = 2;
                this.ctx.moveTo(sx, sy);
                this.ctx.lineTo(psx, psy);
                this.ctx.stroke();
            }

            const px = Math.cos(angle) * rx;
            const py = Math.sin(angle) * ry;
            const pSize = (4 + (energy / 255) * 8) * orbitVis;

            this.ctx.beginPath();
            this.ctx.arc(px, py, pSize, 0, Math.PI * 2);
            this.ctx.fillStyle = `hsl(${orbit.color})`;
            this.ctx.fill();
            this.ctx.restore();
        });
        this.ctx.restore();
    }

    drawComet(voc: number, visibility: number = 1) {
        if (visibility <= 0) return;
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const time = Date.now() * 0.00006;

        // Extremely flat, elongated orbit (e ~ 0.95)
        const a = this.width * 2.5; // semi-major axis
        const e = 0.96;              // high eccentricity
        const b = a * Math.sqrt(1 - e * e); // semi-minor axis
        const tilt = 0.4;

        // Shift origin so focus (Sun) is at (centerX, centerY)
        const focusOffset = a * e;

        const angle = time;
        // Ellipse coords centered at origin
        const ex = Math.cos(angle) * a;
        const ey = Math.sin(angle) * b;

        // Map px/py to screen with tilt and focus shift
        const px = centerX + (ex - focusOffset) * Math.cos(tilt) - ey * Math.sin(tilt);
        const py = centerY + (ex - focusOffset) * Math.sin(tilt) + ey * Math.cos(tilt);

        if (px > -400 && px < this.width + 400 && py > -400 && py < this.height + 400) {
            this.ctx.save();
            this.ctx.globalAlpha = visibility;
            this.ctx.globalCompositeOperation = 'lighter';

            // Tail direction: ALWAYS pointing away from the sun (centerX, centerY)
            const diffX = px - centerX;
            const diffY = py - centerY;
            const dist = Math.hypot(diffX, diffY);
            const dx = diffX / dist;
            const dy = diffY / dist;

            // Sparkling "Solar Wind" ice crystal tail
            for (let i = 0; i < 18; i++) {
                const trailAge = i * 12 + Math.random() * 10;
                const tx = px + dx * trailAge;
                const ty = py + dy * trailAge;

                const tSize = Math.max(0.2, 3.5 - i * 0.18);
                const opacity = Math.max(0, 1 - i / 18);
                this.ctx.fillStyle = `rgba(220, 240, 255, ${opacity})`;
                this.ctx.beginPath();
                this.ctx.arc(tx, ty, tSize, 0, Math.PI * 2);
                this.ctx.fill();

                if (Math.random() > 0.6) {
                    this.createFirework(tx, ty, 'high', '#fff', {
                        count: 1,
                        speed: 1.0 + Math.random() * 2,
                        direction: Math.atan2(dy, dx),
                        spread: 0.3,
                        sizeScale: 0.4
                    });
                }
            }

            const headPulse = 6 + (voc / 255) * 8;
            this.ctx.beginPath();
            this.ctx.arc(px, py, headPulse, 0, Math.PI * 2);
            this.ctx.fillStyle = '#fff';
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    drawShips() {
        this.ships.forEach(s => {
            this.ctx.save();
            this.ctx.translate(s.x, s.y);
            if (s.type === 'cigar') {
                // Pearl White Rounded Cigar
                const grad = this.ctx.createLinearGradient(-45, 0, 45, 0);
                grad.addColorStop(0, '#dcdcdc');
                grad.addColorStop(0.5, '#ffffff');
                grad.addColorStop(1, '#dcdcdc');
                this.ctx.fillStyle = grad;

                // Use rounded path for corners
                const w = 100, h = 20, r = 10;
                this.ctx.beginPath();
                this.ctx.moveTo(-w / 2 + r, -h / 2);
                this.ctx.arcTo(w / 2, -h / 2, w / 2, h / 2, r);
                this.ctx.arcTo(w / 2, h / 2, -w / 2, h / 2, r);
                this.ctx.arcTo(-w / 2, h / 2, -w / 2, -h / 2, r);
                this.ctx.arcTo(-w / 2, -h / 2, w / 2, -h / 2, r);
                this.ctx.closePath();
                this.ctx.fill();

                // Windows/Lights
                this.ctx.fillStyle = '#ff3333';
                this.ctx.beginPath();
                this.ctx.arc(35, 0, 3, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Silver White UFO
                this.ctx.fillStyle = '#dcdcdc'; // Silver base
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, 45, 14, 0, 0, Math.PI * 2);
                this.ctx.fill();
                // Dome
                this.ctx.beginPath();
                this.ctx.arc(0, -6, 22, Math.PI, 0);
                this.ctx.fillStyle = 'rgba(180, 250, 255, 0.75)';
                this.ctx.fill();
            }
            this.ctx.restore();
        });

        this.projectiles.forEach(pr => {
            if (pr.type === 'laser') {
                this.ctx.fillStyle = pr.color;
                this.ctx.beginPath();
                this.ctx.arc(pr.x, pr.y, 4, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Electromagnetic wave (instant connection)
                this.ctx.save();
                this.ctx.strokeStyle = '#0ffffa';
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([8, 4]);
                this.ctx.beginPath();
                this.ctx.moveTo(pr.x, pr.y);
                this.ctx.lineTo(pr.vx, pr.vy); // vx/vy used as target
                this.ctx.stroke();
                this.ctx.restore();
            }
        });
    }

    draw(vocVal: number, subVal: number, kickVal: number, hiVal: number) {
        this.drawNebulae();

        // Background cosmic elements with self-managed visibility
        this.drawStars(this.visStars);
        this.drawGalaxyCore(vocVal, this.visCore);
        this.drawSolarSystem(subVal, kickVal, vocVal, hiVal, this.visSolar);
        this.drawComet(vocVal, this.visComet);

        this.drawSupernovas();
        this.drawShips();

        // Projectiles
        this.ctx.save();
        this.projectiles.forEach(p => {
            this.ctx.fillStyle = p.color;
            if (p.type === 'laser') {
                this.ctx.fillRect(p.x - 10, p.y - 1, 20, 2);
            } else if (p.type === 'wave') {
                this.ctx.strokeStyle = p.color;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(p.x, p.y);
                this.ctx.lineTo(p.vx, p.vy); // vx/vy used as target
                this.ctx.stroke();
            } else {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        this.ctx.restore();

        // Meteors
        this.ctx.save();
        this.ctx.lineWidth = 2;
        this.meteors.forEach(m => {
            this.ctx.beginPath();
            this.ctx.moveTo(m.x, m.y);
            this.ctx.lineTo(m.x - m.vx * 3, m.y - m.vy * 3);
            this.ctx.strokeStyle = m.color;
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
            this.ctx.fillStyle = m.color;
            this.ctx.fill();
        });
        this.ctx.restore();

        // Particles
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
