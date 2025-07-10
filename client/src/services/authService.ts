import { supabase } from '../supabase/config';
import { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  location?: string;
}

// 🔐 SERVICIO DE AUTENTICACIÓN CON SUPABASE

export class AuthService {
  // Obtener usuario actual
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('Supabase user:', user, 'error:', error);

      if (error || !user) {
        return null;
      }

      // Obtener datos adicionales del usuario desde la tabla users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('User data from table:', userData, 'userError:', userError);

      if (userError) {
        console.error('Error fetching user data:', userError);
        return null;
      }

      return {
        id: user.id,
        email: user.email!,
        name: userData.name,
        avatar: userData.avatar,
        bio: userData.bio,
        location: userData.location
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Registrar usuario
  static async register(email: string, password: string, name: string): Promise<AuthUser | null> {
    try {
      // Registrar en Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email,
        password
      });

      if (authError || !user) {
        throw new Error(authError?.message || 'Error en registro');
      }

      // Crear perfil de usuario en la tabla users
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          name: name
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        // Intentar eliminar el usuario de auth si falla la creación del perfil
        await supabase.auth.admin.deleteUser(user.id);
        throw new Error('Error creando perfil de usuario');
      }

      return {
        id: user.id,
        email: user.email!,
        name: name
      };
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  // Iniciar sesión
  static async login(email: string, password: string): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error || !user) {
        throw new Error(error?.message || 'Error en login');
      }

      // Obtener datos adicionales del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return null;
      }

      return {
        id: user.id,
        email: user.email!,
        name: userData.name,
        avatar: userData.avatar,
        bio: userData.bio,
        location: userData.location
      };
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  // Cerrar sesión
  static async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  // Actualizar perfil de usuario
  static async updateProfile(userId: string, updates: Partial<AuthUser>): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Escuchar cambios en la autenticación
  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Obtener datos adicionales del usuario
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const user: AuthUser = {
          id: session.user.id,
          email: session.user.email!,
          name: userData?.name || '',
          avatar: userData?.avatar,
          bio: userData?.bio,
          location: userData?.location
        };

        callback(user);
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    });
  }
} 