import http.server
import socketserver
import threading
import queue
import urllib.parse
import urllib.request
import os
import json
import time
import glob
import subprocess
import atexit
import yt_dlp
import ssl

# Crear contexto SSL que ignora la verificación de certificados para evitar errores en sistemas sin certificados actualizados
try:
    ssl_context = ssl._create_unverified_context()
except AttributeError:
    ssl_context = None

VERSION = "2.4.12"
UPDATE_URL = "https://raw.githubusercontent.com/sephirods/Giftuber_wow_lolirot/main/version.json"
if os.path.exists("updater_url_config.txt"):
    try:
        with open("updater_url_config.txt", "r", encoding="utf-8") as f:
            custom_url = f.read().strip()
            if custom_url.startswith("http"):
                UPDATE_URL = custom_url
    except Exception:
        pass

# Configurar carpeta persistente para datos de usuario de WebView2 (evita pérdida de localStorage e IndexedDB)
app_data_dir = os.getenv('APPDATA')
if app_data_dir:
    webview2_dir = os.path.join(app_data_dir, 'Giftuber', 'WebView2')
    try:
        os.makedirs(webview2_dir, exist_ok=True)
        os.environ['WEBVIEW2_USER_DATA_FOLDER'] = webview2_dir
        # Auto-conceder permisos de captura y auto-seleccionar la ventana del programa para evitar carteles
        os.environ['WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS'] = '--use-fake-ui-for-media-stream --auto-select-desktop-capture-source="Giftuber Panel"'
    except Exception:
        pass

ahk_process = None

def kill_ahk():
    global ahk_process
    print("[*] Deteniendo todos los procesos de AutoHotkey...")
    if ahk_process:
        try:
            ahk_process.terminate()
        except Exception:
            pass
        ahk_process = None
    
    # Matar procesos de manera silenciosa sin parpadeos de consola cmd
    for exe in ["AutoHotkey.exe", "AutoHotkeyUX.exe", "AutoHotkey64.exe", "AutoHotkey32.exe"]:
        try:
            subprocess.run(["taskkill", "/f", "/im", exe], 
                           creationflags=0x08000000, 
                           stdout=subprocess.DEVNULL, 
                           stderr=subprocess.DEVNULL)
        except Exception:
            pass

# Registrar limpieza automática al salir
atexit.register(kill_ahk)

def restart_ahk_process():
    global ahk_process
    kill_ahk()
    
    ahk_path = "giftuber_hotkeys.ahk"
    if os.path.exists(ahk_path):
        try:
            # Si existe AutoHotkey64.exe localmente (modo portable), lo usamos
            local_ahk = "AutoHotkey64.exe"
            if os.path.exists(local_ahk):
                ahk_process = subprocess.Popen([local_ahk, ahk_path], creationflags=0x08000000)
            else:
                ahk_process = subprocess.Popen([ahk_path], shell=True, creationflags=0x08000000)
            print("[*] Script de AutoHotkey iniciado automáticamente.")
        except Exception as e:
            print(f"[!] Error al iniciar AutoHotkey: {e}")

PORT = 8000
pending_commands = queue.Queue()

# Estado en tiempo real para la página OBS
display_state = {
    'speaking': False,
    'walking': False,
    'ability': None,
    'ability_ts': 0,
    'avatar_src': '',
    'wings_cal_active': False,
    'bounceHeight': 20,
    'bounceSpeed': 150,
    'avatarScale': 1.0,
    'avatarX': 0,
    'avatarY': 0,
    'isGlowEnabled': True,
    'paladin_spec': 'ret',
    'threshold': 15,
    'delay': 200,
    'useVAD': False,
    'activeBg': 'transparent',
    'activeAvatar': 'lolirot',
    'calibration': {
        'legs_scale': 0.83, 'legs_y': 22, 'legs_x': 0,
        'wings_scale': 1.0, 'wings_y': 60, 'wings_x': -12, 'wings_pos_x': 0,
        'abilityCalibration': {
            'ability1': {'scale': 1.0, 'x': 40, 'y': 220, 'rot': 0},
            'ability2': {'scale': 1.0, 'x': -30, 'y': 100, 'rot': 0},
            'ability3': {'scale': 1.0, 'x': 0, 'y': -20, 'rot': 0},
            'ability4': {'scale': 1.0, 'x': 0, 'y': 0, 'rot': 0},
            'ability5': {'scale': 1.0, 'x': 0, 'y': 0, 'rot': 0},
            'ability6': {'scale': 1.0, 'x': 0, 'y': 0, 'rot': 0},
            'ability7': {'scale': 1.0, 'x': 0, 'y': 0, 'rot': 0},
            'ability8': {'scale': 1.0, 'x': -70, 'y': 130, 'rot': 0},
            'ability9': {'scale': 1.0, 'x': 0, 'y': 0, 'rot': 0}
        }
    },
    'colorMappings': {
        'ability1': 'color_red',
        'ability2': 'color_green',
        'ability3': 'color_blue',
        'ability4': 'color_yellow',
        'ability5': 'color_cyan',
        'ability6': 'color_orange',
        'ability7': 'color_purple',
        'ability8': 'color_lime',
        'ability9': 'color_pink'
    }
}

