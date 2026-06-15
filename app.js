// --- CONFIGURACIÓN E INITIAL STATE ---
const STATE = {
    audioContext: null,
    analyser: null,
    micStream: null,
    animationFrameId: null,
    
    // Configuración del usuario (cargada de localStorage o por defecto)
    threshold: 15,
    delay: 200,
    bounceHeight: 20,
    bounceSpeed: 150,
    avatarScale: 1.0,
    avatarX: 0,
    avatarY: 0,
    isGlowEnabled: true,
    activeBg: 'transparent',
    selectedMicId: '',
    
    // Estado en tiempo real
    volume: 0,
    isSpeaking: false,
    isBlinking: false,
    speakingTimeoutId: null,
    
    // Imágenes cargadas por el usuario (Base64)
    customImages: {
        idle: null,
        speakingMed: null,
        speakingWide: null,
        idleBlink: null,
        speakingBlink: null
    },

    // Avatar activo actual
    activeAvatar: 'lolirot',

    // Estado de disponibilidad de los assets locales
    defaultAssets: {
        available: false
    }
};

// --- BASE DE DATOS (IndexedDB) PARA IMÁGENES GRANDES ---
const DB_NAME = 'GiftuberDB';
const DB_VERSION = 1;
const STORE_NAME = 'avatar_images';

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        
        request.onsuccess = (e) => {
            resolve(e.target.result);
        };
        
        request.onerror = (e) => {
            console.error('Error al inicializar IndexedDB:', e.target.error);
            reject(e.target.error);
        };
    });
}

function saveImageToDB(key, base64Data) {
    return initDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(base64Data, key);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    });
}

function loadImageFromDB(key) {
    return initDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);
            
            request.onsuccess = (e) => resolve(e.target.result || null);
            request.onerror = () => reject(request.error);
        });
    });
}

function clearImagesFromDB() {
    return initDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    });
}

function deleteImageFromDB(key) {
    return initDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(key);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    });
}


// --- SELECTORES DOM ---
const DOM = {
    // Panel & General
    appContainer: document.getElementById('app-container'),
    controlPanel: document.getElementById('control-panel'),
    btnTogglePanel: document.getElementById('btn-toggle-panel'),
    btnRestart: document.getElementById('btn-restart-services'),
    
    // Audio
    btnAudioAuth: document.getElementById('btn-audio-auth'),
    selectMic: document.getElementById('select-mic'),
    volumeVal: document.getElementById('volume-val'),
    volumeBarFill: document.getElementById('volume-bar-fill'),
    volumeThresholdMarker: document.getElementById('volume-threshold-marker'),
    rangeThreshold: document.getElementById('range-threshold'),
    thresholdVal: document.getElementById('threshold-val'),
    rangeDelay: document.getElementById('range-delay'),
    delayVal: document.getElementById('delay-val'),
    
    // Carga de imágenes
    fileIdle: document.getElementById('file-idle'),
    fileIdleBlink: document.getElementById('file-idle-blink'),
    fileSpeakingMed: document.getElementById('file-speaking-med'),
    fileSpeakingWide: document.getElementById('file-speaking-wide'),
    fileSpeakingBlink: document.getElementById('file-speaking-blink'),
    thumbIdle: document.getElementById('thumb-idle'),
    thumbIdleBlink: document.getElementById('thumb-idle-blink'),
    thumbSpeakingMed: document.getElementById('thumb-speaking-med'),
    thumbSpeakingWide: document.getElementById('thumb-speaking-wide'),
    thumbSpeakingBlink: document.getElementById('thumb-speaking-blink'),
    btnResetAvatar: document.getElementById('btn-reset-avatar'),
    
    // Estilo
    rangeBounce: document.getElementById('range-bounce'),
    bounceVal: document.getElementById('bounce-val'),
    rangeBounceSpeed: document.getElementById('range-bounce-speed'),
    bounceSpeedVal: document.getElementById('bounce-speed-val'),
    rangeScale: document.getElementById('range-scale'),
    scaleVal: document.getElementById('scale-val'),
    rangeAvatarX: document.getElementById('range-avatar-x'),
    avatarXVal: document.getElementById('avatar-x-val'),
    rangeAvatarY: document.getElementById('range-avatar-y'),
    avatarYVal: document.getElementById('avatar-y-val'),
    chkGlow: document.getElementById('chk-glow'),
    bgColorPicker: document.getElementById('bg-color-picker'),
    bgButtons: document.querySelectorAll('.btn-bg'),
    
    // Viewport del Avatar
    avatarViewport: document.getElementById('avatar-viewport'),
    avatarWrapper: document.getElementById('avatar-wrapper'),
    avatarDisplay: document.getElementById('avatar-display'),
    avatarGlowRing: document.getElementById('avatar-glow-ring'),
    
    // Elementos del SVG por defecto
    defaultSvgAvatar: document.getElementById('default-svg-avatar'),
    eyeLeftOpen: document.getElementById('eye-left-open'),
    eyeLeftClosed: document.getElementById('eye-left-closed'),
    eyeRightOpen: document.getElementById('eye-right-open'),
    eyeRightClosed: document.getElementById('eye-right-closed'),
    mouthClosed: document.getElementById('mouth-closed'),
    mouthOpen: document.getElementById('mouth-open'),
    
    // Elemento Imagen del usuario
    userAvatarImg: document.getElementById('user-avatar-img'),
    
    // Selectores del selector de avatar, área de carga y botones de packs
    selectAvatar: document.getElementById('select-avatar'),
    customUploadArea: document.getElementById('custom-upload-area'),
    btnExportPack: document.getElementById('btn-export-pack'),
    btnImportPack: document.getElementById('btn-import-pack'),
    fileImportPack: document.getElementById('file-import-pack'),
    btnCopyObsUrl: document.getElementById('btn-copy-obs-url'),
    
    // Auto-Updater elements
    updateBanner: document.getElementById('update-banner'),
    updateVersionLabel: document.getElementById('update-version-label'),
    btnUpdateNow: document.getElementById('btn-update-now'),
    updateLoaderOverlay: document.getElementById('update-loader-overlay')
};


