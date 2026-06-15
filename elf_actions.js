/**
 * Giftuber - Acciones Especiales para el Elfo de Sangre Chibi
 */
(function () {

    let lastGeneratedTs = 0;
    function generateUniqueTimestamp() {
        let ts = Date.now();
        if (ts <= lastGeneratedTs) {
            ts = lastGeneratedTs + 1;
        }
        lastGeneratedTs = ts;
        return ts;
    }

    // ================================================================
    //  CONFIGURACIÓN DE COLORES
    // ================================================================
    const COLOR_MAPPING_STORAGE_KEY = 'giftuber_elf_color_mappings';

    const DEFAULT_COLOR_MAPPINGS = {
        ability1: "color_red",     // Golpe de Cruzado -> Rojo
        ability2: "color_green",   // Escudo Sagrado -> Verde
        ability3: "color_blue",    // Consagración -> Azul
        ability4: "color_yellow",  // Cólera Vengativa -> Amarillo
        ability5: "color_cyan",    // Revivir -> Cian
        ability6: "color_orange",  // Defensivo -> Naranja
        ability7: "color_purple",  // Divine Toll -> Morado
        ability8: "color_lime"     // Escudo del Vengador -> Lima
    };

    let colorMappings = loadColorMappings();

    function loadColorMappings() {
        try {
            const saved = JSON.parse(localStorage.getItem(COLOR_MAPPING_STORAGE_KEY) || '{}');
            const result = {};
            for (const abilityId in DEFAULT_COLOR_MAPPINGS) {
                result[abilityId] = saved[abilityId] !== undefined ? saved[abilityId] : DEFAULT_COLOR_MAPPINGS[abilityId];
            }
            return result;
        } catch (_) {
            return { ...DEFAULT_COLOR_MAPPINGS };
        }
    }

    function saveColorMappings() {
        localStorage.setItem(COLOR_MAPPING_STORAGE_KEY, JSON.stringify(colorMappings));
    }

    const abilityCalibration = {};
    const ABILITIES_DEFAULT_CAL = {
        ability1: { scale: 1.0, x: 40, y: 220, rot: 0 },   // Golpe de Cruzado (X es right offset)
        ability2: { scale: 1.0, x: -30, y: 100, rot: 0 },  // Curaciones / Holy Shield (X es left offset)
        ability3: { scale: 1.0, x: 0, y: -20, rot: 0 },   // Consagración
        ability4: { scale: 1.0, x: 0, y: 0, rot: 0 },     // Alas de Cólera
        ability5: { scale: 1.0, x: 0, y: 0, rot: 0 },     // Libro Sagrado
        ability6: { scale: 1.0, x: 0, y: 0, rot: 0 },     // Defensivo (Burbuja)
        ability7: { scale: 1.0, x: 0, y: 0, rot: 0 },     // Divine Toll
        ability8: { scale: 1.0, x: -70, y: 130, rot: 0 },  // Comando Matar
        ability9: { scale: 1.0, x: 0, y: 0, rot: 0 }        // Boomstick
    };

    function loadAbilityCalibration() {
        for (const a in ABILITIES_DEFAULT_CAL) {
            const s = localStorage.getItem(`giftuber_cal_scale_${a}`);
            const x = localStorage.getItem(`giftuber_cal_x_${a}`);
            const y = localStorage.getItem(`giftuber_cal_y_${a}`);
            const r = localStorage.getItem(`giftuber_cal_rot_${a}`);
            
            const scaleVal = parseFloat(s);
            const xVal = parseInt(x);
            const yVal = parseInt(y);
            const rVal = parseInt(r);

            abilityCalibration[a] = {
                scale: (s !== null && !isNaN(scaleVal)) ? scaleVal : ABILITIES_DEFAULT_CAL[a].scale,
                x: (x !== null && !isNaN(xVal)) ? xVal : ABILITIES_DEFAULT_CAL[a].x,
                y: (y !== null && !isNaN(yVal)) ? yVal : ABILITIES_DEFAULT_CAL[a].y,
                rot: (r !== null && !isNaN(rVal)) ? rVal : ABILITIES_DEFAULT_CAL[a].rot
            };
        }
    }
    loadAbilityCalibration();

    function applyWingsVarsToActiveOverlays() {
        document.querySelectorAll('.avenging-wrath-overlay').forEach(ov => {
            ov.style.setProperty('--wings-scale', wingsScale);
            ov.style.setProperty('--wings-y', `${wingsTranslateY}px`);
            ov.style.setProperty('--wings-x', `${wingsTranslateX}px`);
            ov.style.setProperty('--wings-pos-x', `${wingsOffsetX}px`);
            const calData = abilityCalibration['ability4'];
            ov.style.setProperty('--ability4-rot', `${calData ? (calData.rot !== undefined ? calData.rot : 0) : 0}deg`);
        });
    }

    let wingsCalActive = false;
    function setWingsCalibrationActive(active) {
        wingsCalActive = active;
        
        // Notificar al servidor en tiempo real
        fetch('/display_state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wings_cal_active: active })
        }).catch(() => {});

        const wrapper = document.getElementById('avatar-wrapper');
        if (!wrapper) return;

        // Limpiar cualquier overlay de calibración o regular previo
        wrapper.querySelectorAll('.avenging-wrath-overlay').forEach(el => el.remove());

        if (active) {
            // Crear overlay persistente de calibración
            const overlay = document.createElement('div');
            overlay.className = 'avenging-wrath-overlay calibrating';
            
            const wingL = document.createElement('div'); wingL.className = 'holy-wing left';
            const wingR = document.createElement('div'); wingR.className = 'holy-wing right';
            const aura  = document.createElement('div'); aura.className  = 'avenging-aura';

            const wingSVG = `<svg viewBox="0 0 220 280" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs><linearGradient id="wg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff7a0"/><stop offset="50%" stop-color="#ffd700"/><stop offset="100%" stop-color="#f39c12"/></linearGradient></defs>
              <path d="M200,20 Q220,60 180,100 Q220,80 200,140 Q230,110 210,170 Q240,150 200,220 Q160,260 100,280 Q140,220 120,180 Q80,240 60,280 Q80,200 60,160 Q30,180 20,220 Q10,160 40,120 Q20,100 10,60 Q60,100 80,60 Q60,20 100,10 Q140,-5 200,20Z" fill="url(#wg)" opacity="0.92"/>
              <path d="M100,280 Q140,200 160,140 Q170,80 140,20" stroke="rgba(255,255,255,0.6)" stroke-width="2" fill="none"/>
              <path d="M100,280 Q80,200 100,140 Q110,80 80,30" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" fill="none"/>
              <path d="M100,280 Q120,220 130,160 Q140,110 120,50" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" fill="none"/>
            </svg>`;
            wingL.innerHTML = wingSVG;
            wingR.innerHTML = wingSVG;

            overlay.appendChild(aura);
            overlay.appendChild(wingL);
            overlay.appendChild(wingR);
            wrapper.appendChild(overlay);

            // Aplicar variables inmediatamente
            applyWingsVarsToActiveOverlays();
        }
    }

    // Estado de Calibración de Piernas y Alas
    let legsScale = parseFloat(localStorage.getItem('giftuber_legs_scale'));
    if (isNaN(legsScale)) legsScale = 0.83;
    let legsTranslateY = parseInt(localStorage.getItem('giftuber_legs_y'));
    if (isNaN(legsTranslateY)) legsTranslateY = 22;
    let legsTranslateX = parseInt(localStorage.getItem('giftuber_legs_x'));
    if (isNaN(legsTranslateX)) legsTranslateX = 0;

    let wingsScale = parseFloat(localStorage.getItem('giftuber_wings_scale'));
    if (isNaN(wingsScale)) wingsScale = 1.0;
    let wingsTranslateY = parseInt(localStorage.getItem('giftuber_wings_y'));
    if (isNaN(wingsTranslateY)) wingsTranslateY = 60;
    let wingsTranslateX = parseInt(localStorage.getItem('giftuber_wings_x'));
    if (isNaN(wingsTranslateX)) wingsTranslateX = -12;
    let wingsOffsetX   = parseInt(localStorage.getItem('giftuber_wings_pos_x'));
    if (isNaN(wingsOffsetX)) wingsOffsetX = 0;

    // ================================================================
    //  CSS
    // ================================================================
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
        /* Aplicar recorte a la imagen original en modo caminata para ocultar sus piernas estáticas */
        #avatar-wrapper.active-elf-split #user-avatar-img {
            clip-path: polygon(0% 0%, 100% 0%, 100% 81.0%, 0% 81.0%);
            position: relative;
            z-index: 2;
        }
        #avatar-wrapper.active-elf-split.avatar-lolirot_red #user-avatar-img {
            clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 59% 100%, 59% 78%, 41% 78%, 41% 100%, 0% 100%);
        }

        .elf-part {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            object-fit: contain; pointer-events: none;
        }
        .elf-part.legs-walk {
            transform: scale(0.83) translateY(22px);
            transform-origin: bottom center;
            z-index: 3;
        }

        /* Animación de Caminar para el wrapper del avatar */
        .walking-active #avatar-display {
            animation: walkBob 0.55s infinite ease-in-out;
            transform-origin: bottom center;
        }

        @keyframes walkBob {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
        }
        .paladin-effect-container { position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:5; overflow:visible; }
        
        /* --- Survival Hunter Effects --- */
        .hunter-spear {
            position: absolute; width: 190px; height: 52px;
            top: calc(20% + var(--ability1-y,0px)); left: calc(50px + var(--ability1-x,0px));
            transform-origin: left center; opacity: 0;
            filter: drop-shadow(0 0 8px rgba(80, 250, 123, 0.95)) drop-shadow(0 0 22px rgba(80, 250, 123, 0.6));
            animation: spearSlash 0.45s cubic-bezier(0.1, 0.8, 0.3, 1.1) forwards;
            z-index: 10;
        }
        @keyframes spearSlash {
            0% { transform: rotate(calc(-60deg + var(--ability1-rot,0deg))) scale(var(--ability1-scale,1)); opacity: 0; }
            15% { opacity: 1; }
            70% { transform: rotate(calc(20deg + var(--ability1-rot,0deg))) scale(var(--ability1-scale,1)); opacity: 1; }
            100% { transform: rotate(calc(30deg + var(--ability1-rot,0deg))) scale(var(--ability1-scale,1)); opacity: 0; }
        }
        .hunter-slash-arc {
            position: absolute; width: 220px; height: 220px;
            border: 5px solid transparent;
            border-right-color: rgba(80, 250, 123, 0.85);
            border-bottom-color: rgba(80, 250, 123, 0.3);
            border-radius: 50%;
            top: calc(20% - 100px + var(--ability1-y,0px));
            left: calc(50px - 110px + var(--ability1-x,0px));
            opacity: 0;
            animation: slashArcGreen 0.4s ease-out forwards;
            z-index: 9;
        }
        @keyframes slashArcGreen {
            0% { transform: rotate(calc(-55deg + var(--ability1-rot,0deg))) scale(0.75); opacity: 0; }
            25% { opacity: 0.9; }
            100% { transform: rotate(calc(15deg + var(--ability1-rot,0deg))) scale(1.08); opacity: 0; }
        }

        .hunter-bomb {
            position: absolute; width: calc(85px * var(--ability2-scale,1)); height: calc(85px * var(--ability2-scale,1));
            top: var(--ability2-y, 25%); left: var(--ability2-x, -30px);
            opacity: 0;
            animation: bombThrow 0.5s ease-in forwards;
            z-index: 10;
        }
        @keyframes bombThrow {
            0% { transform: translate(0px, 0px) rotate(var(--ability2-rot, 0deg)) scale(0.4); opacity: 0; }
            30% { opacity: 1; }
            100% { transform: translate(200px, 200px) rotate(calc(360deg + var(--ability2-rot, 0deg))) scale(1); opacity: 1; }
        }
        .hunter-fire-cone {
            position: absolute;
            width: calc(400px * var(--ability2-scale, 1));
            height: calc(400px * var(--ability2-scale, 1));
            top: calc(200px + var(--ability2-y, 100px) - (200px * var(--ability2-scale, 1)));
            left: calc(200px + var(--ability2-x, -30px) - (200px * var(--ability2-scale, 1)));
            background: radial-gradient(circle, rgba(255, 85, 85, 0.4) 0%, rgba(80, 250, 123, 0.25) 50%, transparent 80%);
            opacity: 0;
            transform-origin: center center;
            animation: fireExplosion 1.0s ease-out forwards;
            pointer-events: none;
            z-index: 4;
            filter: blur(4px) drop-shadow(0 0 15px rgba(80, 250, 123, 0.5));
        }
        @keyframes fireExplosion {
            0% { transform: scale(0) rotate(var(--ability2-rot, 0deg)); opacity: 0; }
            15% { transform: scale(1.1) rotate(var(--ability2-rot, 0deg)); opacity: 0.95; }
            80% { transform: scale(1.05) rotate(var(--ability2-rot, 0deg)); opacity: 0.85; }
            100% { transform: scale(1.2) translateY(20px) rotate(var(--ability2-rot, 0deg)); opacity: 0; }
        }

        .hunter-tar-trap {
            position: absolute; width: calc(140px * var(--ability3-scale,1)); height: calc(60px * var(--ability3-scale,1));
            bottom: var(--ability3-y, -20px); left: calc(50% - (70px * var(--ability3-scale,1)) + var(--ability3-x, 0px));
            opacity: 0;
            animation: trapSnap 4.5s ease-out forwards;
            z-index: 3;
        }
        @keyframes trapSnap {
            0% { transform: translateY(-150px) scale(0.3) rotate(-90deg); opacity: 0; }
            10% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
            12% { transform: scaleY(0.6); }
            15% { transform: scaleY(1); }
            85% { opacity: 1; }
            100% { opacity: 0; }
        }
        .hunter-tar-puddle {
            position: absolute; width: calc(380px * var(--ability3-scale,1)); height: calc(100px * var(--ability3-scale,1));
            bottom: var(--ability3-y,-20px); left: calc(50% - (190px * var(--ability3-scale,1)) + var(--ability3-x,0px));
            background: radial-gradient(ellipse at center, rgba(10, 10, 15, 0.85) 0%, rgba(30, 30, 40, 0.5) 50%, transparent 70%);
            border-radius: 50%;
            border: 2px dashed rgba(80, 250, 123, 0.3);
            opacity: 0;
            transform: scale(0.5);
            animation: puddleExpand 4.5s ease-out forwards;
            z-index: 2;
        }
        @keyframes puddleExpand {
            0% { transform: scale(0.2) rotate(var(--ability3-rot, 0deg)); opacity: 0; }
            12% { transform: scale(1) rotate(var(--ability3-rot, 0deg)); opacity: 1; }
            85% { opacity: 1; }
            100% { transform: scale(1.1) rotate(var(--ability3-rot, 0deg)); opacity: 0; }
        }

        .butterfly-wrath-overlay {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; z-index: 1; overflow: visible;
            transform: scale(var(--wings-scale, 1));
            transform-origin: center center;
        }
        .butterfly-wing { position:absolute; width:220px; height:280px; top:var(--wings-y,60px); opacity:0; filter:drop-shadow(0 0 18px rgba(255,121,198,.9)); left:50%; transform-origin:bottom left; }
        .butterfly-wing.left  { margin-left:calc(-24px - var(--wings-x,-12px) + var(--wings-pos-x,0px)); animation:wingAppearL 20s ease-out forwards; }
        .butterfly-wing.right { margin-left:calc(var(--wings-x,-12px) + var(--wings-pos-x,0px)); animation:wingAppearR 20s ease-out forwards; }
        .butterfly-aura { position:absolute; border-radius:50%; width:340px; height:340px; top:50%; left:50%; transform:translate(-50%,-50%) scale(0); background:radial-gradient(circle,rgba(255,121,198,.35) 0%,rgba(189,147,249,.12) 50%,transparent 70%); box-shadow:0 0 60px 30px rgba(255,121,198,.25); animation:auraExpand 20s ease-out forwards; }
        @keyframes wingAppearR {
            0%   { opacity:0; transform: scale(0.2) rotate(var(--ability4-rot, 0deg)); }
            7%   { opacity:1; transform: scale(1.05) rotate(var(--ability4-rot, 0deg)); }
            10%  { transform: scale(1) rotate(var(--ability4-rot, 0deg)); }
            93%  { opacity:1; }
            100% { opacity:0; transform: scale(0.95) rotate(var(--ability4-rot, 0deg)); }
        }
        @keyframes wingAppearL {
            0%   { opacity:0; transform: scaleX(-0.2) scaleY(0.2) rotate(calc(-1 * var(--ability4-rot, 0deg))); }
            7%   { opacity:1; transform: scaleX(-1.05) scaleY(1.05) rotate(calc(-1 * var(--ability4-rot, 0deg))); }
            10%  { transform: scaleX(-1) scaleY(1) rotate(calc(-1 * var(--ability4-rot, 0deg))); }
            93%  { opacity:1; }
            100% { opacity:0; transform: scaleX(-1) scaleY(0.95) rotate(calc(-1 * var(--ability4-rot, 0deg))); }
        }
        @keyframes auraExpand {
            0%   { transform: translate(-50%,-50%) scale(0); opacity: 0; }
            7%   { transform: translate(-50%,-50%) scale(1.2); opacity: 1; }
            12%  { transform: translate(-50%,-50%) scale(1); }
            93%  { opacity: 1; }
            100% { opacity: 0; transform: translate(-50%,-50%) scale(1); }
        }
        
        .butterfly-wrath-overlay.calibrating .butterfly-wing {
            opacity: 0.95 !important;
            animation: none !important;
        }
        .butterfly-wrath-overlay.calibrating .butterfly-wing.left {
            transform: scaleX(-1) rotate(calc(-1 * var(--ability4-rot, 0deg))) !important;
        }
        .butterfly-wrath-overlay.calibrating .butterfly-wing.right {
            transform: scale(1) rotate(var(--ability4-rot, 0deg)) !important;
        }
        .butterfly-wrath-overlay.calibrating .butterfly-aura {
            transform: translate(-50%,-50%) scale(1) !important;
            opacity: 0.8 !important;
            animation: none !important;
        }

        .hunter-mend-pet {
            position: absolute;
            width: calc(100px * var(--ability5-scale, 1));
            height: calc(80px * var(--ability5-scale, 1));
            top: calc(50% - (40px * var(--ability5-scale, 1)) + var(--ability5-y, 0px));
            left: calc(50% - (50px * var(--ability5-scale, 1)) + var(--ability5-x, 0px));
            opacity: 0; filter: drop-shadow(0 0 20px rgba(80, 250, 123, 0.95));
            animation: petMendFloat 2.0s ease-in-out forwards;
            z-index: 10;
        }
        @keyframes petMendFloat {
            0%   { transform: translateY(40px) scale(0.5) rotate(calc(-10deg + var(--ability5-rot, 0deg))); opacity: 0; }
            15%  { transform: translateY(0) scale(1.1) rotate(calc(5deg + var(--ability5-rot, 0deg))); opacity: 1; }
            50%  { transform: translateY(-10px) scale(1) rotate(calc(-5deg + var(--ability5-rot, 0deg))); opacity: 1; }
            85%  { transform: translateY(0) scale(1.05) rotate(calc(3deg + var(--ability5-rot, 0deg))); opacity: 1; }
            100% { transform: translateY(-30px) scale(0.7) rotate(calc(10deg + var(--ability5-rot, 0deg))); opacity: 0; }
        }

        .hunter-turtle-shell {
            position: absolute;
            width: calc(400px * var(--ability6-scale, 1));
            height: calc(400px * var(--ability6-scale, 1));
            top: calc(50% - (200px * var(--ability6-scale, 1)) + var(--ability6-y, 0px));
            left: calc(50% - (200px * var(--ability6-scale, 1)) + var(--ability6-x, 0px));
            opacity: 0;
            animation: shellActivate 8s ease-in-out forwards;
            pointer-events: none;
            z-index: 6;
        }
        @keyframes shellActivate {
            0%   { transform: scale(0.4) rotate(var(--ability6-rot, 0deg)); opacity: 0; }
            10%  { transform: scale(1.05) rotate(var(--ability6-rot, 0deg)); opacity: 1; }
            20%  { transform: scale(0.98) rotate(var(--ability6-rot, 0deg)); opacity: 1; }
            85%  { transform: scale(1.02) rotate(var(--ability6-rot, 0deg)); opacity: 1; }
            100% { transform: scale(0.8) rotate(var(--ability6-rot, 0deg)); opacity: 0; }
        }

        .hunter-harpoon {
            position: absolute;
            width: calc(240px * var(--ability7-scale, 1));
            height: calc(80px * var(--ability7-scale, 1));
            top: calc(50% - (40px * var(--ability7-scale, 1)) + var(--ability7-y, 0px));
            left: calc(50% - (120px * var(--ability7-scale, 1)) + var(--ability7-x, 0px));
            opacity: 0;
            animation: harpoonLaunch 1.0s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
            z-index: 10;
        }
        @keyframes harpoonLaunch {
            0% { transform: rotate(var(--ability7-rot, 0deg)) translate(-300px, 0px) scale(0.5); opacity: 0; }
            15% { transform: rotate(var(--ability7-rot, 0deg)) translate(0px, 0px) scale(1.1); opacity: 1; }
            50% { transform: rotate(var(--ability7-rot, 0deg)) translate(150px, 0px) scale(1); opacity: 1; }
            80% { transform: rotate(var(--ability7-rot, 0deg)) translate(150px, 0px) scale(1); opacity: 1; }
            100% { transform: rotate(var(--ability7-rot, 0deg)) translate(300px, 0px) scale(0.6); opacity: 0; }
        }

        .hunter-pet-slash {
            position: absolute;
            width: calc(300px * var(--ability8-scale, 1));
            height: calc(300px * var(--ability8-scale, 1));
            top: calc(50% - (150px * var(--ability8-scale, 1)) + var(--ability8-y, 0px));
            left: calc(50% - (150px * var(--ability8-scale, 1)) + var(--ability8-x, 0px));
            opacity: 0;
            animation: clawSlash 0.8s cubic-bezier(0.15, 0.85, 0.35, 1.1) forwards;
            z-index: 10;
        }
        @keyframes clawSlash {
            0% { transform: scale(0.4) rotate(var(--ability8-rot, 0deg)); opacity: 0; }
            15% { transform: scale(1.1) rotate(var(--ability8-rot, 0deg)); opacity: 1; }
            60% { transform: scale(1) rotate(var(--ability8-rot, 0deg)); opacity: 1; }
            100% { transform: scale(0.8) rotate(var(--ability8-rot, 0deg)); opacity: 0; }
        }

        .avenging-flash { position:absolute; width:320px; height:320px; border-radius:50%; top:50%; left:50%; transform:translate(-50%,-50%); background:radial-gradient(circle,rgba(255,121,198,.75) 0%,rgba(189,147,249,.35) 45%,transparent 70%); pointer-events:none; z-index:999; animation:flashFade .5s ease-out forwards; }
        @keyframes flashFade { 0%{opacity:1} 100%{opacity:0} }
        @keyframes screenShake { 0%,100%{transform:translate(0,0)} 20%,60%{transform:translate(-4px,4px)} 40%,80%{transform:translate(4px,-4px)} }
        .shake-active { animation:screenShake .15s ease-in-out 2; }

        .holy-particle { position:absolute; width:8px; height:8px; background:#ffd700; border-radius:50%; filter:drop-shadow(0 0 5px #ffae00); opacity:0; animation:floatHoly .8s ease-out forwards; }
        @keyframes floatHoly { 0%{transform:translate(0,0) scale(1);opacity:0} 20%{opacity:1} 100%{transform:translate(var(--dx),var(--dy)) scale(.2);opacity:0} }

        .hunter-boomstick {
            position: absolute;
            pointer-events: none;
            z-index: 15;
            filter: drop-shadow(0 0 14px rgba(255, 200, 50, 0.8));
        }
        .hunter-boomstick-pellet {
            position: absolute;
            height: 3px;
            width: 0px;
            background: linear-gradient(to right, rgba(255,230,100,0) 0%, #f1fa8c 40%, #ffffff 100%);
            opacity: 0;
            transform-origin: left center;
            z-index: 16;
            border-radius: 1.5px;
            box-shadow: 0 0 5px 1px rgba(241,250,140,0.7);
            animation: pelletTrail 0.34s ease-out forwards;
        }

        .hunter-boomstick-flash {
            position: absolute;
            width: 56px;
            height: 46px;
            border-radius: 50%;
            background: radial-gradient(circle, #ffffff 0%, #f1fa8c 32%, #ffb86c 62%, rgba(255,85,85,0) 100%);
            transform: translate(-50%, -50%);
            filter: drop-shadow(0 0 12px #f1fa8c) drop-shadow(0 0 22px #ffb86c);
            pointer-events: none;
            z-index: 17;
            opacity: 0;
            animation: muzzleFlash 0.26s ease-out forwards;
        }
        @keyframes muzzleFlash {
            0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.15); }
            14%  { opacity: 1; transform: translate(-50%, -50%) scale(1.35); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
        }
        @keyframes pelletTrail {
            0%   { width: 0px;   opacity: 0; }
            10%  { width: 25px;  opacity: 1; }
            55%  { width: 95px;  opacity: 0.9; }
            100% { width: 115px; opacity: 0; }
        }
`;document.head.appendChild(styleEl);

    // ================================================================
    //  ESTADO
    // ================================================================
    const keysHeld = {};
    let isWalking   = false;

    function isElfActive() {
        return typeof STATE !== 'undefined' && (STATE.activeAvatar === 'lolirot' || STATE.activeAvatar === 'lolirot_red');
    }



    // Heartbeat: auto-stop caminar si no llega walk_start durante 450ms
    let walkHeartbeat = null;
    let walkStopTime  = 0; // timestamp del último stopWalk, para debounce

    function startWalk() {
        fetch('/display_state', { method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({walking:true}) }).catch(()=>{});
        document.getElementById('avatar-wrapper')?.classList.add('walking-active');
        isWalking = true;
        clearTimeout(walkHeartbeat);
        walkHeartbeat = setTimeout(stopWalk, 450);
    }
    function stopWalk() {
        walkStopTime = Date.now(); // registrar cuándo paramos
        clearTimeout(walkHeartbeat);
        walkHeartbeat = null;
        isWalking = false;
        fetch('/display_state', { method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({walking:false}) }).catch(()=>{});
        document.getElementById('avatar-wrapper')?.classList.remove('walking-active');
    }

    // ================================================================
    //  POLLING SERVIDOR
    // ================================================================
    async function pollServer() {
        try {
            const resp = await fetch('/poll', { cache: 'no-store' });
            if (resp.ok) {
                const data = await resp.json();
                if (data.commands && Array.isArray(data.commands)) {
                    data.commands.forEach(cmd => handleServerCommand(cmd));
                } else if (data.command) {
                    handleServerCommand(data.command);
                }
            }
        } catch (_) {}
        setTimeout(pollServer, 100);
    }

    function handleServerCommand(cmd) {
        if (!isElfActive()) return;
        if (cmd === 'walk_start') {
            // Ignorar walk_start del servidor si acabamos de parar localmente (<600ms)
            // Evita que comandos encolados del AHK reinicien la caminata tras soltar la tecla
            if (Date.now() - walkStopTime < 600) return;
            startWalk(); return;
        }
        if (cmd === 'walk_stop') { stopWalk(); return; }
        
        // Si el comando es un color del addon
        if (cmd.startsWith('color_')) {
            for (const abilityId in colorMappings) {
                if (colorMappings[abilityId] === cmd) {
                    triggerPaladinAbility(abilityId);
                }
            }
            return;
        }

        const action = getActionForServerCmd(cmd);
        if (action && action !== 'walk') triggerPaladinAbility(action);
    }

    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        setTimeout(pollServer, 500);
    }

    // ================================================================
    //  HABILIDADES
    // ================================================================
    function triggerPaladinAbility(action) {

        fetch('/display_state', { method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ability: action, ability_ts: generateUniqueTimestamp()}) }).catch(()=>{});
        
        if (action === 'bald_shine') {
            const shineEl = document.querySelector('.bald-shine-effect');
            if (shineEl) {
                shineEl.classList.remove('shining');
                void shineEl.offsetWidth; // Force reflow
                shineEl.classList.add('shining');
            }
            return;
        }

        const wrapper  = document.getElementById('avatar-wrapper');
        const viewport = document.getElementById('avatar-viewport');
        if (!wrapper || !viewport) return;

        let ec = wrapper.querySelector('.paladin-effect-container');
        if (!ec) { ec = document.createElement('div'); ec.className = 'paladin-effect-container'; wrapper.appendChild(ec); }

        const calData = abilityCalibration[action];
        if (calData) {
            ec.style.setProperty(`--${action}-scale`, calData.scale);
            ec.style.setProperty(`--${action}-x`, `${calData.x}px`);
            ec.style.setProperty(`--${action}-y`, `${calData.y}px`);
            ec.style.setProperty(`--${action}-rot`, `${calData.rot !== undefined ? calData.rot : 0}deg`);
        }

        if (action === 'ability1') {
            // Golpe de Raptor / Espada de Veneno Verde
            const spear = document.createElement('div');
            spear.className = 'hunter-spear';
            spear.innerHTML = `<svg viewBox="0 0 190 52" style="transform:scaleX(-1)" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sBGreen" x1="0%" y1="50%" x2="100%" y2="50%"><stop offset="0%" stop-color="#fff" stop-opacity="0.05"/><stop offset="15%" stop-color="#a0ffe0"/><stop offset="45%" stop-color="#ffffff"/><stop offset="75%" stop-color="#50fa7b"/><stop offset="100%" stop-color="#fff" stop-opacity="0.15"/></linearGradient><linearGradient id="sHGreen" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#263b2e"/><stop offset="50%" stop-color="#141f18"/><stop offset="100%" stop-color="#263b2e"/></linearGradient><filter id="sGGreen"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><polygon points="2,26 18,19 136,22 136,30 18,33" fill="url(#sBGreen)" filter="url(#sGGreen)"/><polygon points="0,26 16,18 16,34" fill="#ffffff" filter="url(#sGGreen)"/><line x1="6" y1="24" x2="132" y2="22" stroke="#fff" stroke-width="1.8" opacity="0.75"/><rect x="134" y="14" width="9" height="24" rx="2.5" fill="#50fa7b" stroke="#263b2e" stroke-width="1"/><rect x="143" y="22" width="36" height="8" rx="3" fill="url(#sHGreen)"/><line x1="152" y1="22" x2="152" y2="30" stroke="#141f18" stroke-width="1" opacity="0.5"/><line x1="159" y1="22" x2="159" y2="30" stroke="#141f18" stroke-width="1" opacity="0.5"/><line x1="166" y1="22" x2="166" y2="30" stroke="#141f18" stroke-width="1" opacity="0.5"/><circle cx="183" cy="26" r="7" fill="#50fa7b" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/></svg>`;
            const arc = document.createElement('div');
            arc.className = 'hunter-slash-arc';
            ec.appendChild(spear);
            ec.appendChild(arc);
            viewport.classList.add('shake-active');
            setTimeout(() => viewport.classList.remove('shake-active'), 300);

            const scale = calData ? calData.scale : 1.0;
            const xOffset = calData ? calData.x : 0;
            const yOffset = calData ? calData.y : 0;
            const rot = calData ? (calData.rot !== undefined ? calData.rot : 0) : 0;

            const containerHeight = ec.offsetHeight || 400;
            const x0 = 50 + xOffset;
            const y0 = containerHeight * 0.2 + 26 + yOffset;
            const L = 190 * scale;

            const angleDeg = 15 + rot;
            const angleRad = angleDeg * Math.PI / 180;

            const tipX = x0 + L * Math.cos(angleRad);
            const tipY = y0 + L * Math.sin(angleRad);

            setTimeout(() => spawnSparks(ec, 14, tipX, tipY, false, '#50fa7b'), 300);
            setTimeout(() => { spear.remove(); arc.remove(); }, 500);

        } else if (action === 'ability2') {
            // Bomba de Fuego Salvaje - animación JS para dirección real
            const bomb = document.createElement('div');
            bomb.className = 'hunter-bomb';
            bomb.innerHTML = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bmGrad" cx="40%" cy="40%" r="50%"><stop offset="0%" stop-color="#ffb86c"/><stop offset="100%" stop-color="#ff5555"/></radialGradient></defs><circle cx="50" cy="55" r="30" fill="url(#bmGrad)" stroke="#282a36" stroke-width="3"/><path d="M50,25 L50,15 Q55,10 65,15" fill="none" stroke="#f1fa8c" stroke-width="4"/><circle cx="65" cy="15" r="4" fill="#ff5555"/></svg>`;
            bomb.style.animation = 'none';
            bomb.style.opacity = '0';
            ec.appendChild(bomb);

            const xVal  = calData ? calData.x   : -30;
            const yVal  = calData ? calData.y   : 100;
            const rot   = calData ? (calData.rot !== undefined ? calData.rot : 45) : 45;
            const scale = calData ? (calData.scale || 1.0) : 1.0;
            const rotRad = rot * Math.PI / 180;
            const D = 260;
            const endOffX = D * Math.cos(rotRad);
            const endOffY = D * Math.sin(rotRad);
            const halfBomb = 42.5 * scale;
            const coneCenterX = xVal + halfBomb + endOffX;
            const coneCenterY = yVal + halfBomb + endOffY;
            const coneSize = 400 * scale;
            const bombDur = 500;
            const bombStart = performance.now();

            function animateBomb(now) {
                const t = Math.min((now - bombStart) / bombDur, 1);
                const dx = endOffX * t;
                const dy = endOffY * t;
                const spin = rot + 360 * t;
                const sc = 0.4 + 0.6 * t;
                const op = t < 0.25 ? t / 0.25 : 1;
                bomb.style.transform = `translate(${dx}px, ${dy}px) rotate(${spin}deg) scale(${sc})`;
                bomb.style.opacity = op;
                if (t < 1) requestAnimationFrame(animateBomb);
            }
            requestAnimationFrame(animateBomb);

            setTimeout(() => {
                viewport.classList.add('shake-active');
                setTimeout(() => viewport.classList.remove('shake-active'), 300);
                const cone = document.createElement('div');
                cone.className = 'hunter-fire-cone';
                cone.style.left   = (coneCenterX - coneSize / 2) + 'px';
                cone.style.top    = (coneCenterY - coneSize / 2) + 'px';
                cone.style.width  = coneSize + 'px';
                cone.style.height = coneSize + 'px';
                ec.appendChild(cone);
                let iv = setInterval(() => {
                    if (!cone.parentNode) { clearInterval(iv); return; }
                    spawnSparks(ec, 4, coneCenterX, coneCenterY, false, Math.random() > 0.5 ? '#ffb86c' : '#50fa7b');
                }, 80);
                setTimeout(() => { clearInterval(iv); cone.remove(); }, 1000);
                bomb.remove();
            }, 500);

        } else if (action === 'ability3') {
            // Trampa de Alquitrán
            const puddle = document.createElement('div');
            puddle.className = 'hunter-tar-puddle';
            ec.appendChild(puddle);

            const xVal = calData ? calData.x : 0;
            const yVal = calData ? calData.y : 0;

            let iv = setInterval(() => {
                if (!puddle.parentNode) { clearInterval(iv); return; }
                spawnConsecrationSparks(ec, xVal, yVal, '#21222c');
            }, 100);

            setTimeout(() => {
                clearInterval(iv);
                puddle.remove();
            }, 4500);

        } else if (action === 'ability4') {
            // Takedown: Flash explosivo + chispas
            wrapper.querySelectorAll('.butterfly-wrath-overlay').forEach(el => el.remove());
            const flash = document.createElement('div');
            flash.className = 'avenging-flash';
            wrapper.appendChild(flash);
            setTimeout(() => flash.remove(), 600);

            viewport.classList.add('shake-active');
            setTimeout(() => viewport.classList.remove('shake-active'), 300);

            const xVal4 = calData ? calData.x : 0;
            const yVal4 = calData ? calData.y : 0;

            // Explosión inicial grande de chispas
            spawnSparks(ec, 20, 200 + xVal4, 200 + yVal4, false, '#ff79c6');
            setTimeout(() => spawnSparks(ec, 15, 200 + xVal4, 200 + yVal4, true, '#bd93f9'), 80);
            setTimeout(() => spawnSparks(ec, 15, 200 + xVal4, 200 + yVal4, false, '#8be9fd'), 160);

            // Lluvia de chispas cayendo
            let rainIv4 = setInterval(() => {
                spawnSparks(ec, 3, 200 + xVal4 + (Math.random() - 0.5) * 80, 200 + yVal4, false,
                    Math.random() > 0.5 ? '#ff79c6' : '#bd93f9');
            }, 80);
            setTimeout(() => clearInterval(rainIv4), 2500);

        } else if (action === 'ability5') {
            // Aliviar Mascota: Huella flotante
            const mend = document.createElement('div');
            mend.className = 'hunter-mend-pet';
            mend.innerHTML = `<svg viewBox="0 0 100 100" width="100%" height="100%"><defs><linearGradient id="mpGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#50fa7b"/><stop offset="100%" stop-color="#8be9fd"/></linearGradient></defs><circle cx="50" cy="55" r="20" fill="url(#mpGrad)"/><circle cx="25" cy="25" r="10" fill="url(#mpGrad)"/><circle cx="42" cy="15" r="11" fill="url(#mpGrad)"/><circle cx="62" cy="15" r="11" fill="url(#mpGrad)"/><circle cx="78" cy="27" r="10" fill="url(#mpGrad)"/></svg>`;
            ec.appendChild(mend);
            
            const xVal = calData ? calData.x : 0;
            const yVal = calData ? calData.y : 0;

            let iv = setInterval(() => {
                if (!mend.parentNode) { clearInterval(iv); return; }
                spawnSparks(ec, 2, 200 + xVal, 200 + yVal, true, '#50fa7b');
            }, 120);

            setTimeout(() => { clearInterval(iv); mend.remove(); }, 2000);

        } else if (action === 'ability6') {
            // Aspecto de la Tortuga: Escudo Caparazón Verde
            const shell = document.createElement('div');
            shell.className = 'hunter-turtle-shell';
            shell.innerHTML = `<svg viewBox="0 0 100 100" width="100%" height="100%"><defs><linearGradient id="shGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#50fa7b" stop-opacity="0.55"/><stop offset="100%" stop-color="#8be9fd" stop-opacity="0.25"/></linearGradient><filter id="shGlow"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><circle cx="50" cy="50" r="46" fill="url(#shGrad)" stroke="#50fa7b" stroke-width="1.2" filter="url(#shGlow)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#8be9fd" stroke-width="0.5" opacity="0.4"/><!-- Hex center --><polygon points="50,28 62,35 62,49 50,56 38,49 38,35" stroke="#50fa7b" stroke-width="1.2" fill="rgba(80,250,123,0.08)"/><!-- Surrounding hex segments --><polygon points="50,56 62,63 62,77 50,84 38,77 38,63" stroke="#50fa7b" stroke-width="1" fill="none" opacity="0.7"/><polygon points="50,5  62,12 62,26 50,33 38,26 38,12" stroke="#8be9fd" stroke-width="1" fill="none" opacity="0.6"/><polygon points="74,35 86,42 86,56 74,63 62,56 62,42" stroke="#50fa7b" stroke-width="1" fill="none" opacity="0.6"/><polygon points="26,35 38,42 38,56 26,63 14,56 14,42" stroke="#50fa7b" stroke-width="1" fill="none" opacity="0.6"/></svg>`;
            ec.appendChild(shell);

            const xVal = calData ? calData.x : 0;
            const yVal = calData ? calData.y : 0;

            let iv = setInterval(() => {
                if (!shell.parentNode) { clearInterval(iv); return; }
                spawnSparks(ec, 2, 200 + xVal, 200 + yVal, false, '#8be9fd');
            }, 150);

            setTimeout(() => { clearInterval(iv); shell.remove(); }, 8000);

        } else if (action === 'ability7') {
            // Arpón - Jabalina de Cazadora
            const harpoon = document.createElement('div');
            harpoon.className = 'hunter-harpoon';
            harpoon.innerHTML = `<svg viewBox="0 0 240 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="hpShaft" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#1a3a1a" stop-opacity="0.4"/><stop offset="20%" stop-color="#50fa7b"/><stop offset="55%" stop-color="#c8ffe0"/><stop offset="80%" stop-color="#8be9fd"/><stop offset="100%" stop-color="#50fa7b" stop-opacity="0.2"/></linearGradient><linearGradient id="hpTip" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#8be9fd"/><stop offset="100%" stop-color="#ffffff"/></linearGradient><filter id="hpGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><!-- Shaft --><rect x="18" y="37" width="185" height="6" rx="3" fill="url(#hpShaft)" filter="url(#hpGlow)"/><!-- Tip (tri-blade) --><polygon points="203,20 238,40 203,60" fill="url(#hpTip)" stroke="#ffffff" stroke-width="1"/><polygon points="203,29 228,40 203,51" fill="#ffffff" opacity="0.5"/><!-- Rear fin --><polygon points="18,37 4,26 12,40 4,54 18,43" fill="#50fa7b" opacity="0.9" filter="url(#hpGlow)"/><!-- Barb 1 --><polygon points="75,37 88,24 88,37" fill="#50fa7b" opacity="0.8"/><polygon points="75,43 88,56 88,43" fill="#50fa7b" opacity="0.6"/><!-- Barb 2 --><polygon points="120,37 133,24 133,37" fill="#8be9fd" opacity="0.8"/><polygon points="120,43 133,56 133,43" fill="#8be9fd" opacity="0.6"/><!-- Energy rings --><ellipse cx="45" cy="40" rx="9" ry="6" fill="none" stroke="#50fa7b" stroke-width="1.2" opacity="0.7"/><ellipse cx="45" cy="40" rx="14" ry="9" fill="none" stroke="#50fa7b" stroke-width="0.6" opacity="0.35"/></svg>`;
            ec.appendChild(harpoon);
            viewport.classList.add('shake-active');
            setTimeout(() => viewport.classList.remove('shake-active'), 300);

            const xVal = calData ? calData.x : 0;
            const yVal = calData ? calData.y : 0;
            const rot7 = calData ? (calData.rot !== undefined ? calData.rot : 0) : 0;
            const rotRad7 = rot7 * Math.PI / 180;

            // Chispas en el punto de impacto (derecha del harpón)
            setTimeout(() => {
                const tipX = 200 + xVal + 240 * Math.cos(rotRad7);
                const tipY = 200 + yVal + 240 * Math.sin(rotRad7);
                spawnSparks(ec, 14, tipX, tipY, false, '#8be9fd');
                spawnSparks(ec, 8,  tipX, tipY, false, '#50fa7b');
            }, 400);

            let iv = setInterval(() => {
                if (!harpoon.parentNode) { clearInterval(iv); return; }
                spawnSparks(ec, 1, 200 + xVal, 200 + yVal, false, '#8be9fd');
            }, 120);

            setTimeout(() => { clearInterval(iv); harpoon.remove(); }, 1000);

        } else if (action === 'ability9') {
            // Boomstick - Escopeta de doble cañón (animación JS pura)
            const xVal9  = calData ? calData.x : 0;
            const yVal9  = calData ? calData.y : 0;
            const rot9   = calData ? (calData.rot !== undefined ? calData.rot : 0) : 0;
            const scale9 = calData ? (calData.scale || 1.0) : 1.0;

            const gunW = 240 * scale9;
            const gunH = 50 * scale9;
            const gunLeft = 200 - gunW / 2 + xVal9;
            const gunTop  = 200 - gunH / 2 + yVal9;

            const gun = document.createElement('div');
            gun.className = 'hunter-boomstick';
            gun.style.width  = gunW + 'px';
            gun.style.height = gunH + 'px';
            gun.style.left   = gunLeft + 'px';
            gun.style.top    = gunTop  + 'px';
            gun.style.opacity = '0';
            gun.style.transformOrigin = '18% 50%';
            gun.innerHTML = `<svg viewBox="0 0 240 50" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bsG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#2a2c3e"/><stop offset="40%" stop-color="#5a5c7a"/><stop offset="100%" stop-color="#2a2c3e"/></linearGradient><linearGradient id="bsBL" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7a8fb0"/><stop offset="45%" stop-color="#b8d0f0"/><stop offset="100%" stop-color="#5a6a8a"/></linearGradient><radialGradient id="bsF" cx="90%" cy="50%" r="55%"><stop offset="0%" stop-color="#ffffff"/><stop offset="30%" stop-color="#f1fa8c"/><stop offset="65%" stop-color="#ffb86c" stop-opacity="0.6"/><stop offset="100%" stop-color="#ff5555" stop-opacity="0"/></radialGradient><filter id="bsGl"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><!-- Stock --><rect x="3" y="19" width="34" height="14" rx="3.5" fill="url(#bsG)"/><rect x="5" y="21" width="28" height="10" rx="2" fill="#1a1c28" opacity="0.7"/><!-- Pump grip --><rect x="24" y="27" width="16" height="12" rx="3" fill="#1e2030"/><rect x="26" y="29" width="12" height="2" rx="1" fill="#44475a"/><rect x="26" y="33" width="12" height="2" rx="1" fill="#44475a"/><!-- Upper barrel --><rect x="40" y="17" width="176" height="8" rx="4" fill="url(#bsBL)" filter="url(#bsGl)"/><!-- Lower barrel --><rect x="40" y="25" width="176" height="8" rx="4" fill="url(#bsBL)" opacity="0.8" filter="url(#bsGl)"/><!-- Barrel top shine --><line x1="44" y1="20" x2="212" y2="20" stroke="rgba(200,220,255,0.6)" stroke-width="1.8" stroke-linecap="round"/><!-- Muzzle cap --><rect x="214" y="16" width="6" height="18" rx="2.5" fill="#8be9fd" opacity="0.95" filter="url(#bsGl)"/><!-- Ejected shell casing --><rect x="38" y="10" width="7" height="11" rx="2.5" fill="#f1fa8c" opacity="0.85" filter="url(#bsGl)" transform="rotate(-25 41 16)"/></svg>`;
            ec.appendChild(gun);

            // Rotate barrel end around pivot (transformOrigin: 18% 50%) to correctly align muzzle flash and pellets when rotated
            const rad9 = rot9 * Math.PI / 180;
            const pivotX = gunLeft + gunW * 0.18;
            const pivotY = gunTop + gunH * 0.50;
            const relEndX = (gunW - 28 * scale9) - (gunW * 0.18);
            const barrelEndX = pivotX + relEndX * Math.cos(rad9);
            const barrelMidY = pivotY + relEndX * Math.sin(rad9);

            // Muzzle flash spawns separately when gun fires (not as static SVG)
            setTimeout(() => {
                const mflash = document.createElement('div');
                mflash.className = 'hunter-boomstick-flash';
                mflash.style.left = barrelEndX + 'px';
                mflash.style.top  = barrelMidY + 'px';
                ec.appendChild(mflash);
                setTimeout(() => mflash.remove(), 300);
            }, 45);

            viewport.classList.add('shake-active');
            setTimeout(() => viewport.classList.remove('shake-active'), 300);

            // JS-based recoil animation (no CSS vars in keyframes)
            const gunStart = performance.now();
            const gunDur   = 620;
            function animateGun(now) {
                const t = Math.min((now - gunStart) / gunDur, 1);

                // Recoil curve: quick kick back → settle
                let kickX = 0, kickRot = 0;
                if (t < 0.18) {
                    const p = t / 0.18;
                    kickX   = -26 * p;
                    kickRot = -5 * p;
                } else if (t < 0.42) {
                    const p = (t - 0.18) / 0.24;
                    kickX   = -26 + 18 * p;
                    kickRot = -5 + 5 * p;
                } else {
                    kickX   = -8;
                    kickRot = 0;
                }
                const op = t < 0.06 ? t / 0.06 : t > 0.78 ? 1 - (t - 0.78) / 0.22 : 1;
                gun.style.transform = `rotate(${rot9 + kickRot}deg) translate(${kickX}px, ${kickRot * 0.35}px)`;
                gun.style.opacity   = op;
                if (t < 1) requestAnimationFrame(animateGun);
                else gun.remove();
            }
            requestAnimationFrame(animateGun);

            const spreadAngles = [-30, -18, -6, 6, 18, 30];

            // Spawn pellet trails
            spreadAngles.forEach((ang, i) => {
                setTimeout(() => {
                    const pellet = document.createElement('div');
                    pellet.className = 'hunter-boomstick-pellet';
                    const totalAngle = rot9 + ang;
                    pellet.style.left = barrelEndX + 'px';
                    pellet.style.top  = barrelMidY + 'px';
                    pellet.style.transform = `rotate(${totalAngle}deg)`;
                    ec.appendChild(pellet);
                    setTimeout(() => pellet.remove(), 400);
                }, 45 + i * 20);
            });

            // Impact sparks where pellets land
            setTimeout(() => {
                spreadAngles.forEach(ang => {
                    const rad  = (rot9 + ang) * Math.PI / 180;
                    const dist = 85 + Math.random() * 55;
                    spawnSparks(ec, 3,
                        barrelEndX + dist * Math.cos(rad),
                        barrelMidY + dist * Math.sin(rad),
                        false, Math.random() > 0.5 ? '#f1fa8c' : '#ffb86c');
                });
            }, 215);

        } else if (action === 'ability8') {
            // Comando de Matar: Zarpazo Espectral Naranja/Verde
            const slash = document.createElement('div');
            slash.className = 'hunter-pet-slash';
            slash.innerHTML = `<svg viewBox="0 0 200 200" width="100%" height="100%"><path d="M20,180 Q60,100 180,20 M50,190 Q90,110 190,40 M10,160 Q40,90 160,10" stroke="#ffb86c" stroke-width="8" stroke-linecap="round" fill="none" filter="drop-shadow(0 0 10px #ff5555)"/><path d="M180,180 Q100,100 20,20" stroke="#50fa7b" stroke-width="12" stroke-linecap="round" fill="none" opacity="0.4" filter="drop-shadow(0 0 15px #50fa7b)"/></svg>`;
            ec.appendChild(slash);
            viewport.classList.add('shake-active');
            setTimeout(() => viewport.classList.remove('shake-active'), 300);

            const xVal = calData ? calData.x : 0;
            const yVal = calData ? calData.y : 0;

            let iv = setInterval(() => {
                if (!slash.parentNode) { clearInterval(iv); return; }
                spawnSparks(ec, 3, 200 + xVal, 200 + yVal, false, Math.random() > 0.5 ? '#ffb86c' : '#ff5555');
            }, 80);

            setTimeout(() => { clearInterval(iv); slash.remove(); }, 800);
        }
    }

    function spawnDivineRain(container, color = null) {
        const p = document.createElement('div'); p.className = 'holy-particle';
        p.style.left = `${Math.random() * 400}px`;
        p.style.top  = `${Math.random() * 100}px`;
        const dx = (Math.random()-.5)*30;
        const dy = 80 + Math.random()*120;
        p.style.setProperty('--dx', `${dx}px`); p.style.setProperty('--dy', `${dy}px`);
        const sz = 3+Math.random()*7; p.style.width = p.style.height = `${sz}px`;
        p.style.background = color || (Math.random() > .5 ? '#fff' : '#ffd700');
        p.style.animationDuration = '.9s';
        container.appendChild(p); setTimeout(() => p.remove(), 1000);
    }

    function spawnSparks(container, count, x, y, goUp = false, color = null) {
        for (let i = 0; i < count; i++) {
            const s = document.createElement('div'); s.className = 'holy-particle';
            s.style.left = `${x}px`; s.style.top = `${y}px`;
            let dx, dy;
            if (goUp) { dx = (Math.random()-.5)*60; dy = -50 - Math.random()*100; }
            else { const a = Math.random()*Math.PI*2, d = 30+Math.random()*100; dx = Math.cos(a)*d; dy = Math.sin(a)*d; }
            s.style.setProperty('--dx', `${dx}px`); s.style.setProperty('--dy', `${dy}px`);
            const sz = 4+Math.random()*8; s.style.width = s.style.height = `${sz}px`;
            s.style.animationDelay = `${Math.random()*.15}s`;
            if (color) {
                s.style.background = color;
                s.style.filter = `drop-shadow(0 0 5px ${color})`;
            }
            container.appendChild(s); setTimeout(() => s.remove(), 1000);
        }
    }

    function spawnConsecrationSparks(container, xOffset = 0, yOffset = 0, color = null) {
        const s = document.createElement('div'); s.className = 'holy-particle';
        s.style.left = `${200 + xOffset + (Math.random()-.5)*320}px`; s.style.top = `${370 + yOffset + (Math.random()-.5)*40}px`;
        s.style.setProperty('--dx', `${(Math.random()-.5)*20}px`); s.style.setProperty('--dy', `${-60-Math.random()*80}px`);
        const sz = 3+Math.random()*6; s.style.width = s.style.height = `${sz}px`;
        if (color) {
            s.style.background = color;
            s.style.filter = `drop-shadow(0 0 5px ${color})`;
        }
        container.appendChild(s); setTimeout(() => s.remove(), 1000);
    }

    // ================================================================
    //  SINCRONIZACIÓN DE CALIBRACIÓN CON EL SERVIDOR (nivel IIFE)
    // ================================================================
    function pushCalibrationToServer() {
        fetch('/display_state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                calibration: {
                    legs_scale: legsScale,
                    legs_y: legsTranslateY,
                    legs_x: legsTranslateX,
                    wings_scale: wingsScale,
                    wings_y: wingsTranslateY,
                    wings_x: wingsTranslateX,
                    wings_pos_x: wingsOffsetX,
                    abilityCalibration: abilityCalibration
                }
            })
        }).catch(() => {});
    }

    function pushColorMappingsToServer() {
        fetch('/display_state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ colorMappings: colorMappings })
        }).catch(() => {});
    }

    // ================================================================
    //  UI DE MAPEO DE TECLAS
    // ================================================================
    let capturingAction = null;
    let captureBtn      = null;

    function buildKeyMappingUI() {
        const container = document.getElementById('key-mapping-container');
        if (!container) return;
        container.innerHTML = '';
        for (const action in keyMappings) {
            if (action !== 'walk') continue;
            const info = keyMappings[action];
            const row  = document.createElement('div'); row.className = 'key-map-row';
            const lbl  = document.createElement('span'); lbl.className = 'key-map-label';
            lbl.innerHTML = `<span class="key-icon">${info.icon}</span> ${info.label}`;
            const btn  = document.createElement('button'); btn.className = 'key-capture-btn';
            btn.dataset.action = action;
            btn.textContent = formatCombo(info.physicalKey, info.modifiers);
            btn.title = 'Haz clic, luego presiona la combinación de teclas (ej: Shift+2)';
            btn.addEventListener('click', () => startCapturing(action, btn));
            row.appendChild(lbl); row.appendChild(btn); container.appendChild(row);
        }
    }

    const COLOR_OPTIONS = [
        { value: "color_red", label: "Rojo (Red)" },
        { value: "color_green", label: "Verde (Green)" },
        { value: "color_blue", label: "Azul (Blue)" },
        { value: "color_yellow", label: "Amarillo (Yellow)" },
        { value: "color_cyan", label: "Cian (Cyan)" },
        { value: "color_magenta", label: "Magenta (Magenta)" },
        { value: "color_orange", label: "Naranja (Orange)" },
        { value: "color_purple", label: "Morado (Purple)" },
        { value: "color_lime", label: "Lima (Lime)" },
        { value: "color_pink", label: "Rosa (Pink)" },
        { value: "", label: "❌ Desactivado" }
    ];

    const ABILITIES_DETAILS = {
        ability1: { label: "Golpe de Raptor", icon: "🏹", desc: "Corte de lanza de veneno verde" },
        ability2: { label: "Bomba de Fuego Salvaje", icon: "💣", desc: "Explosión de fuego verde y naranja" },
        ability3: { label: "Trampa de Alquitrán", icon: "🕸️", desc: "Trampa en el suelo con alquitrán negro" },
        ability4: { label: "Takedown", icon: "💥", desc: "Golpe final explosivo con chispas" },
        ability9: { label: "Boomstick", icon: "🔫", desc: "Disparo de escopeta en abanico" },
        ability5: { label: "Aliviar Mascota", icon: "🐾", desc: "Huella y corazones verdes flotantes" },
        ability6: { label: "Aspecto de la Tortuga", icon: "🐢", desc: "Escudo protector verde de caparazón" },
        ability7: { label: "Arpón", icon: "⚓", desc: "Proyecta arpón metálico con cadena" },
        ability8: { label: "Comando de Matar", icon: "🦁", desc: "Zarpazo espectral gigante verde/naranja" }
    };

    function buildColorMappingUI() {
        const container = document.getElementById('color-mapping-container');
        if (!container) return;
        container.innerHTML = '';

        for (const abilityId in ABILITIES_DETAILS) {
            const detail = ABILITIES_DETAILS[abilityId];
            const currentValue = colorMappings[abilityId] || '';

            const itemWrapper = document.createElement('div');
            itemWrapper.style.display = 'flex';
            itemWrapper.style.flexDirection = 'column';
            itemWrapper.style.padding = '8px 0';
            itemWrapper.style.borderBottom = '1px solid rgba(255,255,255,0.05)';

            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.justifyContent = 'space-between';
            row.style.gap = '10px';
            row.style.width = '100%';

            // Info (Icono + Nombre)
            const info = document.createElement('div');
            info.style.display = 'flex';
            info.style.flexDirection = 'column';
            info.innerHTML = `
                <div style="font-weight: 600; font-size: 13px; color: #fff;">${detail.icon} ${detail.label}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${detail.desc}</div>
            `;
            row.appendChild(info);

            // Contenedor de controles a la derecha
            const rightControls = document.createElement('div');
            rightControls.style.display = 'flex';
            rightControls.style.alignItems = 'center';
            rightControls.style.gap = '8px';

            // Botón de Play / Demo
            const playBtn = document.createElement('button');
            playBtn.style.padding = '4px 8px';
            playBtn.style.fontSize = '11px';
            playBtn.style.borderRadius = '4px';
            playBtn.style.background = '#ffd700';
            playBtn.style.color = '#000';
            playBtn.style.border = 'none';
            playBtn.style.cursor = 'pointer';
            playBtn.style.fontWeight = 'bold';
            playBtn.innerHTML = '▶';
            playBtn.title = 'Previsualizar Animación';
            playBtn.addEventListener('click', () => {
                triggerPaladinAbility(abilityId);
            });
            rightControls.appendChild(playBtn);

            // Calibration Panel (collapsible)
            const calPanel = document.createElement('div');
            calPanel.style.display = 'none';
            calPanel.style.flexDirection = 'column';
            calPanel.style.gap = '8px';
            calPanel.style.padding = '10px';
            calPanel.style.marginTop = '8px';
            calPanel.style.background = 'rgba(255,255,255,0.02)';
            calPanel.style.borderRadius = '6px';
            calPanel.style.border = '1px dashed var(--border-color)';
            calPanel.style.width = '100%';

            const calData = abilityCalibration[abilityId] || { scale: 1.0, x: 0, y: 0, rot: 0 };

            if (abilityId === 'ability4') {
                // Control de Escala (Alas)
                const scaleDiv = document.createElement('div');
                scaleDiv.style.display = 'flex';
                scaleDiv.style.flexDirection = 'column';
                scaleDiv.style.gap = '4px';
                scaleDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; font-size: 11px;">
                        <label>Escala (Tamaño)</label>
                        <span class="scale-val-lbl" style="font-weight: bold; color: var(--accent-color);">${wingsScale.toFixed(2)}</span>
                    </div>
                    <input type="range" class="scale-slider" min="0.50" max="2.00" step="0.01" value="${wingsScale}" style="width: 100%; cursor: pointer;">
                `;
                calPanel.appendChild(scaleDiv);

                // Control de Separación (X)
                const xDiv = document.createElement('div');
                xDiv.style.display = 'flex';
                xDiv.style.flexDirection = 'column';
                xDiv.style.gap = '4px';
                xDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; font-size: 11px;">
                        <label>Separación (X)</label>
                        <span class="x-val-lbl" style="font-weight: bold; color: var(--accent-color);">${wingsTranslateX}px</span>
                    </div>
                    <input type="range" class="x-slider" min="-100" max="100" step="1" value="${wingsTranslateX}" style="width: 100%; cursor: pointer;">
                `;
                calPanel.appendChild(xDiv);

                // Control de Posición Vertical (Y)
                const yDiv = document.createElement('div');
                yDiv.style.display = 'flex';
                yDiv.style.flexDirection = 'column';
                yDiv.style.gap = '4px';
                yDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; font-size: 11px;">
                        <label>Posición Vertical (Y)</label>
                        <span class="y-val-lbl" style="font-weight: bold; color: var(--accent-color);">${wingsTranslateY}px</span>
                    </div>
                    <input type="range" class="y-slider" min="-100" max="200" step="1" value="${wingsTranslateY}" style="width: 100%; cursor: pointer;">
                `;
                calPanel.appendChild(yDiv);

                // Control de Posición Horizontal Global (X)
                const posDiv = document.createElement('div');
                posDiv.style.display = 'flex';
                posDiv.style.flexDirection = 'column';
                posDiv.style.gap = '4px';
                posDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; font-size: 11px;">
                        <label>Posición Horizontal Global (X)</label>
                        <span class="pos-val-lbl" style="font-weight: bold; color: var(--accent-color);">${wingsOffsetX}px</span>
                    </div>
                    <input type="range" class="pos-slider" min="-300" max="300" step="1" value="${wingsOffsetX}" style="width: 100%; cursor: pointer;">
                `;
                calPanel.appendChild(posDiv);

                // Control de Rotación
                const rotDiv = document.createElement('div');
                rotDiv.style.display = 'flex';
                rotDiv.style.flexDirection = 'column';
                rotDiv.style.gap = '4px';
                rotDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; font-size: 11px;">
                        <label>Rotación (Grados)</label>
                        <span class="rot-val-lbl" style="font-weight: bold; color: var(--accent-color);">${calData.rot !== undefined ? calData.rot : 0}°</span>
                    </div>
                    <input type="range" class="rot-slider" min="-180" max="180" step="1" value="${calData.rot !== undefined ? calData.rot : 0}" style="width: 100%; cursor: pointer;">
                `;
                calPanel.appendChild(rotDiv);

                // Event Listeners for Wings/Rot sliders
                const wrapper = document.getElementById('avatar-wrapper');
                const updateOrTrigger = () => {
                    if (wrapper && wrapper.querySelector('.avenging-wrath-overlay')) {
                        applyWingsVarsToActiveOverlays();
                    } else {
                        triggerPaladinAbility(abilityId);
                    }
                };

                const scaleSlider = scaleDiv.querySelector('.scale-slider');
                const scaleLbl = scaleDiv.querySelector('.scale-val-lbl');
                scaleSlider.addEventListener('input', (e) => {
                    wingsScale = parseFloat(e.target.value);
                    scaleLbl.textContent = wingsScale.toFixed(2);
                    localStorage.setItem('giftuber_wings_scale', wingsScale);
                    applyWingsVarsToActiveOverlays();
                    pushCalibrationToServer();
                    updateOrTrigger();
                });

                const xSlider = xDiv.querySelector('.x-slider');
                const xLbl = xDiv.querySelector('.x-val-lbl');
                xSlider.addEventListener('input', (e) => {
                    wingsTranslateX = parseInt(e.target.value);
                    xLbl.textContent = wingsTranslateX + 'px';
                    localStorage.setItem('giftuber_wings_x', wingsTranslateX);
                    applyWingsVarsToActiveOverlays();
                    pushCalibrationToServer();
                    updateOrTrigger();
                });

                const ySlider = yDiv.querySelector('.y-slider');
                const yLbl = yDiv.querySelector('.y-val-lbl');
                ySlider.addEventListener('input', (e) => {
                    wingsTranslateY = parseInt(e.target.value);
                    yLbl.textContent = wingsTranslateY + 'px';
                    localStorage.setItem('giftuber_wings_y', wingsTranslateY);
                    applyWingsVarsToActiveOverlays();
                    pushCalibrationToServer();
                    updateOrTrigger();
                });

                const posSlider = posDiv.querySelector('.pos-slider');
                const posLbl = posDiv.querySelector('.pos-val-lbl');
                posSlider.addEventListener('input', (e) => {
                    wingsOffsetX = parseInt(e.target.value);
                    posLbl.textContent = wingsOffsetX + 'px';
                    localStorage.setItem('giftuber_wings_pos_x', wingsOffsetX);
                    applyWingsVarsToActiveOverlays();
                    pushCalibrationToServer();
                    updateOrTrigger();
                });

                const rotSlider = rotDiv.querySelector('.rot-slider');
                const rotLbl = rotDiv.querySelector('.rot-val-lbl');
                rotSlider.addEventListener('input', (e) => {
                    const val = parseInt(e.target.value);
                    rotLbl.textContent = val + '°';
                    abilityCalibration[abilityId].rot = val;
                    localStorage.setItem(`giftuber_cal_rot_${abilityId}`, val);
                    applyWingsVarsToActiveOverlays();
                    pushCalibrationToServer();
                    updateOrTrigger();
                });
            } else {
                // Control de Escala
                const scaleDiv = document.createElement('div');
                scaleDiv.style.display = 'flex';
                scaleDiv.style.flexDirection = 'column';
                scaleDiv.style.gap = '4px';
                scaleDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; font-size: 11px;">
                        <label>Escala (Tamaño)</label>
                        <span class="scale-val-lbl" style="font-weight: bold; color: var(--accent-color);">${calData.scale.toFixed(2)}</span>
                    </div>
                    <input type="range" class="scale-slider" min="0.30" max="2.50" step="0.01" value="${calData.scale}" style="width: 100%; cursor: pointer;">
                `;
                calPanel.appendChild(scaleDiv);

                // Control de X
                const xDiv = document.createElement('div');
                xDiv.style.display = 'flex';
                xDiv.style.flexDirection = 'column';
                xDiv.style.gap = '4px';
                xDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; font-size: 11px;">
                        <label>Posición Horizontal (X)</label>
                        <span class="x-val-lbl" style="font-weight: bold; color: var(--accent-color);">${calData.x}px</span>
                    </div>
                    <input type="range" class="x-slider" min="-300" max="300" step="1" value="${calData.x}" style="width: 100%; cursor: pointer;">
                `;
                calPanel.appendChild(xDiv);

                // Control de Y
                const yDiv = document.createElement('div');
                yDiv.style.display = 'flex';
                yDiv.style.flexDirection = 'column';
                yDiv.style.gap = '4px';
                yDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; font-size: 11px;">
                        <label>Posición Vertical (Y)</label>
                        <span class="y-val-lbl" style="font-weight: bold; color: var(--accent-color);">${calData.y}px</span>
                    </div>
                    <input type="range" class="y-slider" min="-300" max="300" step="1" value="${calData.y}" style="width: 100%; cursor: pointer;">
                `;
                calPanel.appendChild(yDiv);

                // Control de Rotación
                const rotDiv = document.createElement('div');
                rotDiv.style.display = 'flex';
                rotDiv.style.flexDirection = 'column';
                rotDiv.style.gap = '4px';
                rotDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; font-size: 11px;">
                        <label>Rotación (Grados)</label>
                        <span class="rot-val-lbl" style="font-weight: bold; color: var(--accent-color);">${calData.rot !== undefined ? calData.rot : 0}°</span>
                    </div>
                    <input type="range" class="rot-slider" min="-180" max="180" step="1" value="${calData.rot !== undefined ? calData.rot : 0}" style="width: 100%; cursor: pointer;">
                `;
                calPanel.appendChild(rotDiv);

                // Event Listeners for sliders
                const scaleSlider = scaleDiv.querySelector('.scale-slider');
                const scaleLbl = scaleDiv.querySelector('.scale-val-lbl');
                scaleSlider.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value);
                    scaleLbl.textContent = val.toFixed(2);
                    abilityCalibration[abilityId].scale = val;
                    localStorage.setItem(`giftuber_cal_scale_${abilityId}`, val);
                    pushCalibrationToServer();
                    triggerPaladinAbility(abilityId);
                });

                const xSlider = xDiv.querySelector('.x-slider');
                const xLbl = xDiv.querySelector('.x-val-lbl');
                xSlider.addEventListener('input', (e) => {
                    const val = parseInt(e.target.value);
                    xLbl.textContent = val + 'px';
                    abilityCalibration[abilityId].x = val;
                    localStorage.setItem(`giftuber_cal_x_${abilityId}`, val);
                    pushCalibrationToServer();
                    triggerPaladinAbility(abilityId);
                });

                const ySlider = yDiv.querySelector('.y-slider');
                const yLbl = yDiv.querySelector('.y-val-lbl');
                ySlider.addEventListener('input', (e) => {
                    const val = parseInt(e.target.value);
                    yLbl.textContent = val + 'px';
                    abilityCalibration[abilityId].y = val;
                    localStorage.setItem(`giftuber_cal_y_${abilityId}`, val);
                    pushCalibrationToServer();
                    triggerPaladinAbility(abilityId);
                });

                const rotSlider = rotDiv.querySelector('.rot-slider');
                const rotLbl = rotDiv.querySelector('.rot-val-lbl');
                rotSlider.addEventListener('input', (e) => {
                    const val = parseInt(e.target.value);
                    rotLbl.textContent = val + '°';
                    abilityCalibration[abilityId].rot = val;
                    localStorage.setItem(`giftuber_cal_rot_${abilityId}`, val);
                    pushCalibrationToServer();
                    triggerPaladinAbility(abilityId);
                });
            }

            // Botón de Edit / Calibrar
            const editBtn = document.createElement('button');
            editBtn.style.padding = '4px 8px';
            editBtn.style.fontSize = '11px';
            editBtn.style.borderRadius = '4px';
            editBtn.style.background = '#1e1e2d';
            editBtn.style.color = '#fff';
            editBtn.style.border = '1px solid var(--border-color)';
            editBtn.style.cursor = 'pointer';
            editBtn.innerHTML = '✏️ Calibrar';
            editBtn.title = 'Ajustar Escala y Posición';
            editBtn.addEventListener('click', () => {
                const isHidden = calPanel.style.display === 'none';
                calPanel.style.display = isHidden ? 'flex' : 'none';
                editBtn.style.background = isHidden ? 'var(--accent-color)' : '#1e1e2d';
                editBtn.style.color = isHidden ? '#000' : '#fff';
                
                if (abilityId === 'ability4') {
                    setWingsCalibrationActive(isHidden);
                } else {
                    if (isHidden) {
                        triggerPaladinAbility(abilityId);
                    }
                }
            });
            rightControls.appendChild(editBtn);

            // Selector
            const select = document.createElement('select');
            select.className = 'select-input';
            select.style.width = '140px';
            select.style.fontSize = '12px';
            select.style.padding = '4px 8px';
            select.style.borderRadius = '4px';
            select.style.background = '#1e1e2d';
            select.style.color = '#fff';
            select.style.border = '1px solid var(--border-color)';

            COLOR_OPTIONS.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                if (opt.value === currentValue) {
                    option.selected = true;
                }
                select.appendChild(option);
            });

            // Cambiar mapping al seleccionar
            select.addEventListener('change', (e) => {
                colorMappings[abilityId] = e.target.value;
                saveColorMappings();
                pushColorMappingsToServer();
            });

            rightControls.appendChild(select);
            row.appendChild(rightControls);
            itemWrapper.appendChild(row);
            itemWrapper.appendChild(calPanel);
            container.appendChild(itemWrapper);
        }
    }


    // ================================================================
    //  GENERADOR DE AHK CON COMBINACIONES
    // ================================================================
    function generateAhkContent() {
        return `#Requires AutoHotkey v2.0
#SingleInstance Force

ServerURL := "http://127.0.0.1:8000/action"

SendCommand(key) {
    global ServerURL
    try {
        whr := ComObject("WinHttp.WinHttpRequest.5.1")
        whr.Open("POST", ServerURL "?key=" key, false)
        whr.Send()
    }
}

; === Controles de Movimiento (W, A, S, D) ===
KeysDown := Map()
KeysDown["w"] := 0
KeysDown["a"] := 0
KeysDown["s"] := 0
KeysDown["d"] := 0

IsCurrentlyWalking := 0

SendWalkStart() {
    SendCommand("walk_start")
}

UpdateWalkState() {
    global KeysDown, IsCurrentlyWalking
    wantsWalk := KeysDown["w"] || KeysDown["a"] || KeysDown["s"] || KeysDown["d"]
    if (wantsWalk && !IsCurrentlyWalking) {
        IsCurrentlyWalking := 1
        SendCommand("walk_start")
        SetTimer(SendWalkStart, 200)
    } else if (!wantsWalk && IsCurrentlyWalking) {
        IsCurrentlyWalking := 0
        SetTimer(SendWalkStart, 0)
        SendCommand("walk_stop")
    }
}

~w:: {
    global KeysDown
    if (!KeysDown["w"]) {
        KeysDown["w"] := 1
        UpdateWalkState()
    }
}
~w up:: {
    global KeysDown
    KeysDown["w"] := 0
    UpdateWalkState()
}

~a:: {
    global KeysDown
    if (!KeysDown["a"]) {
        KeysDown["a"] := 1
        UpdateWalkState()
    }
}
~a up:: {
    global KeysDown
    KeysDown["a"] := 0
    UpdateWalkState()
}

~s:: {
    global KeysDown
    if (!KeysDown["s"]) {
        KeysDown["s"] := 1
        UpdateWalkState()
    }
}
~s up:: {
    global KeysDown
    KeysDown["s"] := 0
    UpdateWalkState()
}

~d:: {
    global KeysDown
    if (!KeysDown["d"]) {
        KeysDown["d"] := 1
        UpdateWalkState()
    }
}
~d up:: {
    global KeysDown
    KeysDown["d"] := 0
    UpdateWalkState()
}
`;
    }

    // ================================================================
    //  INICIALIZACIÓN
    async function loadCalibrationFromServer() {
        try {
            const resp = await fetch('/display_state', { cache: 'no-store' });
            if (resp.ok) {
                const s = await resp.json();
                if (s.calibration) {
                    // Cargar piernas
                    if (s.calibration.legs_scale !== undefined) {
                        legsScale = s.calibration.legs_scale;
                        localStorage.setItem('giftuber_legs_scale', legsScale);
                        const slider = document.getElementById('slider-legs-scale');
                        if (slider) slider.value = legsScale;
                        const valLbl = document.getElementById('legs-scale-val');
                        if (valLbl) valLbl.textContent = legsScale;
                    }
                    if (s.calibration.legs_y !== undefined) {
                        legsTranslateY = s.calibration.legs_y;
                        localStorage.setItem('giftuber_legs_y', legsTranslateY);
                        const slider = document.getElementById('slider-legs-y');
                        if (slider) slider.value = legsTranslateY;
                        const valLbl = document.getElementById('legs-y-val');
                        if (valLbl) valLbl.textContent = legsTranslateY + 'px';
                    }
                    if (s.calibration.legs_x !== undefined) {
                        legsTranslateX = s.calibration.legs_x;
                        localStorage.setItem('giftuber_legs_x', legsTranslateX);
                        const slider = document.getElementById('slider-legs-x');
                        if (slider) slider.value = legsTranslateX;
                        const valLbl = document.getElementById('legs-x-val');
                        if (valLbl) valLbl.textContent = legsTranslateX + 'px';
                    }
                    
                    // Cargar alas
                    if (s.calibration.wings_scale !== undefined) {
                        wingsScale = s.calibration.wings_scale;
                        localStorage.setItem('giftuber_wings_scale', wingsScale);
                    }
                    if (s.calibration.wings_y !== undefined) {
                        wingsTranslateY = s.calibration.wings_y;
                        localStorage.setItem('giftuber_wings_y', wingsTranslateY);
                    }
                    if (s.calibration.wings_x !== undefined) {
                        wingsTranslateX = s.calibration.wings_x;
                        localStorage.setItem('giftuber_wings_x', wingsTranslateX);
                    }
                    if (s.calibration.wings_pos_x !== undefined) {
                        wingsOffsetX = s.calibration.wings_pos_x;
                        localStorage.setItem('giftuber_wings_pos_x', wingsOffsetX);
                    }
                    
                    // Cargar habilidades
                    if (s.calibration.abilityCalibration) {
                        for (const a in s.calibration.abilityCalibration) {
                            const cal = s.calibration.abilityCalibration[a];
                            if (cal) {
                                if (cal.scale !== undefined) {
                                    abilityCalibration[a].scale = cal.scale;
                                    localStorage.setItem(`giftuber_cal_scale_${a}`, cal.scale);
                                }
                                if (cal.x !== undefined) {
                                    abilityCalibration[a].x = cal.x;
                                    localStorage.setItem(`giftuber_cal_x_${a}`, cal.x);
                                }
                                if (cal.y !== undefined) {
                                    abilityCalibration[a].y = cal.y;
                                    localStorage.setItem(`giftuber_cal_y_${a}`, cal.y);
                                }
                                if (cal.rot !== undefined) {
                                    abilityCalibration[a].rot = cal.rot;
                                    localStorage.setItem(`giftuber_cal_rot_${a}`, cal.rot);
                                }
                            }
                        }
                    }
                }

                if (s.colorMappings) {
                    colorMappings = Object.assign({}, DEFAULT_COLOR_MAPPINGS, s.colorMappings);
                    saveColorMappings();
                }

                // Re-renderizar UI
                buildColorMappingUI();
            }
        } catch (_) {}
    }

    // ================================================================
    document.addEventListener('DOMContentLoaded', () => {
        loadCalibrationFromServer().then(() => {
            pushCalibrationToServer();
        });

        // Especialización de Paladín
        function pushSpecToServer(spec) {
            fetch('/display_state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paladin_spec: spec })
            }).catch(() => {});
        }

        const specSelect = document.getElementById('select-paladin-spec');
        if (specSelect) {
            const savedSpec = localStorage.getItem('giftuber_paladin_spec') || 'ret';
            specSelect.value = savedSpec;
            pushSpecToServer(savedSpec);
            specSelect.addEventListener('change', (e) => {
                localStorage.setItem('giftuber_paladin_spec', e.target.value);
                pushSpecToServer(e.target.value);
            });
        }

        const btnBaldShine = document.getElementById('btn-trigger-bald-shine');
        if (btnBaldShine) {
            btnBaldShine.addEventListener('click', () => {
                triggerPaladinAbility('bald_shine');
            });
        }

        const shineEl = document.querySelector('.bald-shine-effect');
        if (shineEl) {
            shineEl.addEventListener('animationend', () => {
                shineEl.classList.remove('shining');
            });
        }

        function syncElfSection() {
            const isElf = typeof STATE !== 'undefined' && (STATE.activeAvatar === 'lolirot' || STATE.activeAvatar === 'lolirot_red');
            const isBald = false;
            
            const s = document.getElementById('elf-controls-section');
            if (s) s.style.display = isElf ? 'block' : 'none';
            
            const colorSection = document.getElementById('color-automation-section');
            if (colorSection) colorSection.style.display = isElf ? 'block' : 'none';
            
            const baldShineGroup = document.getElementById('bald-shine-control-group');
            if (baldShineGroup) {
                baldShineGroup.style.display = isBald ? 'block' : 'none';
            }
        }
        syncElfSection();
        document.getElementById('select-avatar')?.addEventListener('change', () => setTimeout(syncElfSection, 50));
        let lastActiveAvatar = null;
        function syncElfDisplay() {
            if (typeof STATE !== 'undefined' && STATE.activeAvatar !== lastActiveAvatar) {
                lastActiveAvatar = STATE.activeAvatar;
                syncElfSection();
            }
            const display = document.getElementById('avatar-display');
            const userImg = document.getElementById('user-avatar-img');
            const wrapper = document.getElementById('avatar-wrapper');
            if (!display || !userImg || !wrapper) return;

            const isElf = typeof STATE !== 'undefined' && (STATE.activeAvatar === 'lolirot' || STATE.activeAvatar === 'lolirot_red');
            const isWalking = wrapper.classList.contains('walking-active');
            let legsImg = document.getElementById('legs-walk-overlay');

            if (isElf && isWalking) {
                wrapper.classList.add('active-elf-split');
                wrapper.classList.remove('avatar-lolirot', 'avatar-lolirot_red');
                wrapper.classList.add('avatar-' + STATE.activeAvatar);
                if (!legsImg) {
                    legsImg = document.createElement('img');
                    legsImg.id = 'legs-walk-overlay';
                    legsImg.className = 'elf-part legs-walk';
                    legsImg.style.position = 'absolute';
                    legsImg.style.top = '0';
                    legsImg.style.left = '0';
                    legsImg.style.width = '100%';
                    legsImg.style.height = '100%';
                    legsImg.style.objectFit = 'contain';
                    legsImg.style.pointerEvents = 'none';
                    legsImg.style.zIndex = '3';
                    
                    userImg.style.position = 'relative';
                    userImg.style.zIndex = '2';
                    
                    display.appendChild(legsImg);
                }
                legsImg.style.display = 'block';

                // Alterna entre frame 1 y 2 cada 250ms
                const walkFrame = Math.floor(Date.now() / 250) % 2 === 0 ? '1' : '2';
                const targetLegsSrc = `assets/${STATE.activeAvatar}/wow_chibi_legs_walk_${walkFrame}.png`;
                if (legsImg.getAttribute('data-src') !== targetLegsSrc) {
                    legsImg.src = targetLegsSrc;
                    legsImg.setAttribute('data-src', targetLegsSrc);
                }
                // Aplicar calibracion dinamica
                legsImg.style.transform = `scale(${legsScale}) translate(${legsTranslateX}px, ${legsTranslateY}px)`;
            } else {
                wrapper.classList.remove('active-elf-split', 'avatar-lolirot', 'avatar-lolirot_red');
                if (legsImg) {
                    legsImg.style.display = 'none';
                }
            }
        }
        setInterval(syncElfDisplay, 50);

        // Inicializar sliders de calibracion de piernas
        const scaleSlider = document.getElementById('slider-legs-scale');
        const ySlider = document.getElementById('slider-legs-y');
        const xSlider = document.getElementById('slider-legs-x');

        const scaleVal = document.getElementById('legs-scale-val');
        const yVal = document.getElementById('legs-y-val');
        const xVal = document.getElementById('legs-x-val');

        if (scaleSlider && scaleVal) {
            scaleSlider.value = legsScale;
            scaleVal.textContent = legsScale;
            scaleSlider.addEventListener('input', (e) => {
                legsScale = parseFloat(e.target.value);
                scaleVal.textContent = legsScale;
                localStorage.setItem('giftuber_legs_scale', legsScale);
                pushCalibrationToServer();
            });
        }
        if (ySlider && yVal) {
            ySlider.value = legsTranslateY;
            yVal.textContent = legsTranslateY + 'px';
            ySlider.addEventListener('input', (e) => {
                legsTranslateY = parseInt(e.target.value);
                yVal.textContent = legsTranslateY + 'px';
                localStorage.setItem('giftuber_legs_y', legsTranslateY);
                pushCalibrationToServer();
            });
        }
        if (xSlider && xVal) {
            xSlider.value = legsTranslateX;
            xVal.textContent = legsTranslateX + 'px';
            xSlider.addEventListener('input', (e) => {
                legsTranslateX = parseInt(e.target.value);
                xVal.textContent = legsTranslateX + 'px';
                localStorage.setItem('giftuber_legs_x', legsTranslateX);
                pushCalibrationToServer();
            });
        }

    });

})();
