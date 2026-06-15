import json
import urllib.request
import urllib.parse
import os
import subprocess
import ssl

# SSL context that ignores cert verification just in case
ssl_context = ssl._create_unverified_context()

def get_git_token_and_repo():
    try:
        url = subprocess.check_output(["git", "config", "remote.origin.url"], text=True).strip()
        # Extract token
        token = url.split('@')[0].split('//')[1]
        # Extract repo path: e.g. /sephirods/Giftuber_wow_lolirot.git -> sephirods/Giftuber_wow_lolirot
        repo_part = url.split('@')[1].split("github.com/")[1]
        if repo_part.endswith(".git"):
            repo_part = repo_part[:-4]
        return token, repo_part
    except Exception as e:
        print(f"Error getting git token/repo: {e}")
        return None, None

def create_release(token, repo, version):
    url = f"https://api.github.com/repos/{repo}/releases"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Mozilla/5.0",
        "Content-Type": "application/json"
    }
    data = {
        "tag_name": f"v{version}",
        "target_commitish": "main",
        "name": f"v{version}",
        "body": f"Release v{version} - Corrección de recortes de piernas en OBS/Reel y error de DLL de actualización.",
        "draft": False,
        "prerelease": False
    }
    
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, context=ssl_context) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            print(f"[OK] Release creada con éxito. ID: {res['id']}")
            return res["upload_url"].split("{")[0]
    except Exception as e:
        print(f"[ERROR] Error al crear la release: {e}")
        if hasattr(e, 'read'):
            print(e.read().decode('utf-8'))
        return None

def upload_asset(token, upload_url, filepath, content_type):
    filename = os.path.basename(filepath)
    url = f"{upload_url}?name={urllib.parse.quote(filename)}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Mozilla/5.0",
        "Content-Type": content_type
    }
    
    print(f"[*] Subiendo {filename}...")
    try:
        with open(filepath, "rb") as f:
            file_data = f.read()
        
        req = urllib.request.Request(url, data=file_data, headers=headers, method="POST")
        with urllib.request.urlopen(req, context=ssl_context) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            print(f"[OK] {filename} subido con éxito.")
            return True
    except Exception as e:
        print(f"[ERROR] Error al subir {filename}: {e}")
        if hasattr(e, 'read'):
            print(e.read().decode('utf-8'))
        return False

def main():
    token, repo = get_git_token_and_repo()
    if not token or not repo:
        print("No se pudo obtener el token o el repositorio.")
        return
        
    version = "2.4.8"
    upload_url = create_release(token, repo, version)
    if not upload_url:
        return
        
    # List of files to upload
    files_to_upload = [
        ("project_files.zip", "application/zip"),
        (f"Instalador_Giftuber_v{version}.exe", "application/octet-stream"),
        (f"Instalador_Giftuber_v{version}.zip", "application/zip")
    ]
    
    for filepath, content_type in files_to_upload:
        if os.path.exists(filepath):
            upload_asset(token, upload_url, filepath, content_type)
        else:
            print(f"[!] Archivo no encontrado para subir: {filepath}")

if __name__ == "__main__":
    main()
