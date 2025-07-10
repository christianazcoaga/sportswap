@echo off
echo 🏃‍♂️ Iniciando SportSwap con Firebase...
echo.

echo 📦 Instalando dependencias del cliente...
cd client
call npm install
cd ..

echo.
echo 🚀 Iniciando aplicación...
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔥 Backend: Firebase (Serverless)
echo.

start cmd /k "cd client && npm start"

echo ✅ SportSwap iniciado correctamente!
echo.
echo 💡 Para detener el servidor, cierra la ventana de comandos
echo 📋 Recuerda configurar Firebase siguiendo FIREBASE_SETUP.md
pause 