CALIBRATION_FILE = 'giftuber_calibration.json'

def load_calibration():
    global display_state
    if os.path.exists(CALIBRATION_FILE):
        try:
            with open(CALIBRATION_FILE, 'r', encoding='utf-8') as f:
                saved = json.load(f)
                if 'calibration' in saved:
                    if 'abilityCalibration' in saved['calibration']:
                        display_state['calibration']['abilityCalibration'].update(saved['calibration']['abilityCalibration'])
                        saved['calibration'].pop('abilityCalibration')
                    display_state['calibration'].update(saved['calibration'])
                for k, v in saved.items():
                    if k != 'calibration' and k in display_state:
                        if isinstance(display_state[k], dict) and isinstance(v, dict):
                            display_state[k].update(v)
                        else:
                            display_state[k] = v
                print("[*] Calibración cargada desde archivo.")
        except Exception as e:
            print(f"[!] Error al cargar calibración: {e}")

def save_calibration():
    try:
        data_to_save = {
            'calibration': display_state['calibration'],
            'bounceHeight': display_state.get('bounceHeight'),
            'bounceSpeed': display_state.get('bounceSpeed'),
            'avatarScale': display_state.get('avatarScale'),
            'avatarX': display_state.get('avatarX'),
            'avatarY': display_state.get('avatarY'),
            'isGlowEnabled': display_state.get('isGlowEnabled'),
            'paladin_spec': display_state.get('paladin_spec'),
            'threshold': display_state.get('threshold'),
            'delay': display_state.get('delay'),
            'useVAD': display_state.get('useVAD'),
            'activeBg': display_state.get('activeBg'),
            'activeAvatar': display_state.get('activeAvatar'),
            'colorMappings': display_state.get('colorMappings')
        }
        with open(CALIBRATION_FILE, 'w', encoding='utf-8') as f:
            json.dump(data_to_save, f, indent=4, ensure_ascii=False)
    except Exception as e:
        print(f"[!] Error al guardar calibración: {e}")

load_calibration()

class GiftuberHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Evitar cache de HTML/JS/CSS/API en el navegador
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        # Endpoint especial: /check_update - Verificar si hay actualizaciones
        if self.path == '/check_update':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            res = {
                'current_version': VERSION,
                'update_available': False,
                'new_version': VERSION,
                'download_url': '',
                'updater_url': ''
            }
            try:
                req = urllib.request.Request(UPDATE_URL, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=4, context=ssl_context) as response:
                    data = json.loads(response.read().decode('utf-8'))
                    online_version = data.get('version')
                    download_url   = data.get('download_url', '')
                    updater_url    = data.get('updater_url', '')
                    if online_version:
                        try:
                            online_parts = [int(x) for x in online_version.split('.')]
                            local_parts  = [int(x) for x in VERSION.split('.')]
                            if online_parts > local_parts:
                                res['update_available'] = True
                                res['new_version']  = online_version
                                res['download_url'] = download_url
                                res['updater_url']  = updater_url
                        except Exception:
                            if online_version != VERSION:
                                res['update_available'] = True
                                res['new_version']  = online_version
                                res['download_url'] = download_url
                                res['updater_url']  = updater_url
            except Exception as e:
                print(f"[!] Error al comprobar actualizaciones: {e}")
                res['error'] = str(e)
                
            self.wfile.write(json.dumps(res).encode('utf-8'))
            return

        # Endpoint especial: /poll - el navegador pregunta si hay comandos
        if self.path == '/poll':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            cmds = []
            while True:
                try:
                    cmds.append(pending_commands.get_nowait())
                except queue.Empty:
                    break
            self.wfile.write(json.dumps({'commands': cmds}).encode())
            return

        # Endpoint: /display_state - OBS page polls this
        if self.path == '/display_state':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(display_state).encode())
            return

        # Servir archivos normales
        super().do_GET()

    def do_POST(self):
        # Endpoint: /action?key=1 o /action?key=w
        if self.path.startswith('/action'):
            parsed = urllib.parse.urlparse(self.path)
            params = urllib.parse.parse_qs(parsed.query)
            key = params.get('key', [None])[0]

            if key:
                if key == 'walk_stop':
                    saved = []
                    while not pending_commands.empty():
                        try:
                            item = pending_commands.get_nowait()
                            if item != 'walk_start':
                                saved.append(item)
                        except Exception:
                            break
                    for item in saved:
                        pending_commands.put(item)
                    pending_commands.put('walk_stop')
                else:
                    pending_commands.put(key)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"ok": true}')
            return

        if self.path == '/trigger_update':
            length = int(self.headers.get('Content-Length', 0))
            try:
                body = json.loads(self.rfile.read(length))
                updater_url = body.get('updater_url', '')
                if not updater_url:
                    raise ValueError("Se requiere 'updater_url'")

                import sys, tempfile
                exe_actual = sys.executable
                if getattr(sys, 'frozen', False):
                    current_dir = os.path.dirname(exe_actual)
                else:
                    current_dir = os.path.dirname(os.path.abspath(__file__))

                # Descargar updater_giftuber.exe al directorio temporal
                updater_temp = os.path.join(tempfile.gettempdir(), 'updater_giftuber.exe')
                print(f"[*] Descargando updater desde: {updater_url}...")
                req = urllib.request.Request(updater_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=60, context=ssl_context) as response, \
                     open(updater_temp, 'wb') as out_file:
                    out_file.write(response.read())
                print(f"[*] Updater descargado en: {updater_temp}")

                # Lanzar el updater completamente desacoplado, pasando el directorio de instalación
                subprocess.Popen(
                    [updater_temp, current_dir],
                    creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP,
                    close_fds=True
                )
                print("[*] Updater lanzado. Cerrando Giftuber...")

                # Responder y cerrar
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write('{"ok": true, "message": "Actualizacion iniciada"}'.encode('utf-8'))

                def kill_app():
                    time.sleep(1)
                    kill_ahk()
                    os._exit(0)

                threading.Thread(target=kill_app).start()
                return
            except Exception as e:
                print(f"[!] Error al iniciar actualizacion: {e}")
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
                return


        if self.path == '/restart_services':
            restart_ahk_process()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"ok": true}')
            return

        if self.path == '/save_video':
            length = int(self.headers.get('Content-Length', 0))
            filename = self.headers.get('X-Filename', f'giftuber_reel_{int(time.time())}.webm')
            
            output_dir = os.path.join(os.getcwd(), 'grabaciones')
            os.makedirs(output_dir, exist_ok=True)
            
            filepath = os.path.join(output_dir, filename)
            
            try:
                data = self.rfile.read(length)
                with open(filepath, 'wb') as f:
                    f.write(data)
                
                # Abrir la carpeta en el Explorador de Windows de manera silenciosa
                try:
                    os.startfile(output_dir)
                except Exception:
                    pass
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': True, 'path': filepath}).encode())
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode())
            return

        # Endpoint: /display_state - main browser pushes avatar state
        if self.path == '/display_state':
            length = int(self.headers.get('Content-Length', 0))
            try:
                body = json.loads(self.rfile.read(length))
                if 'calibration' in body:
                    display_state['calibration'].update(body.pop('calibration'))
                
                # Soportar historial de habilidades concurrentes sin sobreescritura
                if 'ability' in body and 'ability_ts' in body:
                    history = display_state.setdefault('ability_history', [])
                    history.append({'ability': body['ability'], 'ts': body['ability_ts']})
                    if len(history) > 10:
                        display_state['ability_history'] = history[-10:]
                
                display_state.update(body)
                save_calibration()
            except Exception:
                pass
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"ok": true}')
            return

        if self.path == '/download_youtube':
            length = int(self.headers.get('Content-Length', 0))
            try:
                body = json.loads(self.rfile.read(length))
                url = body.get('url')
                if not url:
                    raise ValueError("Se requiere el campo 'url'")
                
                # Limpiar parámetros de playlist en URLs de YouTube para evitar descargas masivas lentas
                if 'youtube.com/watch' in url or 'youtu.be/' in url:
                    parsed_url = urllib.parse.urlparse(url)
                    if 'youtube.com/watch' in url:
                        params = urllib.parse.parse_qs(parsed_url.query)
                        video_id = params.get('v', [None])[0]
                        if video_id:
                            url = f"https://www.youtube.com/watch?v={video_id}"
                    elif 'youtu.be/' in url:
                        # youtu.be/video_id
                        video_id = parsed_url.path.strip('/')
                        if video_id:
                            url = f"https://www.youtube.com/watch?v={video_id}"
                
                import yt_dlp
                
                # Carpeta assets del proyecto
                outdir = os.path.join(os.getcwd(), 'assets')
                os.makedirs(outdir, exist_ok=True)
                
                # Limpiar descargas anteriores
                for f in os.listdir(outdir):
                    if f.startswith('temp_yt_audio.'):
                        try:
                            os.remove(os.path.join(outdir, f))
                        except Exception:
                            pass
                
                # Opciones de descarga: mejor audio directo, desactivando listas de reproducción
                ydl_opts = {
                    'format': 'bestaudio/best',
                    'outtmpl': os.path.join(outdir, 'temp_yt_audio.%(ext)s'),
                    'quiet': True,
                    'no_warnings': True,
                    'noplaylist': True,
                }
                
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=True)
                    ext = info.get('ext', 'webm')
                    relative_path = f'/assets/temp_yt_audio.{ext}'
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'ok': True, 
                    'audioUrl': relative_path, 
                    'title': info.get('title', 'Audio de YouTube')
                }).encode())
            except Exception as e:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'ok': False, 
                    'error': str(e)
                }).encode())
        if self.path == '/export_pack':
            length = int(self.headers.get('Content-Length', 0))
            try:
                pack_data = json.loads(self.rfile.read(length))
                name = pack_data.get('name', 'avatar_pack')
                
                # Sanitize name to make safe filename
                filename = "".join(c for c in name if c.isalnum() or c in (' ', '_', '-')).strip()
                filename = filename.lower().replace(' ', '_') + '.gtuber'
                
                downloads_dir = os.path.join(os.path.expanduser('~'), 'Downloads')
                os.makedirs(downloads_dir, exist_ok=True)
                filepath = os.path.join(downloads_dir, filename)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(pack_data, f, ensure_ascii=False, indent=2)
                
                # Open Downloads folder in Windows Explorer
                try:
                    os.startfile(downloads_dir)
                except Exception:
                    pass
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': True, 'path': filepath}).encode('utf-8'))
            except Exception as e:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': False, 'error': str(e)}).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.end_headers()

    def log_message(self, format, *args):
        try:
            arg_str = str(args[0]) if args else ""
            if '/poll' not in arg_str and '/display_state' not in arg_str:
                super().log_message(format, *args)
        except Exception:
            super().log_message(format, *args)


