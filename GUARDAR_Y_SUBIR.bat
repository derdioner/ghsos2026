@echo off
title GUARDAR EN GITHUB Y SUBIR A FIREBASE
echo.
echo ==========================================
echo    GENARO SOS - RESPALDO Y DESPLIEGUE
echo ==========================================
echo.

echo [1/4] Agregando archivos a Git locales...
git add .
if %errorlevel% neq 0 echo Error en git add & pause & exit /b

echo.
echo [2/4] Guardando cambios (Commit)...
set /p commit_msg="--> Escribe que cambios hiciste (ej: nuevo color): "
if "%commit_msg%"=="" set commit_msg="Actualizacion automatica"
git commit -m "%commit_msg%"

echo.
echo [3/4] Intentando subir a GitHub (Push)...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo ATENCION: No se pudo subir a GitHub.
    echo Posiblemente no has vinculado el repositorio remoto aun.
    echo Para vincularlo, crea un repo en GitHub y corre:
    echo git remote add origin https://github.com/TU_USUARIO/genaro-sos.git
    echo.
    echo Continuamos con Firebase...
)

echo.
echo [4/4] Subiendo a la Nube (Firebase)...
call firebase deploy --only hosting

echo.
echo ==========================================
echo    PROCESO COMPLETADO
echo ==========================================
pause
