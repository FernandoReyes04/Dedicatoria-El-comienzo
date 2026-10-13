// Meses en JavaScript empiezan en 0 (0 = Enero, 6 = Julio)
const startDate = new Date(2026, 6, 31, 22, 39, 0);

function updateCounter() {
    const now = new Date();
    
    let years = now.getFullYear() - startDate.getFullYear();
    let months = now.getMonth() - startDate.getMonth();
    let days = now.getDate() - startDate.getDate();
    let hours = now.getHours() - startDate.getHours();
    let minutes = now.getMinutes() - startDate.getMinutes();
    let seconds = now.getSeconds() - startDate.getSeconds();

    // Ajustes para valores negativos en el cálculo
    if (seconds < 0) {
        seconds += 60;
        minutes--;
    }
    if (minutes < 0) {
        minutes += 60;
        hours--;
    }
    if (hours < 0) {
        hours += 24;
        days--;
    }
    if (days < 0) {
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += prevMonth.getDate();
        months--;
    }
    if (months < 0) {
        months += 12;
        years--;
    }

    document.getElementById('años').innerText = Math.max(0, years);
    document.getElementById('meses').innerText = Math.max(0, months);
    document.getElementById('dias').innerText = Math.max(0, days);
    document.getElementById('horas').innerText = Math.max(0, hours);
    document.getElementById('minutos').innerText = Math.max(0, minutes);
    document.getElementById('segundos').innerText = Math.max(0, seconds);
}

setInterval(updateCounter, 1000);
updateCounter(); // Llamada inicial para evitar el retraso de 1 segundo

// ===== Lógica del Corazón Multilingüe =====

const phrases = [
    "I love you", "Seni seviyorum", "Te amo", "Je t'aime", 
    "Ich liebe dich", "Ti amo", "Eu te amo", "Я тебя люблю",
    "사랑해", "愛してる", "我爱你", "मैं तुमसे प्यार करता हूँ",
    "Σ' αγαπώ", "Ik hou van jou", "Jag älskar dig", "Kocham Cię",
    "Miluji tě", "Anh yêu em", "Aku cinta kamu", "Я тебе кохаю",
    "Volim te", "Szeretlek", "Te iubesc", "Rakastan sinua",
    "Rwy'n dy garu di", "Mahal kita", "Ndimakukonda", "Mi stas amas vin",
    "Ngiyakuthanda", "M'bi fe", "Ndagukunda", "Ek is lief vir jou"
];

const heartCanvas = document.getElementById('heart-canvas');
let isHeartDrawn = false;
let heartDrawnWidth = 0;

// Función matemática para la forma del corazón
// sx / sy: escala horizontal y vertical; cx / cy: posición del centro (y = 0 de la fórmula)
function getHeartPosition(t, sx, sy, cx, cy) {
    // Ecuaciones paramétricas para un corazón
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
    
    // Invertimos la Y porque en CSS el 0 está arriba
    return { x: x * sx + cx, y: -y * sy + cy };
}

// Tramos horizontales [x1, x2] que quedan dentro del corazón a la altura y
// (arriba hay dos: uno por cada lóbulo)
function heartIntervals(y, pts) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) {
            xs.push(a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x));
        }
    }
    xs.sort((m, n) => m - n);
    const out = [];
    for (let i = 0; i + 1 < xs.length; i += 2) out.push([xs[i], xs[i + 1]]);
    return out;
}

