import { createClient } from '@supabase/supabase-js';

// 🔥 CONFIGURACIÓN DE SUPABASE
// 
// Para usar esta aplicación, necesitas:
// 1. Crear un proyecto en Supabase: https://supabase.com/
// 2. Habilitar Authentication (Email/Password)
// 3. Crear las tablas en la base de datos
// 4. Configurar Storage
// 5. Reemplazar esta configuración con la tuya

const supabaseUrl = 'https://asmrozgbsrhbqnshngud.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzbXJvemdic3JoYnFuc2huZ3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNzM4MTQsImV4cCI6MjA2Nzc0OTgxNH0.9Lt-zqaRfsTXhiJTVWji2bqjylo40Ur1aFYvAZac49I';

// ⚠️ REEMPLAZA CON TU CONFIGURACIÓN DE SUPABASE
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 📋 INSTRUCCIONES PARA CONFIGURAR SUPABASE:
//
// 1. Ve a https://supabase.com/
// 2. Crea una cuenta gratuita
// 3. Crea un nuevo proyecto
// 4. En "Settings" → "API" → copia URL y anon key
// 5. En "Authentication" → "Settings" → habilita "Email auth"
// 6. En "SQL Editor" → ejecuta el script de tablas
// 7. En "Storage" → crea bucket "products"
// 8. Reemplaza la configuración de arriba
//
// 🔒 SCRIPT SQL PARA CREAR TABLAS:
/*
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
*/ 