// --- CARGAR AJUSTES DESDE EL SERVIDOR ---
async function loadSettingsFromServer() {
    try {
        const resp = await fetch('/display_state', { cache: 'no-store' });
        if (resp.ok) {
            const s = await resp.json();
            if (s.threshold !== undefined && !isNaN(parseInt(s.threshold))) localStorage.setItem('threshold', s.threshold);
            if (s.delay !== undefined && !isNaN(parseInt(s.delay))) localStorage.setItem('delay', s.delay);
            if (s.bounceHeight !== undefined && !isNaN(parseInt(s.bounceHeight))) localStorage.setItem('bounceHeight', s.bounceHeight);
            if (s.bounceSpeed !== undefined && !isNaN(parseInt(s.bounceSpeed))) localStorage.setItem('bounceSpeed', s.bounceSpeed);
            if (s.avatarScale !== undefined && !isNaN(parseFloat(s.avatarScale))) localStorage.setItem('avatarScale', s.avatarScale);
            if (s.avatarX !== undefined && !isNaN(parseInt(s.avatarX))) localStorage.setItem('avatarX', s.avatarX);
            if (s.avatarY !== undefined && !isNaN(parseInt(s.avatarY))) localStorage.setItem('avatarY', s.avatarY);
            if (s.isGlowEnabled !== undefined) localStorage.setItem('isGlowEnabled', s.isGlowEnabled);
            if (s.activeBg !== undefined && s.activeBg !== null) localStorage.setItem('activeBg', s.activeBg);
            if (s.activeAvatar !== undefined && s.activeAvatar !== null) localStorage.setItem('activeAvatar', s.activeAvatar);
        }
    } catch (e) {
        console.error("Error al cargar ajustes del servidor:", e);
    }
}

function applyBounceHeight(height) {
    const ratio = height / 20.0;
    const sx40 = 1.0 + 0.03 * ratio;
    const sy40 = 1.0 - 0.03 * ratio;
    const sx100 = 1.0 - 0.03 * ratio;
    const sy100 = 1.0 + 0.05 * ratio;
    
    document.documentElement.style.setProperty('--bounce-height', `${height}px`);
    document.documentElement.style.setProperty('--bounce-scale-x-40', sx40);
    document.documentElement.style.setProperty('--bounce-scale-y-40', sy40);
    document.documentElement.style.setProperty('--bounce-scale-x-100', sx100);
    document.documentElement.style.setProperty('--bounce-scale-y-100', sy100);
}

// --- CARGAR Y APLICAR CONFIGURACIÓN GUARDADA ---
function loadSettings() {
    // Cargar sliders y valores
    if (localStorage.getItem('threshold')) {
        STATE.threshold = parseInt(localStorage.getItem('threshold'));
        DOM.rangeThreshold.value = STATE.threshold;
        DOM.thresholdVal.textContent = `${STATE.threshold}%`;
        DOM.volumeThresholdMarker.style.left = `${STATE.threshold}%`;
    }
    
    if (localStorage.getItem('delay')) {
        STATE.delay = parseInt(localStorage.getItem('delay'));
        DOM.rangeDelay.value = STATE.delay;
        DOM.delayVal.textContent = `${STATE.delay}ms`;
    }
    
    if (localStorage.getItem('bounceHeight')) {
        STATE.bounceHeight = parseInt(localStorage.getItem('bounceHeight'));
    }
    DOM.rangeBounce.value = STATE.bounceHeight;
    DOM.bounceVal.textContent = `${STATE.bounceHeight}px`;
    applyBounceHeight(STATE.bounceHeight);

    if (localStorage.getItem('bounceSpeed')) {
        STATE.bounceSpeed = parseInt(localStorage.getItem('bounceSpeed'));
        DOM.rangeBounceSpeed.value = STATE.bounceSpeed;
        DOM.bounceSpeedVal.textContent = `${STATE.bounceSpeed}ms`;
        document.documentElement.style.setProperty('--bounce-speed', `${STATE.bounceSpeed}ms`);
    }

    if (localStorage.getItem('avatarScale')) {
        STATE.avatarScale = parseFloat(localStorage.getItem('avatarScale'));
        DOM.rangeScale.value = STATE.avatarScale;
        DOM.scaleVal.textContent = `${STATE.avatarScale.toFixed(1)}x`;
        document.documentElement.style.setProperty('--avatar-scale', STATE.avatarScale);
    }
    
    if (localStorage.getItem('avatarX')) {
        STATE.avatarX = parseInt(localStorage.getItem('avatarX'));
        DOM.rangeAvatarX.value = STATE.avatarX;
        DOM.avatarXVal.textContent = `${STATE.avatarX}px`;
        document.documentElement.style.setProperty('--avatar-x', `${STATE.avatarX}px`);
    }
    
    if (localStorage.getItem('avatarY')) {
        STATE.avatarY = parseInt(localStorage.getItem('avatarY'));
        DOM.rangeAvatarY.value = STATE.avatarY;
        DOM.avatarYVal.textContent = `${STATE.avatarY}px`;
        document.documentElement.style.setProperty('--avatar-y', `${STATE.avatarY}px`);
    }
    
    if (localStorage.getItem('isGlowEnabled')) {
        STATE.isGlowEnabled = localStorage.getItem('isGlowEnabled') === 'true';
        DOM.chkGlow.checked = STATE.isGlowEnabled;
    }
    
    if (localStorage.getItem('activeBg')) {
        STATE.activeBg = localStorage.getItem('activeBg');
        applyBackground(STATE.activeBg);
    }
    
    if (localStorage.getItem('selectedMicId')) {
        STATE.selectedMicId = localStorage.getItem('selectedMicId');
    }

    if (localStorage.getItem('activeAvatar')) {
        STATE.activeAvatar = localStorage.getItem('activeAvatar');
        DOM.selectAvatar.value = STATE.activeAvatar;
    } else {
        DOM.selectAvatar.value = STATE.activeAvatar;
    }
    toggleCustomUploadArea();
}