// Dibuja el corazón ocupando el máximo espacio posible de la pantalla.
// animate = true: las frases aparecen girando en sentido de las manecillas del reloj.
function drawHeart(animate = true) {
    isHeartDrawn = true;
    heartDrawnWidth = window.innerWidth;
    heartCanvas.innerHTML = ''; // Limpiar

    // --- Tamaño del corazón según la pantalla ---
    const availW = Math.min(window.innerWidth - 12, 900);
    const availH = window.innerHeight - 120;           // deja espacio al título
    const sx = Math.min(availW / 34, availH / 30);     // 32 unidades de ancho + margen
    const sy = Math.min(availH / 31, sx * 1.3);        // algo más alto en móviles
    const font = Math.max(10, Math.min(19, sx * 0.9)); // tamaño de letra
    const rowH = font * 1.5;                           // alto de cada fila
    const GAP = font * 0.5;                            // espacio mínimo entre frases

    const padTop = rowH;
    const cx = 16 * sx + 8;                            // centro horizontal
    const cy = 12 * sy + padTop;                       // posición de y = 0 en la fórmula
    const W = Math.ceil(32 * sx + 16);
    const H = Math.ceil(29 * sy + padTop * 2);

    heartCanvas.style.width = `${W}px`;
    heartCanvas.style.height = `${H}px`;
    heartCanvas.style.setProperty('--heart-font', `${font}px`);

    // Crea un span de frase en el canvas
    const spans = [];
    function makeSpan(text, x, y) {
        const span = document.createElement('span');
        span.className = 'love-phrase';
        span.innerText = text;
        span.style.left = `${x}px`;
        span.style.top = `${y}px`;
        heartCanvas.appendChild(span);
        spans.push({ span, x, y });
        return span;
    }

    // Mide el ancho de un texto con el estilo de las frases
    function measure(text, extraClass) {
        const probe = document.createElement('span');
        probe.className = 'love-phrase ' + (extraClass || '');
        probe.innerText = text;
        heartCanvas.appendChild(probe);
        const w = probe.offsetWidth;
        heartCanvas.removeChild(probe);
        return w;
    }

    // Cada idioma va seguido de una coma
    const items = phrases
        .filter(p => p !== 'Te amo')
        .map(p => ({ text: p + ',', w: measure(p + ',') }));
    const loveW = measure('Te amo', 'center-love');

    // --- Contorno del corazón ---
    const outline = [];
    for (let i = 0; i < 720; i++) {
        outline.push(getHeartPosition((i / 720) * Math.PI * 2, sx, sy, cx, cy));
    }
    const top = cy - 12 * sy;
    const bottom = cy + 17 * sy;

    // --- Tramos disponibles (filas dentro del corazón) ---
    const slots = [];
    let centerRowY = null;
    let bestDist = Infinity;
    for (let y = top + rowH * 0.6; y < bottom - rowH * 0.2; y += rowH) {
        if (Math.abs(y - cy) < bestDist) { bestDist = Math.abs(y - cy); centerRowY = y; }
    }
    for (let y = top + rowH * 0.6; y < bottom - rowH * 0.2; y += rowH) {
        heartIntervals(y, outline).forEach(([x1, x2]) => {
            if (y === centerRowY && cx > x1 && cx < x2) {
                // En la fila central va "Te amo" y se rellenan los lados
                const half = loveW / 2 + GAP;
                slots.push({ y, x1, x2: cx - half, items: [], used: 0 });
                slots.push({ y, x1: cx + half, x2, items: [], used: 0 });
            } else {
                slots.push({ y, x1, x2, items: [], used: 0 });
            }
        });
    }

    const fits = (slot, w) =>
        slot.used + w + (slot.items.length + 2) * GAP <= slot.x2 - slot.x1;
    const add = (slot, item) => { slot.items.push(item); slot.used += item.w; };

    // --- Rellenar cada tramo con idiomas (se pueden repetir) ---
    let ptr = 0;
    slots.forEach(slot => {
        // 1) Rotando por la lista, mientras quepa
        for (let n = 0; n < items.length; n++) {
            const cand = items[(ptr + n) % items.length];
            if (fits(slot, cand.w)) {
                add(slot, cand);
                ptr = (ptr + n + 1) % items.length;
                n = -1; // reiniciar la búsqueda desde el nuevo puntero
            }
        }
        // 2) Ajuste fino: la frase más ancha que aún quepa (evita huecos)
        let again = true;
        while (again) {
            again = false;
            const pick = items
                .filter(it => fits(slot, it.w))
                .sort((a, b) => b.w - a.w)
                .find(it => !slot.items.includes(it)) ||
                items.filter(it => fits(slot, it.w)).sort((a, b) => b.w - a.w)[0];
            if (pick) { add(slot, pick); again = true; }
        }
    });

    // --- Posicionar: repartir las frases de cada tramo de forma uniforme ---
    slots.forEach(slot => {
        const n = slot.items.length;
        if (!n) return;
        const gap = (slot.x2 - slot.x1 - slot.used) / (n + 1);
        let x = slot.x1 + gap;
        slot.items.forEach(item => {
            makeSpan(item.text, x + item.w / 2, slot.y);
            x += item.w + gap;
        });
    });

    // "Te amo" central
    const love = makeSpan('Te amo', cx, centerRowY);
    love.classList.add('center-love');

    // --- Aparición en sentido de las manecillas del reloj (empieza arriba al centro) ---
    const SWEEP_MS = 3500;
    spans.forEach(({ span, x, y }) => {
        if (!animate) { span.classList.add('active'); return; }
        const angle = Math.atan2(y - cy, x - cx);                          // crece en sentido horario en pantalla
        const turn = ((angle + Math.PI / 2) + Math.PI * 2) % (Math.PI * 2); // 0 = arriba
        const delay = 300 + (turn / (Math.PI * 2)) * SWEEP_MS;
        setTimeout(() => span.classList.add('active'), delay);
    });

    startSparkles();
}

