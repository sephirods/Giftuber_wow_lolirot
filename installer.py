import os
import sys
import zipfile
import shutil
import subprocess
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

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
    return filename

def detect_wow_path():
    drives = ['d:', 'e:', 'c:']
    for d in drives:
        for base in [r"Program Files (x86)", r"Program Files", ""]:
            path = os.path.join(d + '\\', base, "World of Warcraft")
            if os.path.exists(path):
                return path
    return ""

class GiftuberInstallerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Instalador de Giftuber - Lolirot Edition")
        self.root.geometry("550x450")
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
            text="¡Bienvenida a Giftuber!", 
            font=("Arial", 18, "bold"), 
            bg=BG_COLOR, 
            fg=ACCENT_PINK
        )
        title_label.pack(anchor="w", pady=(0, 5))
        
        subtitle_label = tk.Label(
            main_frame, 
            text="Asistente de instalación para el avatar Lolirot (Traje Rojo)", 
            font=("Arial", 10), 
            bg=BG_COLOR, 
            fg=TEXT_MUTED
        )
        subtitle_label.pack(anchor="w", pady=(0, 20))
        
        # Form Container
        form_frame = tk.LabelFrame(
            main_frame, 
            text=" Configuración de la Instalación ", 
            font=("Arial", 10, "bold"), 
            bg=CARD_BG, 
            fg=TEXT_COLOR, 
            bd=1, 
            relief=tk.SOLID, 
            padx=15, 
            pady=15
        )
        form_frame.pack(fill=tk.X, pady=(0, 15))
        
        # Target Path Row
        tk.Label(form_frame, text="Ruta de Instalación:", font=("Arial", 9, "bold"), bg=CARD_BG, fg=TEXT_COLOR).grid(row=0, column=0, sticky="w", pady=5)
        self.target_path_var = tk.StringVar(value=r"C:\Giftuber")
        self.target_entry = tk.Entry(form_frame, textvariable=self.target_path_var, width=38, font=("Arial", 9), bg=BG_COLOR, fg=TEXT_COLOR, insertbackground=TEXT_COLOR, bd=1, relief=tk.SOLID)
        self.target_entry.grid(row=0, column=1, padx=(5, 5), pady=5)
        
        target_btn = tk.Button(form_frame, text="Buscar...", font=("Arial", 8), bg=BG_COLOR, fg=TEXT_COLOR, activebackground=BORDER_COLOR, activeforeground=TEXT_COLOR, bd=1, relief=tk.SOLID, command=self.browse_target)
        target_btn.grid(row=0, column=2, pady=5)
        
        # WoW Path Row
        tk.Label(form_frame, text="Carpeta de WoW:", font=("Arial", 9, "bold"), bg=CARD_BG, fg=TEXT_COLOR).grid(row=1, column=0, sticky="w", pady=5)
        self.wow_path_var = tk.StringVar(value=detect_wow_path())
        self.wow_entry = tk.Entry(form_frame, textvariable=self.wow_path_var, width=38, font=("Arial", 9), bg=BG_COLOR, fg=TEXT_COLOR, insertbackground=TEXT_COLOR, bd=1, relief=tk.SOLID)
        self.wow_entry.grid(row=1, column=1, padx=(5, 5), pady=5)
        
        wow_btn = tk.Button(form_frame, text="Buscar...", font=("Arial", 8), bg=BG_COLOR, fg=TEXT_COLOR, activebackground=BORDER_COLOR, activeforeground=TEXT_COLOR, bd=1, relief=tk.SOLID, command=self.browse_wow)
        wow_btn.grid(row=1, column=2, pady=5)
        
        # Checkboxes
        self.install_addon_var = tk.BooleanVar(value=True)
        self.addon_check = tk.Checkbutton(
            form_frame, 
            text="Instalar Addon de WoW (GiftuberHelper)", 
            variable=self.install_addon_var,
            font=("Arial", 9),
            bg=CARD_BG,
            fg=TEXT_COLOR,
            selectcolor=BG_COLOR,
            activebackground=CARD_BG,
            activeforeground=TEXT_COLOR
        )
        self.addon_check.grid(row=2, column=0, columnspan=3, sticky="w", pady=(10, 5))
        
        self.create_shortcut_var = tk.BooleanVar(value=True)
        self.shortcut_check = tk.Checkbutton(
            form_frame, 
            text="Crear acceso directo en el Escritorio", 
            variable=self.create_shortcut_var,
            font=("Arial", 9),
            bg=CARD_BG,
            fg=TEXT_COLOR,
            selectcolor=BG_COLOR,
            activebackground=CARD_BG,
            activeforeground=TEXT_COLOR
        )
        self.shortcut_check.grid(row=3, column=0, columnspan=3, sticky="w", pady=5)
        
        # Status Log Area
        self.status_var = tk.StringVar(value="Listo para instalar")
        self.status_label = tk.Label(
            main_frame, 
            textvariable=self.status_var, 
            font=("Arial", 9, "italic"), 
            bg=BG_COLOR, 
            fg=TEXT_MUTED
        )
        self.status_label.pack(anchor="w", pady=(0, 10))
        
        # Progress Bar
        self.progress = ttk.Progressbar(main_frame, orient=tk.HORIZONTAL, length=510, mode='determinate')
        self.progress.pack(pady=(0, 20))
        
        # Install Button
        self.install_btn = tk.Button(
            main_frame, 
            text="Comenzar Instalación", 
            font=("Arial", 11, "bold"), 
            bg=ACCENT_GREEN, 
            fg="#1a1a24",
            activebackground="#3de06b",
            activeforeground="#1a1a24",
            bd=0,
            padx=20,
            pady=8,
            cursor="hand2",
            command=self.start_installation
        )
        self.install_btn.pack(pady=(0, 10))
        
    def browse_target(self):
        folder = filedialog.askdirectory(title="Seleccionar carpeta de instalación")
        if folder:
            self.target_path_var.set(os.path.normpath(folder))
            
    def browse_wow(self):
        folder = filedialog.askdirectory(title="Seleccionar carpeta de World of Warcraft")
        if folder:
            self.wow_path_var.set(os.path.normpath(folder))
            
    def start_installation(self):
        target_dir = self.target_path_var.get().strip()
        wow_dir = self.wow_path_var.get().strip()
        install_addon = self.install_addon_var.get()
        create_shortcut = self.create_shortcut_var.get()
        
        if not target_dir:
            messagebox.showerror("Error", "Debes especificar una ruta de instalación.")
            return
            
        if install_addon and not wow_dir:
            # Ask the user if they want to proceed without WoW Addon
            if not messagebox.askyesno("Wow Addon", "¿Quieres continuar la instalación sin instalar el addon de WoW?"):
                return
            install_addon = False
            
        self.install_btn.config(state=tk.DISABLED)
        self.progress['value'] = 0
        self.root.update()
        
        try:
            # Step 1: Create target directory
            self.status_var.set("Creando carpeta de destino...")
            self.progress['value'] = 15
            self.root.update()
            os.makedirs(target_dir, exist_ok=True)
            
            # Step 2: Extract project files
            self.status_var.set("Extrayendo archivos del programa...")
            self.progress['value'] = 40
            self.root.update()
            
            zip_path = get_bundle_path("project_files.zip")
            if not os.path.exists(zip_path):
                # Fallback to local files if testing script directly
                zip_path = "project_files.zip"
                
            if os.path.exists(zip_path):
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    zip_ref.extractall(target_dir)
            else:
                raise Exception("No se encontró el paquete de archivos 'project_files.zip'.")
                
            # Step 3: Install WoW Addon
            if install_addon and os.path.exists(wow_dir):
                self.status_var.set("Instalando Addon de WoW (GiftuberHelper)...")
                self.progress['value'] = 70
                self.root.update()
                
                addon_src = os.path.join(target_dir, "wow_addon", "GiftuberHelper")
                if os.path.exists(addon_src):
                    # Check for client subdirectories (retail, classic, etc.)
                    subfolders = ["_retail_", "_classic_", "_classic_era_", "_ptr_"]
                    addon_installed = False
                    for sub in subfolders:
                        sub_addons_dir = os.path.join(wow_dir, sub, "Interface", "AddOns")
                        if os.path.exists(sub_addons_dir):
                            dest_addon = os.path.join(sub_addons_dir, "GiftuberHelper")
                            # Remove existing addon folder if exists
                            if os.path.exists(dest_addon):
                                shutil.rmtree(dest_addon)
                            # Copy addon
                            shutil.copytree(addon_src, dest_addon)
                            addon_installed = True
                            print(f"Addon installed in: {dest_addon}")
                    
                    if not addon_installed:
                        # Fallback: try direct Interface/AddOns under wow_dir in case it's a private server or custom structure
                        direct_addons_dir = os.path.join(wow_dir, "Interface", "AddOns")
                        if os.path.exists(direct_addons_dir):
                            dest_addon = os.path.join(direct_addons_dir, "GiftuberHelper")
                            if os.path.exists(dest_addon):
                                shutil.rmtree(dest_addon)
                            shutil.copytree(addon_src, dest_addon)
                            addon_installed = True
                            
                    if not addon_installed:
                        messagebox.showwarning("WoW Addon Warning", "No se detectaron subcarpetas de juego (como _retail_ o _classic_) en la ruta de WoW. El addon no fue instalado. Por favor instálalo manualmente desde la carpeta 'wow_addon' de Giftuber.")
                else:
                    messagebox.showwarning("Addon Warning", "No se encontró el origen del addon dentro de los archivos extraídos.")
            
            # Step 4: Create Desktop Shortcut
            if create_shortcut:
                self.status_var.set("Creando acceso directo en el Escritorio...")
                self.progress['value'] = 85
                self.root.update()
                
                exe_target = os.path.join(target_dir, "Giftuber.exe")
                shortcut_path = os.path.join(os.environ["USERPROFILE"], "Desktop", "Giftuber.lnk")
                
                # PowerShell command to create shortcut cleanly
                ps_cmd = f"$wsh = New-Object -ComObject WScript.Shell; $s = $wsh.CreateShortcut('{shortcut_path}'); $s.TargetPath = '{exe_target}'; $s.WorkingDirectory = '{target_dir}'; $s.IconLocation = '{os.path.join(target_dir, 'giftuber.ico')}'; $s.Save()"
                subprocess.run(["powershell", "-Command", ps_cmd], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            # Finish
            self.progress['value'] = 100
            self.status_var.set("¡Instalación completada con éxito!")
            self.root.update()
            
            messagebox.showinfo("¡Instalación Exitosa!", f"Giftuber ha sido instalado correctamente en {target_dir}.\n\n¡Que lo disfrutes!")
            self.root.destroy()
            
        except Exception as e:
            self.status_var.set("Error durante la instalación")
            messagebox.showerror("Error de Instalación", f"Ocurrió un error: {e}")
            self.install_btn.config(state=tk.NORMAL)

if __name__ == "__main__":
    root = tk.Tk()
    app = GiftuberInstallerApp(root)
    root.mainloop()
