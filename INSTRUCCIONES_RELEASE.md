# Guía para Publicar Actualizaciones (Push Update) en Giftuber

Sigue este orden exacto de pasos para publicar una nueva actualización y que les notifique automáticamente a todos los usuarios.

---

## Paso 1: Compilar el Ejecutable Principal (Si modificaste `server.py`)
Si realizaste cambios en el archivo del servidor Python (`server.py`), debes compilar el nuevo `Giftuber.exe` ejecutable para distribuirlo dentro de la actualización.

Ejecuta en PowerShell/Consola en la carpeta `Proyecto lolirot`:
```powershell
# Compilar ejecutable
pyinstaller --onefile --noconsole --clean --icon=giftuber.ico --name=Giftuber server.py

# Mover a la raíz y limpiar archivos temporales
Move-Item -Path "dist\Giftuber.exe" -Destination "." -Force
Remove-Item -Path "build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "Giftuber.spec" -Force -ErrorAction SilentlyContinue
```

---

## Paso 2: Incrementar la versión en `version.json`
Abre `version.json` y actualiza el número de versión (por ejemplo, de `2.4.13` a `2.4.14`) y los enlaces de descarga para que apunten al tag de la nueva versión:

```json
{
  "version": "2.4.14",
  "download_url": "https://github.com/sephirods/Giftuber_wow_lolirot/releases/download/v2.4.14/project_files.zip",
  "updater_url": "https://github.com/sephirods/Giftuber_wow_lolirot/releases/download/v2.4.14/updater_giftuber.exe"
}
```

---

## Paso 3: Empaquetar y Compilar el Instalador/Updater
El script `empaquetar.py` se encarga de crear el zip del proyecto (con todos los archivos HTML, CSS, JS, imágenes locales y el `Giftuber.exe`) y compilar el instalador y el actualizador para la versión actual del `version.json`.

Ejecuta:
```bash
python empaquetar.py
```
Esto creará automáticamente en la raíz:
- `project_files.zip`
- `updater_giftuber.exe`
- `Instalador_Giftuber_v[VER].exe`
- `Instalador_Giftuber_v[VER].zip`

---

## Paso 4: Subir el código a GitHub
Sube los cambios de código y el archivo de versión al repositorio Git:

```bash
git add .
git commit -m "Mensaje descriptivo de los cambios"
git push
```

---

## Paso 5: Publicar la Release y subir Ejecutables a GitHub
El script `subir_release.py` utiliza la API de GitHub para crear la release y tag correspondientes a la versión que pusiste en `version.json` y sube los 4 archivos ejecutables y zips compilados en el Paso 3.

Ejecuta:
```bash
python subir_release.py
```

Al terminar, la actualización quedará activa y se propagará automáticamente a todos los usuarios cuando inicien su aplicación.
