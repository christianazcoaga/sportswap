import { supabase } from '../supabase/config';

export interface Swipe {
  id: string;
  userId: string;
  productId: string;
  action: 'like' | 'dislike';
  createdAt: Date;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  product1Id: string;
  product2Id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  createdAt: Date;
}

// 💕 SERVICIO DE MATCHES Y SWIPES CON SUPABASE

export class MatchService {
  // Crear swipe
  static async createSwipe(userId: string, productId: string, action: 'like' | 'dislike'): Promise<void> {
    try {
      const { error } = await supabase
        .from('swipes')
        .insert({
          user_id: userId,
          product_id: productId,
          action: action
        });

      if (error) {
        throw error;
      }

      // Si es un like, verificar si hay match
      if (action === 'like') {
        await this.checkForMatch(userId, productId);
      }
    } catch (error) {
      console.error('Error creating swipe:', error);
      throw error;
    }
  }

  // Verificar si hay match
  static async checkForMatch(userId: string, productId: string): Promise<void> {
    try {
      // Obtener el producto que se está swipeando
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('user_id')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        return;
      }

      const productOwnerId = product.user_id;

      // Obtener productos del usuario actual
      const { data: userProducts, error: userProductsError } = await supabase
        .from('products')
        .select('id')
        .eq('user_id', userId);

      if (userProductsError || !userProducts || userProducts.length === 0) {
        return; // No hay productos del usuario
      }

      const userProductIds = userProducts.map(p => p.id);

      // Verificar si el dueño del producto también hizo swipe en un producto del usuario actual
      const { data: existingSwipe, error: swipeError } = await supabase
        .from('swipes')
        .select('product_id')
        .eq('user_id', productOwnerId)
        .eq('action', 'like')
        .in('product_id', userProductIds)
        .single();

      if (swipeError || !existingSwipe) {
        return; // No hay match
      }

      // ¡Hay match! Crear el match
      const { error: matchError } = await supabase
        .from('matches')
        .insert({
          user1_id: userId,
          user2_id: productOwnerId,
          product1_id: productId,
          product2_id: existingSwipe.product_id,
          status: 'pending'
        });

      if (matchError) {
        console.error('Error creating match:', matchError);
      }
    } catch (error) {
      console.error('Error checking for match:', error);
    }
  }

  // Obtener matches del usuario
  static async getUserMatches(userId: string): Promise<Match[]> {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          products!product1_id(title, images, category),
          products!product2_id(title, images, category),
          users!user1_id(name, avatar),
          users!user2_id(name, avatar)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(match => ({
        id: match.id,
        user1Id: match.user1_id,
        user2Id: match.user2_id,
        product1Id: match.product1_id,
        product2Id: match.product2_id,
        status: match.status,
        createdAt: new Date(match.created_at),
        updatedAt: new Date(match.updated_at)
      }));
    } catch (error) {
      console.error('Error getting user matches:', error);
      throw error;
    }
  }

  // Actualizar estado del match
  static async updateMatchStatus(matchId: string, status: 'accepted' | 'rejected' | 'completed'): Promise<void> {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status })
        .eq('id', matchId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating match status:', error);
      throw error;
    }
  }

  // Obtener mensajes de un match
  static async getMatchMessages(matchId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          users!sender_id(name, avatar)
        `)
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return data.map(message => ({
        id: message.id,
        matchId: message.match_id,
        senderId: message.sender_id,
        content: message.content,
        createdAt: new Date(message.created_at)
      }));
    } catch (error) {
      console.error('Error getting match messages:', error);
      throw error;
    }
  }

  // Enviar mensaje
  static async sendMessage(matchId: string, senderId: string, content: string): Promise<Message> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: senderId,
          content: content
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        id: data.id,
        matchId: data.match_id,
        senderId: data.sender_id,
        content: data.content,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Verificar si ya se hizo swipe en un producto
  static async hasSwiped(userId: string, productId: string): Promise<'like' | 'dislike' | null> {
    try {
      const { data, error } = await supabase
        .from('swipes')
        .select('action')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();

      if (error || !data) {
        return null;
      }

      return data.action;
    } catch (error) {
      return null;
    }
  }

  // Obtener estadísticas de swipes
  static async getSwipeStats(userId: string): Promise<{ likes: number; dislikes: number }> {
    try {
      const { data, error } = await supabase
        .from('swipes')
        .select('action')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      const likes = data.filter(swipe => swipe.action === 'like').length;
      const dislikes = data.filter(swipe => swipe.action === 'dislike').length;

      return { likes, dislikes };
    } catch (error) {
      console.error('Error getting swipe stats:', error);
      return { likes: 0, dislikes: 0 };
    }
  }
} 