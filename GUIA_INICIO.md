# 🏃‍♂️ SportSwap - Guía de Inicio Rápido

## 📋 ¿Qué es SportSwap?

SportSwap es una plataforma de intercambio de productos deportivos inspirada en Pila de Libros. Los usuarios pueden:

- 📸 Subir productos deportivos que quieren intercambiar
- 🔍 Explorar productos de otros usuarios
- 💕 Hacer swipe (like/dislike) como en Tinder
- 🤝 Hacer match cuando ambos están interesados
- 💬 Chatear para coordinar el intercambio

## 🚀 Instalación y Configuración

### Opción 1: Inicio Automático (Recomendado)

1. **Ejecuta el archivo de inicio:**
   ```bash
   start.bat
   ```

2. **Espera a que se instalen las dependencias y se inicien los servidores**

3. **Abre tu navegador en:** `http://localhost:3000`

### Opción 2: Inicio Manual

1. **Instala las dependencias del servidor:**
   ```bash
   npm install
   ```

2. **Instala las dependencias del cliente:**
   ```bash
   cd client
   npm install
   cd ..
   ```

3. **Inicia el servidor backend:**
   ```bash
   npm run server
   ```

4. **En otra terminal, inicia el cliente:**
   ```bash
   cd client
   npm start
   ```

## 📱 Uso de la Aplicación

### 1. Registro/Login
- Ve a `http://localhost:3000`
- Regístrate con tu email y contraseña
- O inicia sesión si ya tienes cuenta

### 2. Subir Productos
- Ve a "Mis Productos" en el menú
- Haz clic en "Agregar Producto"
- Completa la información y sube fotos
- Categorías disponibles: Fútbol, Baloncesto, Tenis, Natación, Gimnasio, Running, etc.

### 3. Descubrir Productos
- En la página principal verás productos de otros usuarios
- Haz swipe hacia la derecha (❤️) si te interesa
- Haz swipe hacia la izquierda (❌) si no te interesa

### 4. Matches y Chat
- Cuando haya un match mutuo, aparecerá en "Matches"
- Puedes chatear para coordinar el intercambio
- Acuerda lugar y hora para la entrega

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** con Express
- **SQLite** para base de datos
- **JWT** para autenticación
- **Multer** para subida de archivos
- **bcryptjs** para encriptación

### Frontend
- **React** con TypeScript
- **Tailwind CSS** para estilos
- **React Router** para navegación
- **Axios** para API calls
- **Heroicons** para iconos

## 📁 Estructura del Proyecto

```
sportswap/
├── server/                 # Backend
│   ├── routes/            # Rutas de la API
│   ├── database/          # Base de datos SQLite
│   ├── uploads/           # Imágenes subidas
│   └── index.js           # Servidor principal
├── client/                # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas
│   │   ├── contexts/      # Contextos (Auth)
│   │   └── App.tsx        # App principal
│   └── package.json
├── package.json           # Dependencias del servidor
└── README.md             # Documentación
```

## 🔧 Configuración

### Variables de Entorno
Copia `env.example` a `.env` y configura:

```env
PORT=5000
JWT_SECRET=tu-clave-secreta
```

### Base de Datos
La base de datos SQLite se crea automáticamente en:
`server/database/sportswap.db`

## 🎯 Próximas Funcionalidades

- [ ] Notificaciones push
- [ ] Geolocalización para encuentros cercanos
- [ ] Sistema de reputación de usuarios
- [ ] Filtros avanzados por categoría/ubicación
- [ ] App móvil nativa
- [ ] Integración con redes sociales

## 🐛 Solución de Problemas

### Error: "Puerto 3000 en uso"
```bash
# Encuentra el proceso
netstat -ano | findstr :3000
# Mata el proceso
taskkill /PID [número_del_proceso] /F
```

### Error: "Puerto 5000 en uso"
```bash
# Encuentra el proceso
netstat -ano | findstr :5000
# Mata el proceso
taskkill /PID [número_del_proceso] /F
```

### Error de dependencias
```bash
# Limpia cache de npm
npm cache clean --force
# Reinstala dependencias
rm -rf node_modules package-lock.json
npm install
```

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Revisa los logs del servidor
3. Verifica que todos los puertos estén libres
4. Asegúrate de tener Node.js 16+ instalado

## 🎉 ¡Disfruta SportSwap!

¡Ya tienes tu propia plataforma de intercambio de productos deportivos funcionando! 

**¡Comparte con amigos y empieza a intercambiar!** 🏃‍♂️💚 