// Destellos aleatorios: ilumina las palabras una por una ("Te amo" no, ese siempre brilla)
let sparkleTimer = null;
function startSparkles() {
    if (sparkleTimer) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    sparkleTimer = setInterval(() => {
        const words = heartCanvas.querySelectorAll('.love-phrase.active:not(.center-love):not(.sparkling)');
        if (!words.length) return;
        const el = words[Math.floor(Math.random() * words.length)];
        el.classList.add('sparkling');
        setTimeout(() => el.classList.remove('sparkling'), 650);
    }, 200);
}

function stopSparkles() {
    if (sparkleTimer) {
        clearInterval(sparkleTimer);
        sparkleTimer = null;
    }
}

// Si cambia el ancho de la pantalla (girar el móvil, etc.), se redibuja sin animación
let heartResizeTimer;
window.addEventListener('resize', () => {
    if (!isHeartDrawn || window.innerWidth === heartDrawnWidth) return;
    clearTimeout(heartResizeTimer);
    heartResizeTimer = setTimeout(() => drawHeart(false), 200);
});

// ===== Observador de Scroll para animaciones (ahorra CPU pausando efectos fuera de pantalla) =====

const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.35
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.target.id === 'heart-section') {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                if (!isHeartDrawn) {
                    drawHeart(true);
                } else {
                    startSparkles();
                }
            } else {
                // Pausar destellos cuando el usuario no está en la sección del corazón
                stopSparkles();
            }
        }
    });
}, observerOptions);

// Observar la sección del corazón
observer.observe(document.getElementById('heart-section'));

// ===== Lógica del Árbol de Recuerdos =====
const treeSvg = document.getElementById('tree-svg');
const treeClouds = document.getElementById('tree-clouds');
const treeBranches = document.getElementById('tree-branches');
const leavesContainer = document.getElementById('leaves-container');
const fallingPetalsContainer = document.getElementById('falling-petals-container');
let isTreePlanted = false;