# ==============================================================================
#  LECTOR DE PÍXELES EN TIEMPO REAL (WEAKAURAS)
# ==============================================================================# ==============================================================================
#  LECTOR DE PÍXELES EN TIEMPO REAL (DOBLE SENSOR EN ESQUINA INFERIOR IZQUIERDA)
# ==============================================================================
import ctypes

user32 = ctypes.windll.user32
gdi32 = ctypes.windll.gdi32

def get_pixel_color(x, y):
    try:
        hdc = user32.GetDC(0)
        pixel = gdi32.GetPixel(hdc, x, y)
        user32.ReleaseDC(0, hdc)
        
        # GetPixel devuelve COLORREF: 0x00BBGGRR
        r = pixel & 0xFF
        g = (pixel >> 8) & 0xFF
        b = (pixel >> 16) & 0xFF
        return r, g, b
    except Exception:
        return 0, 0, 0

def wow_pixel_reader():
    SCREEN_WIDTH = user32.GetSystemMetrics(0)
    SCREEN_HEIGHT = user32.GetSystemMetrics(1)
    # Coordenadas correspondientes al centro de los 6 cuadros de 12x12 en BOTTOMRIGHT (cuadrícula 3x2):
    # Fila inferior: row = 0, Fila superior: row = 1. Columnas separadas por 15px.
    sensors = []
    for i in range(6):
        row = i // 3
        col = i % 3
        px = SCREEN_WIDTH - (col * 15) - 6
        py = SCREEN_HEIGHT - (row * 15) - 6
        sensors.append((px, py))

    print(f"[*] Hilo de Lector de Píxeles iniciado (6 Sensores en Esquina Inferior Derecha - Grid 3x2).")
    for idx, (px, py) in enumerate(sensors):
        print(f"[*] Sensor {idx+1}: X={px}, Y={py}")
    print("[*] Asegúrate de que el juego esté en pantalla completa (o ventana sin bordes) cubriendo estas coordenadas.")
    print("[*] Colores esperados (10 opciones configurables):")
    print("    - Rojo, Verde, Azul, Amarillo, Cian, Magenta, Naranja, Morado, Lima, Rosa")
    
    last_colors = [None] * 6

    def parse_color(r, g, b):
        if r > 200 and g < 60 and b < 60:
            return "color_red"
        elif r < 60 and g > 200 and b < 60:
            return "color_green"
        elif r < 60 and g < 60 and b > 200:
            return "color_blue"
        elif r > 200 and g > 200 and b < 60:
            return "color_yellow"
        elif r < 60 and g > 200 and b > 200:
            return "color_cyan"
        elif r > 200 and g < 60 and b > 200:
            return "color_magenta"
        elif r > 200 and g > 100 and g < 180 and b < 60:
            return "color_orange"
        elif r > 100 and r < 180 and g < 60 and b > 200:
            return "color_purple"
        elif r > 100 and r < 180 and g > 200 and b < 60:
            return "color_lime"
        elif r > 200 and g > 100 and g < 180 and b > 150 and b < 220:
            return "color_pink"
        return None
    
    while True:
        try:
            for idx, (px, py) in enumerate(sensors):
                r, g, b = get_pixel_color(px, py)
                c = parse_color(r, g, b)
                if c is not None:
                    if last_colors[idx] != c:
                        pending_commands.put(c)
                        print(f"[Sensor {idx+1}] Color detectado: {c} (RGB: {r}, {g}, {b})")
                        last_colors[idx] = c
                else:
                    last_colors[idx] = None
                
            # Dormir 30ms (aproximadamente 33 escaneos por segundo)
            time.sleep(0.03)
        except Exception as e:
            time.sleep(1)