function toggleCustomUploadArea() {
    if (STATE.activeAvatar === 'custom') {
        DOM.customUploadArea.style.display = 'block';
    } else {
        DOM.customUploadArea.style.display = 'none';
    }
}

// --- ENVIAR CONFIGURACIÓN DE ANIMACIÓN Y ESTILO AL SERVIDOR ---
function pushSettingsToServer() {
    fetch('/display_state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            bounceHeight: STATE.bounceHeight,
            bounceSpeed: STATE.bounceSpeed,
            avatarScale: STATE.avatarScale,
            avatarX: STATE.avatarX,
            avatarY: STATE.avatarY,
            isGlowEnabled: STATE.isGlowEnabled,
            threshold: STATE.threshold,
            delay: STATE.delay,
            activeBg: STATE.activeBg,
            activeAvatar: STATE.activeAvatar
        })
    }).catch(() => {});
}

// --- CONFIGURAR EVENTOS ---
function initEvents() {
    // Toggle del panel lateral
    DOM.btnTogglePanel.addEventListener('click', toggleControlPanel);

    // Botón para copiar la URL de OBS
    if (DOM.btnCopyObsUrl) {
        DOM.btnCopyObsUrl.addEventListener('click', () => {
            const urlText = "http://127.0.0.1:8000/obs.html";
            navigator.clipboard.writeText(urlText).then(() => {
                const btnSpan = DOM.btnCopyObsUrl.querySelector('span');
                const originalText = btnSpan ? btnSpan.textContent : 'Copiar';
                if (btnSpan) btnSpan.textContent = '¡Copiado!';
                DOM.btnCopyObsUrl.style.borderColor = 'var(--green)';
                DOM.btnCopyObsUrl.style.color = 'var(--green)';
                setTimeout(() => {
                    if (btnSpan) btnSpan.textContent = originalText;
                    DOM.btnCopyObsUrl.style.borderColor = '';
                    DOM.btnCopyObsUrl.style.color = '';
                }, 1500);
            }).catch(err => {
                console.error('Error al copiar la URL:', err);
            });
        });
    }

    // Reiniciar servicios (servidor y AHK)
    if (DOM.btnRestart) {
        DOM.btnRestart.addEventListener('click', () => {
            DOM.btnRestart.disabled = true;
            DOM.btnRestart.innerHTML = '⏳ Reiniciando...';
            fetch('/restart_services', { method: 'POST' })
                .then(() => {
                    setTimeout(() => {
                        DOM.btnRestart.disabled = false;
                        DOM.btnRestart.innerHTML = '🔄 Reiniciar';
                    }, 1500);
                })
                .catch(() => {
                    DOM.btnRestart.disabled = false;
                    DOM.btnRestart.innerHTML = '❌ Error';
                    setTimeout(() => {
                        DOM.btnRestart.innerHTML = '🔄 Reiniciar';
                    }, 2000);
                });
        });
    }
    
    // Ocultar con tecla 'H'
    window.addEventListener('keydown', (e) => {
        if (e.key === 'h' || e.key === 'H') {
            // Evitar disparar si se está escribiendo en algún input (aunque en este app no hay inputs de texto)
            if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
                toggleControlPanel();
            }
        }
    });

    // Activar Micrófono
    DOM.btnAudioAuth.addEventListener('click', requestMicrophoneAccess);
    
    // Selector de Micrófono
    DOM.selectMic.addEventListener('change', (e) => {
        STATE.selectedMicId = e.target.value;
        localStorage.setItem('selectedMicId', STATE.selectedMicId);
        startAudioStream(STATE.selectedMicId);
    });

    // Selector de Avatar Activo
    DOM.selectAvatar.addEventListener('change', async (e) => {
        STATE.activeAvatar = e.target.value;
        localStorage.setItem('activeAvatar', STATE.activeAvatar);
        toggleCustomUploadArea();
        await checkDefaultAssets();
        updateAvatarVisuals();
        pushSettingsToServer();
    });

    // Sensibilidad (Threshold)
    DOM.rangeThreshold.addEventListener('input', (e) => {
        STATE.threshold = parseInt(e.target.value);
        DOM.thresholdVal.textContent = `${STATE.threshold}%`;
        DOM.volumeThresholdMarker.style.left = `${STATE.threshold}%`;
        localStorage.setItem('threshold', STATE.threshold);
        pushSettingsToServer();
    });

    // Retraso al Callar (Delay)
    DOM.rangeDelay.addEventListener('input', (e) => {
        STATE.delay = parseInt(e.target.value);
        DOM.delayVal.textContent = `${STATE.delay}ms`;
        localStorage.setItem('delay', STATE.delay);
        pushSettingsToServer();
    });

    // Intensidad del Rebote
    DOM.rangeBounce.addEventListener('input', (e) => {
        STATE.bounceHeight = parseInt(e.target.value);
        DOM.bounceVal.textContent = `${STATE.bounceHeight}px`;
        applyBounceHeight(STATE.bounceHeight);
        localStorage.setItem('bounceHeight', STATE.bounceHeight);
        pushSettingsToServer();
    });

    // Velocidad del Rebote
    DOM.rangeBounceSpeed.addEventListener('input', (e) => {
        STATE.bounceSpeed = parseInt(e.target.value);
        DOM.bounceSpeedVal.textContent = `${STATE.bounceSpeed}ms`;
        document.documentElement.style.setProperty('--bounce-speed', `${STATE.bounceSpeed}ms`);
        localStorage.setItem('bounceSpeed', STATE.bounceSpeed);
        pushSettingsToServer();
    });

    // Escala del Avatar
    DOM.rangeScale.addEventListener('input', (e) => {
        STATE.avatarScale = parseFloat(e.target.value);
        DOM.scaleVal.textContent = `${STATE.avatarScale.toFixed(1)}x`;
        document.documentElement.style.setProperty('--avatar-scale', STATE.avatarScale);
        localStorage.setItem('avatarScale', STATE.avatarScale);
        pushSettingsToServer();
    });

    // Desplazamiento X (Avatar)
    DOM.rangeAvatarX.addEventListener('input', (e) => {
        STATE.avatarX = parseInt(e.target.value);
        DOM.avatarXVal.textContent = `${STATE.avatarX}px`;
        document.documentElement.style.setProperty('--avatar-x', `${STATE.avatarX}px`);
        localStorage.setItem('avatarX', STATE.avatarX);
        pushSettingsToServer();
    });

    // Desplazamiento Y (Avatar)
    DOM.rangeAvatarY.addEventListener('input', (e) => {
        STATE.avatarY = parseInt(e.target.value);
        DOM.avatarYVal.textContent = `${STATE.avatarY}px`;
        document.documentElement.style.setProperty('--avatar-y', `${STATE.avatarY}px`);
        localStorage.setItem('avatarY', STATE.avatarY);
        pushSettingsToServer();
    });

    // Brillo reactivo
    DOM.chkGlow.addEventListener('change', (e) => {
        STATE.isGlowEnabled = e.target.checked;
        localStorage.setItem('isGlowEnabled', STATE.isGlowEnabled);
        if (!STATE.isGlowEnabled) {
            DOM.avatarGlowRing.style.opacity = '0';
        }
        pushSettingsToServer();
    });

    // Carga de imágenes locales
    setupImageUploader(DOM.fileIdle, 'idle', DOM.thumbIdle, '🐱 (Cerrado)');
    setupImageUploader(DOM.fileIdleBlink, 'idleBlink', DOM.thumbIdleBlink, '😴 (Cerrado)');
    setupImageUploader(DOM.fileSpeakingMed, 'speakingMed', DOM.thumbSpeakingMed, '😸 (Boca Media)');
    setupImageUploader(DOM.fileSpeakingWide, 'speakingWide', DOM.thumbSpeakingWide, '📢 (Boca Ancha)');
    setupImageUploader(DOM.fileSpeakingBlink, 'speakingBlink', DOM.thumbSpeakingBlink, '😉 (Abierto)');

    // Resetear Avatar
    DOM.btnResetAvatar.addEventListener('click', resetAvatarToDefault);

    // Acciones de Packs (Importar/Exportar)
    DOM.btnExportPack.addEventListener('click', exportAvatarPack);
    DOM.btnImportPack.addEventListener('click', handleImportPackClick);
    DOM.fileImportPack.addEventListener('change', importAvatarPack);

    // Configurar Fondos
    DOM.bgButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const bgType = btn.dataset.bg;
            applyBackground(bgType);
            
            // Actualizar botones activos
            DOM.bgButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            pushSettingsToServer();
        });
    });

    // Color Picker personalizado para el fondo
    DOM.bgColorPicker.addEventListener('input', (e) => {
        applyBackground(e.target.value);
        DOM.bgButtons.forEach(b => b.classList.remove('active'));
        pushSettingsToServer();
    });
}

