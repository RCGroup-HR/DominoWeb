@echo off
echo ========================================
echo   SUBIR CAMBIOS - ScoreDomino
echo ========================================
echo.

echo [1/3] Git push...
git add .
git reset node_modules
git commit -m "ScoreDomino - Mejoras Carnets"
git push

echo.
echo [2/3] Actualizar servidor...
ssh root@38.242.218.24 "cd /var/www/DominoWeb && git pull && pm2 restart scoredominio --update-env"

echo.
echo [3/3] LISTO!
echo.
echo IMPORTANTE: La primera vez debes ejecutar el SQL manualmente:
echo ssh root@38.242.218.24
echo cd /var/www/DominoWeb
echo mysql -u usuario -p base_datos ^< database/schema-carnets-configuracion.sql
echo.
pause
