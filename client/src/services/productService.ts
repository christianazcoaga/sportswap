import { supabase } from '../supabase/config';

export interface Product {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductData {
  title: string;
  description: string;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  images: File[];
}

// 🏀 SERVICIO DE PRODUCTOS CON SUPABASE

export class ProductService {
  // Subir imagen a Supabase Storage
  static async uploadImage(file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (error) {
        alert('Error subiendo imagen: ' + error.message);
        console.error('Error uploading image:', error);
        // Fallback a imagen placeholder
        return `https://picsum.photos/400/300?random=${Math.random()}`;
      }

      // Obtener URL pública
      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      if (!data || !data.publicUrl) {
        alert('No se pudo obtener la URL pública de la imagen.');
        console.error('No publicUrl:', data);
        return `https://picsum.photos/400/300?random=${Math.random()}`;
      }

      return data.publicUrl;
    } catch (error: any) {
      alert('Error inesperado subiendo imagen: ' + error.message);
      console.error('Error uploading image:', error);
      // Fallback a imagen placeholder
      return `https://picsum.photos/400/300?random=${Math.random()}`;
    }
  }

  // Crear producto
  static async createProduct(userId: string, productData: CreateProductData): Promise<Product> {
    try {
      // Subir imágenes
      const imageUrls = await Promise.all(
        productData.images.map(file => this.uploadImage(file))
      );

      // Crear producto en la base de datos
      const { data, error } = await supabase
        .from('products')
        .insert({
          user_id: userId,
          title: productData.title,
          description: productData.description,
          category: productData.category,
          condition: productData.condition,
          images: imageUrls
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        description: data.description,
        category: data.category,
        condition: data.condition,
        images: data.images,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  // Obtener productos del usuario
  static async getUserProducts(userId: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(product => ({
        id: product.id,
        userId: product.user_id,
        title: product.title,
        description: product.description,
        category: product.category,
        condition: product.condition,
        images: product.images,
        createdAt: new Date(product.created_at),
        updatedAt: new Date(product.updated_at)
      }));
    } catch (error) {
      console.error('Error getting user products:', error);
      throw error;
    }
  }

  // Obtener productos para descubrir (excluyendo los del usuario actual)
  static async getDiscoveryProducts(userId: string, category?: string): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          users!inner(name, avatar)
        `)
        .neq('user_id', userId);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(product => ({
        id: product.id,
        userId: product.user_id,
        title: product.title,
        description: product.description,
        category: product.category,
        condition: product.condition,
        images: product.images,
        createdAt: new Date(product.created_at),
        updatedAt: new Date(product.updated_at)
      }));
    } catch (error) {
      console.error('Error getting discovery products:', error);
      throw error;
    }
  }

  // Obtener producto por ID
  static async getProductById(productId: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          users!inner(name, avatar, bio, location)
        `)
        .eq('id', productId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        description: data.description,
        category: data.category,
        condition: data.condition,
        images: data.images,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error getting product by ID:', error);
      return null;
    }
  }

  // Actualizar producto
  static async updateProduct(productId: string, updates: Partial<CreateProductData>): Promise<void> {
    try {
      const updateData: any = {};

      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.category) updateData.category = updates.category;
      if (updates.condition) updateData.condition = updates.condition;

      // Si hay nuevas imágenes, subirlas
      if (updates.images && updates.images.length > 0) {
        const imageUrls = await Promise.all(
          updates.images.map(file => this.uploadImage(file))
        );
        updateData.images = imageUrls;
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  // Eliminar producto
  static async deleteProduct(productId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Obtener categorías disponibles
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

  // Obtener condiciones disponibles
  static getConditions(): { value: string; label: string }[] {
    return [
      { value: 'new', label: 'Nuevo' },
      { value: 'like-new', label: 'Como nuevo' },
      { value: 'good', label: 'Bueno' },
      { value: 'fair', label: 'Aceptable' },
      { value: 'poor', label: 'Regular' }
    ];
  }
} 