function toggleControlPanel() {
    DOM.controlPanel.classList.toggle('collapsed');
    DOM.btnTogglePanel.classList.toggle('collapsed');
    
    // Cambiar iconos en el botón
    const iconHide = DOM.btnTogglePanel.querySelector('.icon-hide');
    const iconShow = DOM.btnTogglePanel.querySelector('.icon-show');
    
    if (DOM.controlPanel.classList.contains('collapsed')) {
        iconHide.style.display = 'none';
        iconShow.style.display = 'inline-block';
    } else {
        iconHide.style.display = 'inline-block';
        iconShow.style.display = 'none';
    }
}

function applyBackground(bgValue) {
    STATE.activeBg = bgValue;
    localStorage.setItem('activeBg', bgValue);
    
    if (bgValue === 'transparent') {
        document.body.classList.add('transparent-mode');
        document.body.style.backgroundColor = 'transparent';
        DOM.avatarViewport.style.backgroundColor = 'transparent';
    } else {
        document.body.classList.remove('transparent-mode');
        document.body.style.backgroundColor = bgValue;
        DOM.avatarViewport.style.backgroundColor = bgValue;
    }
}


// --- CONFIGURACIÓN DE AUDIO Y DETECCIÓN ---
async function requestMicrophoneAccess() {
    try {
        // Solicitar permisos
        const initialStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Liberar el stream inicial para enumerar los dispositivos de audio limpios
        initialStream.getTracks().forEach(track => track.stop());
        
        // Habilitar elementos de control
        document.querySelectorAll('.disabled-until-auth').forEach(el => el.classList.add('active'));
        DOM.selectMic.disabled = false;
        DOM.rangeThreshold.disabled = false;
        DOM.rangeDelay.disabled = false;
        
        DOM.btnAudioAuth.textContent = '✅ Micrófono Conectado';
        DOM.btnAudioAuth.classList.add('btn-secondary');
        DOM.btnAudioAuth.classList.remove('btn-primary');
        DOM.btnAudioAuth.disabled = true;

        // Enumerar micrófonos
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        DOM.selectMic.innerHTML = '';
        audioInputs.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `Micrófono (${device.deviceId.substring(0, 5)}...)`;
            DOM.selectMic.appendChild(option);
        });

        // Intentar seleccionar el micrófono guardado previamente
        if (STATE.selectedMicId && audioInputs.some(d => d.deviceId === STATE.selectedMicId)) {
            DOM.selectMic.value = STATE.selectedMicId;
        } else if (audioInputs.length > 0) {
            STATE.selectedMicId = audioInputs[0].deviceId;
            DOM.selectMic.value = STATE.selectedMicId;
        }

        // Iniciar la transmisión de audio
        startAudioStream(STATE.selectedMicId);

    } catch (err) {
        console.error('Error al acceder al micrófono:', err);
        alert('No se pudo acceder al micrófono. Asegúrate de dar permisos en tu navegador.');
    }
}