// Ramas estructuradas organizadas por niveles para una silueta majestuosa y armónica
const branchLevels = [
    // Nivel 0: Tronco principal con raíz ensanchada (raíces laterales + fuste central)
    [
        { d: "M 188 500 Q 194 465 198 425", w: 9 },   // Raíz izquierda
        { d: "M 212 500 Q 206 465 202 425", w: 9 },   // Raíz derecha
        { d: "M 200 500 C 197 460 203 430 200 390", w: 18 } // Fuste principal
    ],
    // Nivel 1: Tres grandes extremidades principales (Izquierda, Centro y Derecha)
    [
        { d: "M 200 390 C 180 365 155 345 138 318", w: 10.5 },
        { d: "M 200 390 C 198 355 202 320 200 282", w: 10 },
        { d: "M 200 390 C 220 365 245 345 262 318", w: 10.5 }
    ],
    // Nivel 2: Ramas secundarias que extienden el dosel hacia los lados y arriba
    [
        // Desde la rama izquierda (138, 318)
        { d: "M 138 318 C 115 310 95 292 82 268", w: 6.5 },  // Caída exterior baja izquierda
        { d: "M 138 318 C 142 278 135 245 130 215", w: 7 },    // Copa alta izquierda
        // Desde la rama central (200, 282)
        { d: "M 200 282 C 182 250 172 220 166 182", w: 6 },    // Corona media izquierda
        { d: "M 200 282 C 200 242 200 205 200 160", w: 6 },    // Corona alta centro
        { d: "M 200 282 C 218 250 228 220 234 182", w: 6 },    // Corona media derecha
        // Desde la rama derecha (262, 318)
        { d: "M 262 318 C 258 278 265 245 270 215", w: 7 },    // Copa alta derecha
        { d: "M 262 318 C 285 310 305 292 318 268", w: 6.5 }  // Caída exterior baja derecha
    ],
    // Nivel 3: Ramitas terminales de la copa que dan soporte a las flores
    [
        // Extremo bajo izquierdo (desde 82, 268)
        { d: "M 82 268 Q 68 255 64 240", w: 3.5, end: { x: 64, y: 240 } },
        { d: "M 82 268 Q 94 252 102 238", w: 3.5, end: { x: 102, y: 238 } },
        // Alto izquierdo (desde 130, 215)
        { d: "M 130 215 Q 112 198 100 178", w: 3.5, end: { x: 100, y: 178 } },
        { d: "M 130 215 Q 142 192 148 168", w: 3.5, end: { x: 148, y: 168 } },
        // Corona media izquierda (desde 166, 182)
        { d: "M 166 182 Q 150 160 142 140", w: 3.2, end: { x: 142, y: 140 } },
        { d: "M 166 182 Q 178 160 182 138", w: 3.2, end: { x: 182, y: 138 } },
        // Cumbre central (desde 200, 160)
        { d: "M 200 160 Q 192 138 190 120", w: 3.2, end: { x: 190, y: 120 } },
        { d: "M 200 160 Q 208 138 210 120", w: 3.2, end: { x: 210, y: 120 } },
        // Corona media derecha (desde 234, 182)
        { d: "M 234 182 Q 222 160 218 138", w: 3.2, end: { x: 218, y: 138 } },
        { d: "M 234 182 Q 250 160 258 140", w: 3.2, end: { x: 258, y: 140 } },
        // Alto derecho (desde 270, 215)
        { d: "M 270 215 Q 258 192 252 168", w: 3.5, end: { x: 252, y: 168 } },
        { d: "M 270 215 Q 288 198 300 178", w: 3.5, end: { x: 300, y: 178 } },
        // Extremo bajo derecho (desde 318, 268)
        { d: "M 318 268 Q 306 252 298 238", w: 3.5, end: { x: 298, y: 238 } },
        { d: "M 318 268 Q 332 255 336 240", w: 3.5, end: { x: 336, y: 240 } }
    ]
];

// Nubes de volumen de fondo para dar cuerpo, redondez y exuberancia a la copa
const canopyClouds = [
    { cx: 200, cy: 145, rx: 65, ry: 50 }, // Cumbre central
    { cx: 155, cy: 165, rx: 55, ry: 45 }, // Alta izquierda
    { cx: 245, cy: 165, rx: 55, ry: 45 }, // Alta derecha
    { cx: 200, cy: 205, rx: 68, ry: 52 }, // Núcleo central
    { cx: 118, cy: 215, rx: 52, ry: 44 }, // Media izquierda
    { cx: 282, cy: 215, rx: 52, ry: 44 }, // Media derecha
    { cx: 80,  cy: 255, rx: 44, ry: 38 }, // Caída baja izquierda
    { cx: 320, cy: 255, rx: 44, ry: 38 }, // Caída baja derecha
    { cx: 200, cy: 255, rx: 55, ry: 40 }  // Centro inferior
];