# Iniciar hilo de lectura de píxeles
pixel_thread = threading.Thread(target=wow_pixel_reader, daemon=True)
pixel_thread.start()

import sys
if getattr(sys, 'frozen', False):
    os.chdir(os.path.dirname(sys.executable))
else:
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("=" * 55)
print("    Servidor Giftuber con Atajos Globales")
print("=" * 55)

# Iniciar servidor HTTP en segundo plano
def run_http_server():
    try:
        socketserver.ThreadingTCPServer.allow_reuse_address = True
        with socketserver.ThreadingTCPServer(("127.0.0.1", PORT), GiftuberHandler) as httpd:
            print(f"[*] Servidor iniciado en http://127.0.0.1:{PORT}")
            httpd.serve_forever()
    except Exception as e:
        print(f"[!] Error en el servidor HTTP: {e}")

server_thread = threading.Thread(target=run_http_server, daemon=True)
server_thread.start()

# Iniciar AutoHotkey automáticamente
restart_ahk_process()

# Abrir ventana nativa del programa (pywebview)
try:
    import webview
    
    # Crear la ventana dedicada
    window = webview.create_window(
        'Giftuber Panel', 
        f'http://127.0.0.1:{PORT}', 
        width=1000, 
        height=750,
        min_size=(800, 600)
    )
    
    def on_closed():
        print("[*] Ventana cerrada por el usuario. Deteniendo servicios...")
        kill_ahk()
        
    window.events.closed += on_closed
    
    print("[*] Iniciando interfaz de escritorio...")
    webview.start(gui='edgechromium')

except ImportError:
    # Si no está instalado pywebview (ej: desarrollo clásico en consola), abrir navegador normal
    print("[!] pywebview no instalado. Abriendo navegador por defecto...")
    import webbrowser
    webbrowser.open(f'http://127.0.0.1:{PORT}')
    # Mantener el hilo principal vivo
    while True:
        time.sleep(1)
finally:
    # Cerrar AHK al salir
    print("[*] Cerrando aplicación, deteniendo servicios...")
    kill_ahk()