async function startAudioStream(deviceId) {
    // Si hay un stream activo, pararlo primero
    if (STATE.micStream) {
        STATE.micStream.getTracks().forEach(track => track.stop());
    }
    if (STATE.audioContext) {
        await STATE.audioContext.close();
    }
    if (STATE.animationFrameId) {
        clearInterval(STATE.animationFrameId); // era cancelAnimationFrame
        STATE.animationFrameId = null;
    }

    try {
        const constraints = {
            audio: {
                deviceId: deviceId ? { exact: deviceId } : undefined,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        };

        STATE.micStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        STATE.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        STATE.analyser = STATE.audioContext.createAnalyser();
        STATE.analyser.fftSize = 256;
        STATE.analyser.smoothingTimeConstant = 0.2;

        const source = STATE.audioContext.createMediaStreamSource(STATE.micStream);
        source.connect(STATE.analyser);

        // ── Keep-alive: oscilador casi-silencioso para evitar que Chrome
        //    suspenda el AudioContext cuando la tab está en segundo plano.
        //    Chrome no throttlea tabs con AudioContext activo que produce audio.
        const keepAliveOsc  = STATE.audioContext.createOscillator();
        const keepAliveGain = STATE.audioContext.createGain();
        keepAliveGain.gain.setValueAtTime(0.00001, STATE.audioContext.currentTime);
        keepAliveOsc.connect(keepAliveGain);
        keepAliveGain.connect(STATE.audioContext.destination);
        keepAliveOsc.start();

        // Iniciar el bucle de detección de volumen
        analyzeVolume();
    } catch (err) {
        console.error('Error al iniciar el stream de audio:', err);
    }
}

function analyzeVolume() {
    const bufferLength = STATE.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const tick = () => {
        if (!STATE.analyser) return;
        
        // Si el AudioContext fue suspendido por el navegador, reanudarlo
        if (STATE.audioContext && STATE.audioContext.state === 'suspended') {
            STATE.audioContext.resume();
        }

        STATE.analyser.getByteFrequencyData(dataArray);
        
        // Calcular volumen (Media de las frecuencias)
        let total = 0;
        for (let i = 0; i < bufferLength; i++) {
            total += dataArray[i];
        }
        
        // Promedio en rango 0-100
        const average = total / bufferLength;
        STATE.volume = Math.min(100, Math.round((average / 150) * 100));

        // Actualizar la interfaz del volumen
        DOM.volumeBarFill.style.width = `${STATE.volume}%`;
        DOM.volumeVal.textContent = `${STATE.volume}%`;

        // Lógica de detección de voz (Hablar)
        if (STATE.volume >= STATE.threshold) {
            if (STATE.speakingTimeoutId) {
                clearTimeout(STATE.speakingTimeoutId);
                STATE.speakingTimeoutId = null;
            }
            if (!STATE.isSpeaking) {
                setSpeakingState(true);
            }
        } else {
            if (STATE.isSpeaking && !STATE.speakingTimeoutId) {
                STATE.speakingTimeoutId = setTimeout(() => {
                    setSpeakingState(false);
                    STATE.speakingTimeoutId = null;
                }, STATE.delay);
            }
        }

        // Brillo reactivo dinámico según el volumen instantáneo
        if (STATE.isSpeaking && STATE.isGlowEnabled) {
            const glowIntensity = Math.min(1.0, 0.3 + (STATE.volume / 100));
            const glowScale = Math.min(1.3, 1.0 + (STATE.volume / 200));
            DOM.avatarGlowRing.style.opacity = glowIntensity;
            DOM.avatarGlowRing.style.transform = `scale(${glowScale})`;
        } else if (!STATE.isSpeaking) {
            DOM.avatarGlowRing.style.opacity = '0';
        }
    };

    // setInterval en lugar de requestAnimationFrame:
    // rAF se congela completamente en tabs de fondo; setInterval solo se limita
    // a ~1s en tabs sin audio, pero con el oscilador keep-alive activo Chrome
    // lo deja correr a la velocidad normal.
    if (STATE.animationFrameId) clearInterval(STATE.animationFrameId);
    STATE.animationFrameId = setInterval(tick, 50);
}


// --- CONFIGURACIÓN DE LOS ESTADOS DEL AVATAR ---
function setSpeakingState(speaking) {
    STATE.isSpeaking = speaking;
    fetch('/display_state', { method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ speaking }) }).catch(() => {});
    if (speaking) {
        DOM.avatarWrapper.classList.add('speaking');
        DOM.avatarWrapper.classList.remove('idle');
    } else {
        DOM.avatarWrapper.classList.remove('speaking');
        DOM.avatarWrapper.classList.add('idle');
    }
    
    updateAvatarVisuals();
}

