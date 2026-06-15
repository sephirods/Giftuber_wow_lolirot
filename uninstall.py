import os
import sys
import shutil
import subprocess
import tempfile
import tkinter as tk
from tkinter import messagebox, ttk

# Color palette (Dark theme Dracula-inspired)
BG_COLOR = "#1e1e24"
CARD_BG = "#2a2a35"
TEXT_COLOR = "#f8f8f2"
ACCENT_GREEN = "#50fa7b"
ACCENT_PINK = "#ff79c6"
BORDER_COLOR = "#44475a"
TEXT_MUTED = "#8be9fd"

def get_bundle_path(filename):
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, filename)
    if os.path.exists(filename):
        return filename
    exe_dir = os.path.dirname(os.path.abspath(sys.executable if sys.executable else __file__))
    fallback = os.path.join(exe_dir, filename)
    if os.path.exists(fallback):
        return fallback
    return filename

def detect_wow_path():
    drives = ['d:', 'e:', 'c:']
    for d in drives:
        for base in [r"Program Files (x86)", r"Program Files", ""]:
            path = os.path.join(d + '\\', base, "World of Warcraft")
            if os.path.exists(path):
                return path
    return ""

class GiftuberUninstallerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Desinstalador de Giftuber")
        self.root.geometry("520x390")
        self.root.configure(bg=BG_COLOR)
        self.root.resizable(False, False)
        
        # Set window icon if available
        ico_path = get_bundle_path("giftuber.ico")
        if os.path.exists(ico_path):
            try:
                self.root.iconbitmap(ico_path)
            except:
                pass
                
        # Main container
        main_frame = tk.Frame(root, bg=BG_COLOR, padx=20, pady=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title Header
        title_label = tk.Label(
            main_frame, 
            text="Desinstalar Giftuber", 
            font=("Arial", 16, "bold"), 
            bg=BG_COLOR, 
            fg=ACCENT_PINK
        )
        title_label.pack(anchor="w", pady=(0, 5))
        
        subtitle_label = tk.Label(
            main_frame, 
            text="Asistente para eliminar Giftuber y todos sus componentes de este equipo.", 
            font=("Arial", 9), 
            bg=BG_COLOR, 
            fg=TEXT_MUTED
        )
        subtitle_label.pack(anchor="w", pady=(0, 15))
        
        # Form Container (Card)
        info_frame = tk.LabelFrame(
            main_frame, 
            text=" Componentes que serán eliminados ", 
            font=("Arial", 9, "bold"), 
            bg=CARD_BG, 
            fg=TEXT_COLOR, 
            bd=1, 
            relief=tk.SOLID, 
            padx=15, 
            pady=12
        )
        info_frame.pack(fill=tk.X, pady=(0, 15))
        
        items = [
            "• Archivos del programa y ejecutables en la carpeta de instalación.",
            "• Acceso directo en el Escritorio (Giftuber.lnk).",
            "• Datos persistentes de la app y caché de WebView2 (AppData/Giftuber).",
            "• Addon de WoW (GiftuberHelper) en la carpeta de Addons del juego."
        ]
        
        for item in items:
            tk.Label(
                info_frame, 
                text=item, 
                font=("Arial", 9), 
                bg=CARD_BG, 
                fg=TEXT_COLOR, 
                anchor="w", 
                justify=tk.LEFT
            ).pack(fill=tk.X, pady=2)
            
        # Status Log Area
        self.status_var = tk.StringVar(value="Listo para comenzar. Presiona 'Desinstalar'.")
        self.status_label = tk.Label(
            main_frame, 
            textvariable=self.status_var, 
            font=("Arial", 9, "italic"), 
            bg=BG_COLOR, 
            fg=TEXT_MUTED
        )
        self.status_label.pack(anchor="w", pady=(0, 5))
        
        # Progress Bar
        self.progress = ttk.Progressbar(main_frame, orient=tk.HORIZONTAL, length=480, mode='determinate')
        self.progress.pack(pady=(0, 20))
        
        # Action Buttons Frame
        btn_frame = tk.Frame(main_frame, bg=BG_COLOR)
        btn_frame.pack(fill=tk.X, side=tk.BOTTOM)
        
        self.cancel_btn = tk.Button(
            btn_frame, 
            text="Cancelar", 
            font=("Arial", 9, "bold"), 
            bg=CARD_BG, 
            fg=TEXT_COLOR, 
            activebackground=BORDER_COLOR, 
            activeforeground=TEXT_COLOR, 
            bd=1, 
            relief=tk.SOLID, 
            padx=15, 
            pady=5,
            cursor="hand2",
            command=self.root.destroy
        )
        self.cancel_btn.pack(side=tk.RIGHT, padx=(5, 0))
        
        self.uninstall_btn = tk.Button(
            btn_frame, 
            text="Desinstalar", 
            font=("Arial", 9, "bold"), 
            bg=ACCENT_PINK, 
            fg="#1a1a24",
            activebackground="#ff92d0",
            activeforeground="#1a1a24",
            bd=0,
            padx=15,
            pady=6,
            cursor="hand2",
            command=self.confirm_uninstall
        )
        self.uninstall_btn.pack(side=tk.RIGHT)
        
    def confirm_uninstall(self):
        if messagebox.askyesno("Confirmar desinstalación", "¿Estás seguro de que deseas desinstalar Giftuber y todos sus componentes?"):
            self.uninstall_btn.config(state=tk.DISABLED)
            self.cancel_btn.config(state=tk.DISABLED)
            self.root.update()
            self.run_uninstall()
            
    def run_uninstall(self):
        try:
            # Step 1: Terminate running processes
            self.status_var.set("Deteniendo procesos activos (Giftuber, AutoHotkey)...")
            self.progress['value'] = 20
            self.root.update()
            
            processes_to_kill = ["Giftuber.exe", "AutoHotkey64.exe", "AutoHotkey.exe", "AutoHotkeyUX.exe", "AutoHotkey32.exe"]
            for proc in processes_to_kill:
                try:
                    subprocess.run(["taskkill", "/f", "/im", proc], 
                                   creationflags=0x08000000, 
                                   stdout=subprocess.DEVNULL, 
                                   stderr=subprocess.DEVNULL)
                except:
                    pass
            
            # Step 2: Remove Desktop Shortcut
            self.status_var.set("Eliminando el acceso directo del Escritorio...")
            self.progress['value'] = 40
            self.root.update()
            
            shortcut_path = os.path.join(os.environ["USERPROFILE"], "Desktop", "Giftuber.lnk")
            if os.path.exists(shortcut_path):
                try:
                    os.remove(shortcut_path)
                except Exception as e:
                    print(f"Error removing shortcut: {e}")
                    
            # Step 3: Remove WoW Addon
            self.status_var.set("Eliminando el Addon de WoW (GiftuberHelper)...")
            self.progress['value'] = 60
            self.root.update()
            
            wow_dir = detect_wow_path()
            if wow_dir and os.path.exists(wow_dir):
                subfolders = ["_retail_", "_classic_", "_classic_era_", "_ptr_"]
                for sub in subfolders:
                    addon_dir = os.path.join(wow_dir, sub, "Interface", "AddOns", "GiftuberHelper")
                    if os.path.exists(addon_dir):
                        try:
                            shutil.rmtree(addon_dir)
                        except Exception as e:
                            print(f"Error removing addon: {e}")
                            
                direct_addon_dir = os.path.join(wow_dir, "Interface", "AddOns", "GiftuberHelper")
                if os.path.exists(direct_addon_dir):
                    try:
                        shutil.rmtree(direct_addon_dir)
                    except Exception as e:
                        print(f"Error removing direct addon: {e}")
                        
            # Step 4: Remove AppData User Directory
            self.status_var.set("Eliminando configuraciones y caché local...")
            self.progress['value'] = 80
            self.root.update()
            
            app_data = os.getenv('APPDATA')
            if app_data:
                user_dir = os.path.join(app_data, 'Giftuber')
                if os.path.exists(user_dir):
                    try:
                        shutil.rmtree(user_dir)
                    except Exception as e:
                        print(f"Error removing user appdata directory: {e}")
                        
            # Step 5: Schedule self-deletion via CMD batch in %TEMP%
            self.status_var.set("Programando eliminación de la carpeta de instalación...")
            self.progress['value'] = 95
            self.root.update()
            
            # Directorio de instalación real
            if getattr(sys, 'frozen', False):
                install_dir = os.path.dirname(os.path.abspath(sys.executable))
            else:
                install_dir = os.path.dirname(os.path.abspath(__file__))

            # Batch en %TEMP% — independiente de la carpeta que vamos a borrar
            bat_script = os.path.join(tempfile.gettempdir(), 'giftuber_uninstall.bat')
            bat_content = (
                "@echo off\r\n"
                "timeout /t 5 /nobreak > nul\r\n"
                f'rmdir /s /q "{install_dir}"\r\n'
                "timeout /t 1 /nobreak > nul\r\n"
                f'if exist "{install_dir}" rmdir /s /q "{install_dir}"\r\n'
                'del "%~f0"\r\n'
            )
            with open(bat_script, 'w', encoding='utf-8') as f:
                f.write(bat_content)

            # Lanzar como proceso 100% independiente del padre
            subprocess.Popen(
                ["cmd", "/c", "start", "", "/min", "cmd", "/c", bat_script],
                creationflags=0x08000000,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )

            self.progress['value'] = 100
            self.status_var.set("Desinstalación completada con éxito.")
            self.root.update()
            
            messagebox.showinfo(
                "Desinstalación Exitosa", 
                f"Giftuber ha sido desinstalado correctamente.\n\nLa carpeta '{install_dir}' será eliminada al cerrar este diálogo."
            )
            
            self.root.destroy()
            sys.exit(0)

            
        except Exception as e:
            messagebox.showerror("Error", f"Ocurrió un error al desinstalar: {e}")
            self.uninstall_btn.config(state=tk.NORMAL)
            self.cancel_btn.config(state=tk.NORMAL)

if __name__ == "__main__":
    root = tk.Tk()
    app = GiftuberUninstallerApp(root)
    root.mainloop()
