@echo off
echo 🏃‍♂️ Iniciando SportSwap...
echo.

echo 📦 Instalando dependencias del servidor...
call npm install

echo 📦 Instalando dependencias del cliente...
cd client
call npm install
cd ..

echo.
echo 🚀 Iniciando servidor y cliente...
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:5000
echo.

start cmd /k "npm run server"
timeout /t 3 /nobreak >nul
start cmd /k "cd client && npm start"

echo ✅ SportSwap iniciado correctamente!
echo.
echo 💡 Para detener los servidores, cierra las ventanas de comandos
pause 