function setBlinkState(blinking) {
    STATE.isBlinking = blinking;
    updateAvatarVisuals();
}

function updateAvatarVisuals() {
    const isPresetMode = (STATE.activeAvatar === 'lolirot' || STATE.activeAvatar === 'lolirot_red') && STATE.defaultAssets.available;
    const isCustomMode = STATE.activeAvatar === 'custom' && STATE.customImages.idle;
    
    if (isPresetMode || isCustomMode) {
        DOM.defaultSvgAvatar.style.display = 'none';
        DOM.userAvatarImg.style.display = 'block';
        
        let activeSrc = '';
        
        if (isCustomMode) {
            if (STATE.isSpeaking) {
                if (STATE.isBlinking && STATE.customImages.speakingBlink) {
                    activeSrc = STATE.customImages.speakingBlink;
                } else {
                    const hasMed = !!STATE.customImages.speakingMed;
                    const hasWide = !!STATE.customImages.speakingWide;
                    
                    if (hasMed && hasWide) {
                        const midVolume = STATE.threshold + (100 - STATE.threshold) * 0.35;
                        if (STATE.volume < midVolume) {
                            activeSrc = STATE.customImages.speakingMed;
                        } else {
                            activeSrc = STATE.customImages.speakingWide;
                        }
                    } else {
                        activeSrc = STATE.customImages.speakingWide || STATE.customImages.speakingMed || STATE.customImages.idle;
                    }
                }
            } else {
                if (STATE.isBlinking && STATE.customImages.idleBlink) {
                    activeSrc = STATE.customImages.idleBlink;
                } else {
                    activeSrc = STATE.customImages.idle;
                }
            }
        } else {
            // Lógica para assets locales del WoW Chibi (con boca dinámica y parpadeos)
            if (STATE.isSpeaking) {
                if (STATE.isBlinking && STATE.defaultAssets.speakingBlink) {
                    activeSrc = STATE.defaultAssets.speakingBlink;
                } else {
                    // Alterna boca mediana o ancha en base al volumen
                    const midVolume = STATE.threshold + (100 - STATE.threshold) * 0.35;
                    if (STATE.volume < midVolume) {
                        activeSrc = STATE.defaultAssets.speakingMed;
                    } else {
                        activeSrc = STATE.defaultAssets.speakingWide;
                    }
                }
            } else {
                if (STATE.isBlinking && STATE.defaultAssets.idleBlink) {
                    activeSrc = STATE.defaultAssets.idleBlink;
                } else {
                    activeSrc = STATE.defaultAssets.idle;
                }
            }
        }
        
        // Solo actualizar el src de la imagen si ha cambiado, para evitar parpadeos blancos en algunos navegadores
        if (DOM.userAvatarImg.src !== activeSrc && activeSrc) {
            DOM.userAvatarImg.src = activeSrc;
            fetch('/display_state', { method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ avatar_src: activeSrc }) }).catch(() => {});
        }

        // Actualizar máscara y visibilidad del brillo de la calva
        const shineEl = document.querySelector('.bald-shine-effect');
        if (shineEl) {
            if (activeSrc) {
                shineEl.style.setProperty('--avatar-mask-url', `url("${activeSrc}")`);
            }
            if (STATE.activeAvatar === 'wow_elf_bald') {
                shineEl.style.display = 'block';
            } else {
                shineEl.style.display = 'none';
            }
        }
    } else {
        // Usar SVG por defecto
        DOM.defaultSvgAvatar.style.display = 'block';
        DOM.userAvatarImg.style.display = 'none';

        const shineEl = document.querySelector('.bald-shine-effect');
        if (shineEl) shineEl.style.display = 'none';
        
        // Boca
        if (STATE.isSpeaking) {
            DOM.mouthClosed.style.display = 'none';
            DOM.mouthOpen.style.display = 'block';
        } else {
            DOM.mouthClosed.style.display = 'block';
            DOM.mouthOpen.style.display = 'none';
        }
        
        // Ojos (Parpadeo)
        if (STATE.isBlinking) {
            DOM.eyeLeftOpen.style.display = 'none';
            DOM.eyeLeftClosed.style.display = 'block';
            DOM.eyeRightOpen.style.display = 'none';
            DOM.eyeRightClosed.style.display = 'block';
        } else {
            DOM.eyeLeftOpen.style.display = 'block';
            DOM.eyeLeftClosed.style.display = 'none';
            DOM.eyeRightOpen.style.display = 'block';
            DOM.eyeRightClosed.style.display = 'none';
        }
    }
}

