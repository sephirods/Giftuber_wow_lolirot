@echo off
echo ====================================================
echo  Compilador de Giftuber a Ejecutable Standalone
echo ====================================================
echo.
echo [*] Instalando dependencias necesarias (pywebview y pyinstaller)...
pip install pywebview pyinstaller
echo.
echo [*] Compilando server.py a ejecutable con icono personalizado...
pyinstaller --onefile --noconsole --clean --icon=giftuber.ico --name=Giftuber server.py
echo.
if exist "dist\Giftuber.exe" (
    echo [*] Moviendo Giftuber.exe a la raiz del proyecto...
    move /y dist\Giftuber.exe .
    echo.
    echo [*] Limpiando archivos temporales de compilacion...
    rmdir /s /q build
    rmdir /s /q dist
    del Giftuber.spec
    echo.
    echo [OK] Compilacion completada con exito!
    echo [OK] Ya puedes ejecutar 'Giftuber.exe' directamente.
) else (
    echo [ERROR] Hubo un error al compilar el proyecto.
)
echo.
pause