function plantTree() {
    if (isTreePlanted) return;
    isTreePlanted = true;

    // 1. Crear las nubes de volumen en treeClouds
    treeClouds.innerHTML = '';
    const cloudElements = [];
    canopyClouds.forEach(c => {
        const ellipse = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        ellipse.setAttribute("cx", c.cx);
        ellipse.setAttribute("cy", c.cy);
        ellipse.setAttribute("rx", c.rx);
        ellipse.setAttribute("ry", c.ry);
        ellipse.setAttribute("class", "cloud-puff");
        treeClouds.appendChild(ellipse);
        cloudElements.push(ellipse);
    });

    // 2. Crear las ramas del árbol en treeBranches
    treeBranches.innerHTML = '';
    const animatedPaths = [];

    branchLevels.forEach((levelList, levelIdx) => {
        const levelPaths = [];
        levelList.forEach(branch => {
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", branch.d);
            path.setAttribute("class", "tree-path");
            path.setAttribute("stroke-width", branch.w);
            treeBranches.appendChild(path);

            // Medir la longitud para animación de trazo SVG
            let totalLength = 150;
            try {
                totalLength = Math.ceil(path.getTotalLength()) || 150;
            } catch (e) {
                totalLength = 150;
            }

            path.style.strokeDasharray = totalLength;
            path.style.strokeDashoffset = totalLength;

            levelPaths.push({ el: path, len: totalLength });
        });
        animatedPaths.push(levelPaths);
    });

    // 3. Animar el crecimiento de las ramas de abajo hacia arriba
    let curLevel = 0;
    function growNextLevel() {
        if (curLevel >= animatedPaths.length) {
            // Ramas listas: hacer florecer la copa
            setTimeout(bloomCanopy, 300);
            return;
        }

        const paths = animatedPaths[curLevel];
        const duration = curLevel === 0 ? 0.75 : 0.65;
        paths.forEach(p => {
            p.el.style.transition = `stroke-dashoffset ${duration}s ease-in-out`;
            setTimeout(() => {
                p.el.style.strokeDashoffset = '0';
            }, 30);
        });

        curLevel++;
        setTimeout(growNextLevel, (duration * 1000) - 80);
    }

    setTimeout(growNextLevel, 400);

    // 4. Florecimiento de la copa: nubes de fondo + hojas/flores frontales
    function bloomCanopy() {
        // A) Desplegar las nubes de volumen con suave retraso escalonado
        cloudElements.forEach((puff, idx) => {
            setTimeout(() => {
                puff.classList.add('bloomed');
            }, idx * 60);
        });

        // B) Puntos de florecimiento (anclas de ramas + relleno interno)
        const anchors = [
            // Extremos terminales de ramas
            { x: 64, y: 240, r: 22, count: 12 },
            { x: 102, y: 238, r: 22, count: 12 },
            { x: 100, y: 178, r: 24, count: 12 },
            { x: 148, y: 168, r: 24, count: 12 },
            { x: 142, y: 140, r: 24, count: 12 },
            { x: 182, y: 138, r: 24, count: 12 },
            { x: 190, y: 120, r: 22, count: 12 },
            { x: 210, y: 120, r: 22, count: 12 },
            { x: 218, y: 138, r: 24, count: 12 },
            { x: 258, y: 140, r: 24, count: 12 },
            { x: 252, y: 168, r: 24, count: 12 },
            { x: 300, y: 178, r: 24, count: 12 },
            { x: 298, y: 238, r: 22, count: 12 },
            { x: 336, y: 240, r: 22, count: 12 },
            // Nudos intermedios de soporte
            { x: 82, y: 268, r: 24, count: 10 },
            { x: 130, y: 215, r: 25, count: 10 },
            { x: 166, y: 182, r: 25, count: 10 },
            { x: 200, y: 160, r: 25, count: 10 },
            { x: 234, y: 182, r: 25, count: 10 },
            { x: 270, y: 215, r: 25, count: 10 },
            { x: 318, y: 268, r: 24, count: 10 },
            // Relleno interno natural del dosel
            { x: 160, y: 230, r: 26, count: 9 },
            { x: 200, y: 225, r: 28, count: 10 },
            { x: 240, y: 230, r: 26, count: 9 },
            { x: 138, y: 265, r: 24, count: 8 },
            { x: 262, y: 265, r: 24, count: 8 }
        ];

        leavesContainer.innerHTML = '';
        let leafCounter = 0;

        anchors.forEach(anc => {
            for (let i = 0; i < anc.count; i++) {
                leafCounter++;
                const delay = Math.random() * 1400;

                setTimeout(() => {
                    const leaf = document.createElement('div');
                    const isGold = (leafCounter % 14 === 0);
                    
                    if (isGold) {
                        leaf.className = 'leaf leaf-gold';
                    } else {
                        const colorIdx = Math.floor(Math.random() * 5) + 1;
                        leaf.className = `leaf color${colorIdx}`;
                    }

                    // Distribución radial alrededor del ancla
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.pow(Math.random(), 0.65) * anc.r;
                    const posX = anc.x + Math.cos(angle) * dist;
                    const posY = anc.y + Math.sin(angle) * dist;

                    leaf.style.left = `${(posX / 400) * 100}%`;
                    leaf.style.top = `${(posY / 500) * 100}%`;

                    const rot = Math.random() * 360;
                    const scale = 0.65 + Math.random() * 0.7;

                    leaf.style.setProperty('--s', scale);
                    leaf.style.setProperty('--r', `${rot}deg`);

                    leavesContainer.appendChild(leaf);
                    requestAnimationFrame(() => {
                        leaf.classList.add('grown');
                    });
                }, delay);
            }
        });

        // C) Generar pétalos que caen suavemente con la brisa
        if (fallingPetalsContainer) {
            fallingPetalsContainer.innerHTML = '';
            for (let p = 0; p < 14; p++) {
                const petal = document.createElement('div');
                petal.className = 'falling-petal';
                const startLeft = 18 + Math.random() * 64; // Entre 18% y 82%
                const startTop = 26 + Math.random() * 32;  // Altura de la copa
                petal.style.left = `${startLeft}%`;
                petal.style.top = `${startTop}%`;

                petal.style.setProperty('--drift-x', `${(Math.random() * 50 - 25)}px`);
                petal.style.setProperty('--drift-r', `${Math.random() * 720 - 360}deg`);
                petal.style.setProperty('--drift-dur', `${5 + Math.random() * 3.5}s`);
                petal.style.setProperty('--drift-delay', `${Math.random() * 5}s`);

                fallingPetalsContainer.appendChild(petal);
            }
        }

        // D) Al terminar de florecer, mostrar la carta
        setTimeout(startMemoryLetter, 2000);
    }
}

// ===== Lógica de la Carta Máquina de Escribir =====
const fullText = "Quiero que lo nuestro crezca, que sea tan duradero y resistente como un roble, donde cada hoja sea un momento, y cada rama una aventura juntos. Elijo crecer a tu lado, te elijo para la eternidad.";
const letterEl = document.getElementById('memory-letter');
const memoryContent = document.getElementById('memory-content');

function startMemoryLetter() {
    memoryContent.classList.add('show');
    
    let index = 0;
    letterEl.innerHTML = '';
    
    function typeWriter() {
        if (index < fullText.length) {
            letterEl.innerHTML += fullText.charAt(index);
            index++;
            setTimeout(typeWriter, 50); // Velocidad de escritura
        }
    }
    
    setTimeout(typeWriter, 1000); // Esperar un segundo después de mostrar el contenedor
}

// ===== Actualizar Observador de Scroll =====
const treeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            
            if (entry.target.id === 'tree-section' && !isTreePlanted) {
                plantTree();
            }
        }
    });
}, { threshold: 0.4 });

treeObserver.observe(document.getElementById('tree-section'));