// Bucle de parpadeo automático y aleatorio
let blinkTimer = null;
function startBlinkCycle() {
    const triggerBlink = () => {
        setBlinkState(true);
        setTimeout(() => {
            setBlinkState(false);
            
            // Programar el siguiente parpadeo en un rango aleatorio (2 a 6 segundos)
            const nextBlinkIn = 2000 + Math.random() * 4000;
            blinkTimer = setTimeout(triggerBlink, nextBlinkIn);
        }, 150); // El parpadeo dura 150ms
    };
    
    blinkTimer = setTimeout(triggerBlink, 3000);
}


// --- GESTIÓN DE SUBIDA DE IMÁGENES ---
function setupImageUploader(inputEl, stateKey, thumbEl, placeholderText) {
    // Al hacer clic en el uploader ficticio
    const parentBox = inputEl.closest('.upload-box');
    const triggerBtn = parentBox.querySelector('.btn-upload-trigger');
    
    parentBox.addEventListener('click', (e) => {
        if (e.target !== inputEl) {
            inputEl.click();
        }
    });

    inputEl.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar tamaño o tipo si se desea (de momento aceptamos cualquier imagen)
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona un archivo de imagen.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64Data = event.target.result;
            
            // Guardar en estado e IndexedDB
            STATE.customImages[stateKey] = base64Data;
            await saveImageToDB(stateKey, base64Data);
            
            // Actualizar vista previa
            thumbEl.innerHTML = `<img src="${base64Data}" alt="preview">`;
            
            // Forzar actualización visual del avatar
            updateAvatarVisuals();
        };
        reader.readAsDataURL(file);
    });
}

async function loadUploadedImages() {
    try {
        const keys = ['idle', 'idleBlink', 'speakingMed', 'speakingWide', 'speakingBlink'];
        const thumbs = {
            idle: DOM.thumbIdle,
            idleBlink: DOM.thumbIdleBlink,
            speakingMed: DOM.thumbSpeakingMed,
            speakingWide: DOM.thumbSpeakingWide,
            speakingBlink: DOM.thumbSpeakingBlink
        };
        const placeholders = {
            idle: '🐱 (Cerrado)',
            idleBlink: '😴 (Cerrado)',
            speakingMed: '😸 (Boca Media)',
            speakingWide: '📢 (Boca Ancha)',
            speakingBlink: '😉 (Abierto)'
        };

        for (const key of keys) {
            const base64 = await loadImageFromDB(key);
            if (base64) {
                STATE.customImages[key] = base64;
                thumbs[key].innerHTML = `<img src="${base64}" alt="preview">`;
            } else {
                STATE.customImages[key] = null;
                thumbs[key].innerHTML = `<span class="placeholder-thumb">${placeholders[key]}</span>`;
            }
        }
        
        updateAvatarVisuals();
    } catch (err) {
        console.error('Error al cargar imágenes desde la DB:', err);
    }
}

async function resetAvatarToDefault() {
    if (confirm('¿Estás seguro de que quieres limpiar tus imágenes cargadas? Se borrarán tus configuraciones actuales.')) {
        await clearImagesFromDB();
        
        // Limpiar inputs
        DOM.fileIdle.value = '';
        DOM.fileIdleBlink.value = '';
        DOM.fileSpeakingMed.value = '';
        DOM.fileSpeakingWide.value = '';
        DOM.fileSpeakingBlink.value = '';
        
        // Recargar imágenes (las limpiará del estado)
        await loadUploadedImages();
    }
}


// --- EXPORTAR E IMPORTAR PACKS DE AVATAR (.gtuber) ---
async function exportAvatarPack() {
    try {
        let packData = {
            version: '1.0',
            name: STATE.activeAvatar === 'custom' ? 'Avatar Personalizado' : 'Lolirot Chibi',
            images: {}
        };
        
        const keys = ['idle', 'idleBlink', 'speakingMed', 'speakingWide', 'speakingBlink'];
        const isPreset = STATE.activeAvatar === 'lolirot' || STATE.activeAvatar === 'lolirot_red';
        
        if (isPreset) {
            // Mostrar indicador de progreso simple ya que requiere convertir URLs a base64
            DOM.btnExportPack.textContent = '⏳ Procesando...';
            DOM.btnExportPack.disabled = true;
            
            for (const key of keys) {
                const url = STATE.defaultAssets[key];
                if (url) {
                    try {
                        const base64 = await getBase64FromUrl(url);
                        packData.images[key] = base64;
                    } catch (e) {
                        console.warn(`No se pudo convertir la imagen del preset: ${key}`, e);
                    }
                }
            }
            
            DOM.btnExportPack.textContent = '📥 Exportar Pack';
            DOM.btnExportPack.disabled = false;
        } else if (STATE.activeAvatar === 'custom') {
            for (const key of keys) {
                if (STATE.customImages[key]) {
                    packData.images[key] = STATE.customImages[key];
                }
            }
        } else {
            alert('Por favor selecciona un avatar (Elfo, Illidan o Personalizado) antes de exportar.');
            return;
        }
        
        if (!packData.images.idle) {
            alert('El avatar actual no tiene suficientes imágenes cargadas para exportar un pack.');
            return;
        }
        
        DOM.btnExportPack.textContent = '⏳ Exportando...';
        DOM.btnExportPack.disabled = true;

        const resp = await fetch('/export_pack', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(packData)
        });

        if (resp.ok) {
            const res = await resp.json();
            if (res.ok) {
                alert(`¡Pack exportado con éxito en tu carpeta de Descargas!\n\nArchivo: ${res.path}`);
            } else {
                throw new Error(res.error || 'Error del servidor al guardar el archivo');
            }
        } else {
            throw new Error(`HTTP error: ${resp.status}`);
        }

        DOM.btnExportPack.textContent = '📥 Exportar Pack';
        DOM.btnExportPack.disabled = false;
        
    } catch (err) {
        console.error('Error al exportar pack:', err);
        alert('Hubo un error al exportar el pack de avatar.');
        DOM.btnExportPack.textContent = '📥 Exportar Pack';
        DOM.btnExportPack.disabled = false;
    }
}

