"""
updater_giftuber.exe
Updater autónomo de Giftuber.
- Recibe install_dir como argv[1] (pasado por el Giftuber en ejecución)
- Cierra cualquier instancia de Giftuber
- Extrae el project_files.zip bundleado al install_dir
- Preserva giftuber_calibration.json
- Relanza Giftuber.exe al terminar
"""
import sys
import os
import zipfile
import subprocess
import time
import shutil
import threading
import tkinter as tk
from tkinter import ttk


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def kill_giftuber():
    """Termina cualquier proceso Giftuber.exe que esté corriendo."""
    try:
        subprocess.run(
            ['taskkill', '/f', '/im', 'Giftuber.exe'],
            capture_output=True, timeout=6
        )
    except Exception:
        pass
    time.sleep(2)


def get_zip_path():
    """Ruta al project_files.zip (dentro del bundle de PyInstaller o en disco)."""
    if getattr(sys, 'frozen', False):
        return os.path.join(sys._MEIPASS, 'project_files.zip')
    return 'project_files.zip'


def get_install_dir():
    """Directorio de instalación: argv[1] si existe, si no el dir del exe."""
    if len(sys.argv) > 1:
        d = sys.argv[1].strip('"').strip("'")
        if os.path.isdir(d):
            return d
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    return os.getcwd()


# ──────────────────────────────────────────────
# UI
# ──────────────────────────────────────────────

BG       = '#0d1117'
BG2      = '#161b22'
BORDER   = '#30363d'
ACCENT   = '#a78bfa'
ACCENT2  = '#7c3aed'
TEXT     = '#e6edf3'
SUBTEXT  = '#8b949e'
DIMTEXT  = '#484f58'
GREEN    = '#3fb950'
RED      = '#f85149'


class UpdaterUI:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title('Giftuber Updater')
        self.root.geometry('440x260')
        self.root.resizable(False, False)
        self.root.configure(bg=BG)
        self._center()

        # Estilo de la barra de progreso
        style = ttk.Style()
        style.theme_use('default')
        style.configure(
            'G.Horizontal.TProgressbar',
            troughcolor=BG2,
            background=ACCENT,
            bordercolor=BG2,
            lightcolor=ACCENT,
            darkcolor=ACCENT2,
            thickness=8
        )

        self._build_ui()

    def _center(self):
        self.root.update_idletasks()
        w, h = 440, 260
        x = (self.root.winfo_screenwidth() - w) // 2
        y = (self.root.winfo_screenheight() - h) // 2
        self.root.geometry(f'{w}x{h}+{x}+{y}')

    def _build_ui(self):
        outer = tk.Frame(self.root, bg=BG, padx=28, pady=20)
        outer.pack(fill='both', expand=True)

        # ─ Header ─
        header = tk.Frame(outer, bg=BG)
        header.pack(fill='x')

        tk.Label(header, text='🎙️', font=('Segoe UI Emoji', 30),
                 bg=BG, fg=ACCENT).pack(side='left', padx=(0, 12))

        titles = tk.Frame(header, bg=BG)
        titles.pack(side='left', anchor='w')
        tk.Label(titles, text='Giftuber', font=('Segoe UI', 20, 'bold'),
                 bg=BG, fg=TEXT).pack(anchor='w')
        tk.Label(titles, text='Actualizando a la última versión',
                 font=('Segoe UI', 10), bg=BG, fg=SUBTEXT).pack(anchor='w')

        # ─ Separador ─
        tk.Frame(outer, bg=BORDER, height=1).pack(fill='x', pady=16)

        # ─ Status ─
        self.status_var = tk.StringVar(value='Iniciando...')
        tk.Label(outer, textvariable=self.status_var,
                 font=('Segoe UI', 10), bg=BG, fg=TEXT,
                 anchor='w').pack(fill='x', pady=(0, 8))

        # ─ Barra de progreso ─
        self.progress_var = tk.DoubleVar(value=0)
        self.pbar = ttk.Progressbar(
            outer, variable=self.progress_var,
            style='G.Horizontal.TProgressbar',
            maximum=100, mode='determinate'
        )
        self.pbar.pack(fill='x', pady=(0, 14))

        # ─ Porcentaje ─
        self.pct_var = tk.StringVar(value='0%')
        tk.Label(outer, textvariable=self.pct_var,
                 font=('Segoe UI', 9), bg=BG, fg=SUBTEXT,
                 anchor='e').pack(fill='x')

        # ─ Pie ─
        tk.Label(outer, text='No cierres esta ventana',
                 font=('Segoe UI', 8), bg=BG, fg=DIMTEXT,
                 anchor='w').pack(fill='x', pady=(12, 0))

    def set_progress(self, pct, status=None):
        self.progress_var.set(pct)
        self.pct_var.set(f'{int(pct)}%')
        if status:
            self.status_var.set(status)
        self.root.update_idletasks()

    def start_update(self, install_dir, zip_path):
        thread = threading.Thread(
            target=self._do_update,
            args=(install_dir, zip_path),
            daemon=True
        )
        thread.start()

    def _do_update(self, install_dir, zip_path):
        try:
            # 1. Cerrar Giftuber
            self.root.after(0, lambda: self.set_progress(5, 'Cerrando Giftuber anterior...'))
            time.sleep(1)
            kill_giftuber()
            self.root.after(0, lambda: self.set_progress(20, 'Giftuber cerrado.'))

            # 2. Backup calibración
            self.root.after(0, lambda: self.set_progress(28, 'Guardando configuración...'))
            cal = os.path.join(install_dir, 'giftuber_calibration.json')
            cal_bak = cal + '.bak'
            if os.path.exists(cal):
                shutil.copy2(cal, cal_bak)

            # 3. Extraer archivos
            self.root.after(0, lambda: self.set_progress(35, 'Instalando archivos nuevos...'))
            with zipfile.ZipFile(zip_path, 'r') as zf:
                members = zf.namelist()
                total = max(len(members), 1)
                for i, member in enumerate(members):
                    try:
                        zf.extract(member, install_dir)
                    except Exception:
                        pass
                    pct = 35 + int((i + 1) / total * 50)
                    self.root.after(0, lambda p=pct: self.set_progress(p))

            # 4. Restaurar calibración
            self.root.after(0, lambda: self.set_progress(88, 'Restaurando configuración...'))
            if os.path.exists(cal_bak):
                shutil.move(cal_bak, cal)

            # 5. Listo
            self.root.after(0, lambda: self.set_progress(100, '✅  ¡Actualización completada!'))
            time.sleep(1.8)

            # 6. Relanzar Giftuber
            exe = os.path.join(install_dir, 'Giftuber.exe')
            if os.path.exists(exe):
                subprocess.Popen(
                    [exe],
                    cwd=install_dir,
                    creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP
                )

            self.root.after(600, self.root.destroy)

        except Exception as e:
            self.root.after(0, lambda: self.set_progress(self.progress_var.get(), f'❌  Error: {e}'))

    def run(self):
        self.root.mainloop()


# ──────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────

if __name__ == '__main__':
    install_dir = get_install_dir()
    zip_path    = get_zip_path()

    app = UpdaterUI()
    # Pequeño delay para que la ventana aparezca antes de empezar
    app.root.after(800, lambda: app.start_update(install_dir, zip_path))
    app.run()
