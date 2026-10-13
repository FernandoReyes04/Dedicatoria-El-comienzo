// Noche estrellada animada: estrellas que titilan, derivan lentamente y estrellas fugaces
(function () {
    const canvas = document.getElementById('starfield');
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width, height, dpr, stars = [], shooting = [], nextShot = 0;

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const count = Math.floor((width * height) / 4500);
        stars = Array.from({ length: count }, () => {
            const depth = Math.random(); // 0 = lejos, 1 = cerca
            return {
                x: Math.random() * width,
                y: Math.random() * height,
                r: 0.3 + depth * 1.4,
                speed: 15 + depth * 60,            // px por segundo (parallax)
                base: 0.3 + Math.random() * 0.6,
                twinkleSpeed: 1.5 + Math.random() * 4,
                phase: Math.random() * Math.PI * 2,
                hue: Math.random() < 0.2 ? 45 : (Math.random() < 0.3 ? 220 : 0)
            };
        });
    }

    function spawnShootingStar() {
        const fromLeft = Math.random() < 0.5;
        shooting.push({
            x: Math.random() * width * 0.8 + (fromLeft ? 0 : width * 0.2),
            y: Math.random() * height * 0.4,
            vx: (fromLeft ? 1 : -1) * (350 + Math.random() * 250),
            vy: 150 + Math.random() * 150,
            life: 0,
            maxLife: 0.9 + Math.random() * 0.6
        });
    }

    let last = performance.now();
    function frame(now) {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        const t = now / 1000;

        ctx.clearRect(0, 0, width, height);

        for (const s of stars) {
            if (!reduceMotion) {
                s.x -= s.speed * dt;
                s.y += s.speed * 0.15 * dt;
                if (s.x < -2) s.x = width + 2;
                if (s.y > height + 2) s.y = -2;
            }
            const tw = reduceMotion ? 1 : 0.55 + 0.45 * Math.sin(t * s.twinkleSpeed + s.phase);
            const alpha = s.base * tw;
            const color = s.hue === 0 ? `255,255,255` : (s.hue === 45 ? `255,230,170` : `180,200,255`);

            ctx.beginPath();
            ctx.fillStyle = `rgba(${color},${alpha})`;
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
        }


        if (!reduceMotion) {
            if (t > nextShot) {
                spawnShootingStar();
                nextShot = t + 3 + Math.random() * 6;
            }
            for (let i = shooting.length - 1; i >= 0; i--) {
                const s = shooting[i];
                s.life += dt;
                s.x += s.vx * dt;
                s.y += s.vy * dt;
                const p = s.life / s.maxLife;
                if (p >= 1) { shooting.splice(i, 1); continue; }
                const fade = Math.sin(p * Math.PI);
                const tailX = s.x - s.vx * 0.12;
                const tailY = s.y - s.vy * 0.12;
                const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
                grad.addColorStop(0, `rgba(255,245,210,${fade})`);
                grad.addColorStop(1, 'rgba(255,245,210,0)');
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1.8;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(tailX, tailY);
                ctx.stroke();
            }
        }

        requestAnimationFrame(frame);
    }

    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(frame);
})();