async function getBase64FromUrl(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function handleImportPackClick() {
    DOM.fileImportPack.click();
}

async function importAvatarPack(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const packData = JSON.parse(e.target.result);
                
                if (!packData.images || !packData.images.idle) {
                    alert('El archivo .gtuber no es válido o no contiene imágenes.');
                    return;
                }
                
                const keys = ['idle', 'idleBlink', 'speakingMed', 'speakingWide', 'speakingBlink'];
                for (const key of keys) {
                    if (packData.images[key]) {
                        STATE.customImages[key] = packData.images[key];
                        await saveImageToDB(key, packData.images[key]);
                    } else {
                        STATE.customImages[key] = null;
                        await deleteImageFromDB(key);
                    }
                }
                
                STATE.activeAvatar = 'custom';
                DOM.selectAvatar.value = 'custom';
                localStorage.setItem('activeAvatar', 'custom');
                
                await loadUploadedImages();
                toggleCustomUploadArea();
                
                alert(`¡Pack "${packData.name || 'Importado'}" cargado con éxito!`);
            } catch (err) {
                console.error('Error al parsear el pack:', err);
                alert('No se pudo leer el archivo .gtuber. Asegúrate de que sea un archivo válido.');
            }
        };
        reader.readAsText(file);
    } catch (err) {
        console.error('Error al importar:', err);
    }
    
    DOM.fileImportPack.value = '';
}


async function checkDefaultAssets() {
    let activeFolder = (STATE.activeAvatar === 'lolirot_red') ? 'lolirot_red' : 'lolirot';
    STATE.defaultAssets = {
        idle: `assets/${activeFolder}/wow_chibi_idle.png`,
        speakingMed: `assets/${activeFolder}/wow_chibi_speaking_med.png`,
        speakingWide: `assets/${activeFolder}/wow_chibi_speaking_wide.png`,
        idleBlink: `assets/${activeFolder}/wow_chibi_idle_blink.png`,
        speakingBlink: `assets/${activeFolder}/wow_chibi_speaking_blink.png`,
        available: false
    };

    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            STATE.defaultAssets.available = true;
            resolve(true);
        };
        img.onerror = () => {
            STATE.defaultAssets.available = false;
            resolve(false);
        };
        img.src = STATE.defaultAssets.idle;
    });
}


// --- AUTO-UPDATER ---
async function checkUpdates() {
    try {
        const resp = await fetch('/check_update', { cache: 'no-store' });
        if (!resp.ok) return;
        const res = await resp.json();
        
        if (res.current_version) {
            const footerVer = document.getElementById('app-version-footer');
            if (footerVer) footerVer.textContent = `v${res.current_version}`;
        }
        
        if (res.update_available && res.download_url) {
            console.log(`[*] Nueva actualización disponible: v${res.new_version}`);
            if (DOM.updateBanner && DOM.updateVersionLabel) {
                DOM.updateVersionLabel.textContent = `v${res.new_version}`;
                DOM.updateBanner.style.display = 'block';
                
                DOM.btnUpdateNow.onclick = async () => {
                    if (confirm(`¿Estás seguro de que deseas actualizar a la versión v${res.new_version}? El programa se cerrará para aplicar los cambios.`)) {
                        DOM.updateLoaderOverlay.style.display = 'flex';
                        try {
                            const postResp = await fetch('/trigger_update', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ download_url: res.download_url })
                            });
                            if (!postResp.ok) {
                                alert('Error al iniciar la actualización. Por favor inténtalo de nuevo.');
                                DOM.updateLoaderOverlay.style.display = 'none';
                            }
                        } catch (err) {
                            console.error('Error al solicitar actualización:', err);
                            alert('Error de conexión al iniciar la actualización.');
                            DOM.updateLoaderOverlay.style.display = 'none';
                        }
                    }
                };
            }
        }
    } catch (err) {
        console.error('Error en el auto-updater:', err);
    }
}


// --- INICIALIZACIÓN ---
async function init() {
    await loadSettingsFromServer();
    loadSettings();
    pushSettingsToServer();
    initEvents();
    await checkDefaultAssets();
    await loadUploadedImages();
    startBlinkCycle();
    
    // Buscar actualizaciones automáticas
    checkUpdates();
    
    console.log('Giftuber inicializado correctamente.');
}

// Iniciar aplicación
document.addEventListener('DOMContentLoaded', init);
