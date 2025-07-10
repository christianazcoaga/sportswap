# 🏀 SportSwap - Intercambio de Productos Deportivos

Una aplicación web moderna para intercambiar productos deportivos, inspirada en Tinder pero para artículos deportivos.

## ✨ Características

- 🔐 **Autenticación segura** con Supabase
- 📱 **Interfaz moderna** con React y Tailwind CSS
- 🏀 **Sistema de swipe** estilo Tinder para productos
- 💬 **Chat integrado** para coordinar intercambios
- 📸 **Subida de imágenes** con Supabase Storage
- 🎯 **Filtros por categoría** de deportes
- 📊 **Sistema de matches** automático

## 🛠️ Tecnologías

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Autenticación**: Supabase Auth
- **Base de datos**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **Deploy**: Vercel/Netlify

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd SportSwap
```

### 2. Instalar dependencias
```bash
cd client
npm install
```

### 3. Configurar Supabase

#### Paso 1: Crear proyecto en Supabase
1. Ve a [https://supabase.com/](https://supabase.com/)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Espera a que se complete la configuración

#### Paso 2: Configurar Authentication
1. En tu proyecto de Supabase, ve a **Authentication** → **Settings**
2. Habilita **Email auth**
3. Desactiva **Email confirmations** para desarrollo (opcional)

#### Paso 3: Crear las tablas de la base de datos
1. Ve a **SQL Editor** en tu proyecto de Supabase
2. Ejecuta el siguiente script SQL:

```sql
-- Crear tabla de usuarios
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de productos
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  condition TEXT NOT NULL,
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de swipes
CREATE TABLE swipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  action TEXT CHECK (action IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Crear tabla de matches
CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product1_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product2_id UUID REFERENCES products(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de mensajes
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_swipes_user_id ON swipes(user_id);
CREATE INDEX idx_swipes_product_id ON swipes(product_id);
CREATE INDEX idx_matches_user1_id ON matches(user1_id);
CREATE INDEX idx_matches_user2_id ON matches(user2_id);
CREATE INDEX idx_messages_match_id ON messages(match_id);
```

#### Paso 4: Configurar Storage
1. Ve a **Storage** en tu proyecto de Supabase
2. Crea un nuevo bucket llamado `products`
3. Configura las políticas de acceso (opcional para desarrollo)

#### Paso 5: Configurar variables de entorno
1. Ve a **Settings** → **API**
2. Copia la **URL** y **anon key**
3. Crea un archivo `.env` en la carpeta `client/`:

```bash
cd client
cp env.example .env
```

4. Edita el archivo `.env` y reemplaza los valores:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

**⚠️ Importante**: Nunca subas el archivo `.env` al repositorio. Ya está incluido en `.gitignore`.

### 4. Ejecutar la aplicación
```bash
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## 📱 Funcionalidades

### 🔐 Autenticación
- Registro con email y contraseña
- Inicio de sesión
- Perfil de usuario personalizable

### 🏀 Productos
- Subir productos con imágenes
- Categorías deportivas (Fútbol, Baloncesto, Tenis, etc.)
- Estados de condición (Nuevo, Como nuevo, Bueno, etc.)
- Gestión de productos propios

### 💕 Sistema de Swipe
- Interfaz estilo Tinder para productos
- Like/Dislike con botones
- Filtros por categoría
- Contador de productos

### 🎯 Matches
- Matches automáticos cuando ambos usuarios hacen like
- Chat integrado para coordinar intercambios
- Estados de match (Pendiente, Aceptado, Rechazado, Completado)

### 💬 Chat
- Mensajería en tiempo real
- Historial de conversaciones
- Coordinación de intercambios

## 🎨 Personalización

### Categorías de deportes
Edita `client/src/services/productService.ts`:

```typescript
static getCategories(): string[] {
  return [
    'Fútbol',
    'Baloncesto',
    'Tenis',
    'Natación',
    'Ciclismo',
    'Running',
    'Gimnasio',
    'Yoga',
    'Boxeo',
    'Otros'
  ];
}
```

### Estados de condición
```typescript
static getConditions(): { value: string; label: string }[] {
  return [
    { value: 'new', label: 'Nuevo' },
    { value: 'like-new', label: 'Como nuevo' },
    { value: 'good', label: 'Bueno' },
    { value: 'fair', label: 'Aceptable' },
    { value: 'poor', label: 'Regular' }
  ];
}
```

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
3. Deploy automático

### Netlify
1. Conecta tu repositorio a Netlify
2. Configura las variables de entorno
3. Deploy automático

## 🔧 Desarrollo

### Estructura del proyecto
```
client/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── contexts/       # Contextos de React
│   ├── pages/          # Páginas de la aplicación
│   ├── services/       # Servicios de API
│   ├── supabase/       # Configuración de Supabase
│   └── types/          # Tipos de TypeScript
├── public/             # Archivos estáticos
└── package.json
```

### Scripts disponibles
```bash
npm start          # Desarrollo
npm run build      # Producción
npm test           # Tests
npm run eject      # Eject (no recomendado)
```

## 🆓 Plan Gratuito de Supabase

Supabase ofrece un **plan gratuito generoso**:

- **Base de datos**: 500MB
- **Autenticación**: Ilimitado
- **Storage**: 1GB
- **API requests**: 50,000/mes
- **Realtime**: Ilimitado

**Perfecto para proyectos pequeños y medianos.**

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🔒 Seguridad

### Variables de entorno protegidas
- Todos los archivos `.env` están en `.gitignore`
- Las claves de API nunca se suben al repositorio
- Usa `env.example` como plantilla para configurar tu entorno

### Archivos sensibles ignorados
El proyecto incluye un `.gitignore` completo que protege:
- Variables de entorno (`.env*`)
- Configuraciones de Supabase y Firebase
- Logs y archivos temporales
- Archivos de IDE y sistema operativo
- Base de datos locales
- Credenciales y tokens

### Configuración segura
1. Nunca commits archivos `.env` con valores reales
2. Usa variables de entorno en producción
3. Rota las claves de API regularmente
4. Revisa las políticas de seguridad de Supabase

## 🆘 Soporte

Si tienes problemas:

1. Verifica que Supabase esté configurado correctamente
2. Revisa la consola del navegador para errores
3. Verifica las políticas de seguridad de Supabase
4. Asegúrate de que las variables de entorno estén configuradas
5. Abre un issue en GitHub

---

**¡Disfruta intercambiando productos deportivos! 🏀⚽🎾** 