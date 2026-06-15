import os
import json
import zipfile
import shutil
import subprocess

def get_version():
    try:
        with open("version.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("version", "2.4.8")
    except Exception:
        return "2.4.8"

def package_project():
    print("[*] Iniciando empaquetado de archivos del proyecto...")
    zip_name = "project_files.zip"
    
    # Lista de archivos individuales a incluir
    files_to_include = [
        "Giftuber.exe",
        "AutoHotkey64.exe",
        "app.js",
        "elf_actions.js",
        "index.html",
        "obs.html",
        "reel.html",
        "contador.html",
        "style.css",
        "giftuber.ico",
        "giftuber_hotkeys.ahk",
        "uninstall.exe",
        "giftuber_calibration.json"
    ]
    
    # Directorios a incluir recursivamente
    dirs_to_include = [
        "assets",
        "wow_addon"
    ]
    
    # Crear archivo ZIP
    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Añadir archivos individuales
        for f in files_to_include:
            if os.path.exists(f):
                print(f"  [+] Añadiendo archivo: {f}")
                zipf.write(f)
            else:
                print(f"  [!] Advertencia: archivo no encontrado: {f}")
                
        # Añadir directorios
        for d in dirs_to_include:
            if os.path.exists(d):
                print(f"  [+] Añadiendo directorio: {d}")
                for root, dirs, files in os.walk(d):
                    for file in files:
                        # Omitir archivos de audio temporales de youtube grandes
                        if file == "temp_yt_audio.webm" or file.startswith("temp_yt_audio."):
                            continue
                        file_path = os.path.join(root, file)
                        rel_path = os.path.relpath(file_path, os.getcwd())
                        zipf.write(file_path, rel_path)
            else:
                print(f"  [!] Advertencia: directorio no encontrado: {d}")
                
    print(f"[OK] {zip_name} creado con éxito.")

def compile_installer():
    version = get_version()
    print(f"[*] Compilando el instalador para la versión {version} con PyInstaller...")
    
    inst_name = f"Instalador_Giftuber_v{version}"
    
    # Comando de PyInstaller para compilar el instalador con datos adjuntos
    cmd = [
        "pyinstaller",
        "--onefile",
        "--noconsole",
        "--clean",
        "--icon=giftuber.ico",
        "--add-data", "project_files.zip;.",
        "--add-data", "giftuber.ico;.",
        f"--name={inst_name}",
        "installer.py"
    ]
    
    print(f"[*] Ejecutando: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print("[OK] Instalador compilado con éxito.")
        
        # Mover a la raíz
        src_exe = os.path.join("dist", f"{inst_name}.exe")
        dest_exe = f"{inst_name}.exe"
        if os.path.exists(src_exe):
            shutil.move(src_exe, dest_exe)
            print(f"[OK] Instalador movido a {dest_exe}")
            
            # Crear zip del instalador
            zip_inst = f"{inst_name}.zip"
            print(f"[*] Creando zip del instalador: {zip_inst}...")
            with zipfile.ZipFile(zip_inst, 'w', zipfile.ZIP_DEFLATED) as zipf:
                zipf.write(dest_exe)
            print(f"[OK] {zip_inst} creado con éxito.")
            
        # Limpieza
        print("[*] Limpiando archivos temporales de compilación...")
        for temp_dir in ["build", "dist"]:
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
        spec_file = f"{inst_name}.spec"
        if os.path.exists(spec_file):
            os.remove(spec_file)
        print("[OK] Limpieza completada.")
    else:
        print("[ERROR] Error al compilar el instalador:")
        print(result.stderr)

if __name__ == "__main__":
    package_project()
    compile_installer()
