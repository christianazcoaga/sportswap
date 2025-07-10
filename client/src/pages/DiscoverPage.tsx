import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ProductService, Product } from '../services/productService';

const DiscoverPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const loadProducts = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const discoveryProducts = await ProductService.getDiscoveryProducts(user.id, selectedCategory);
      setProducts(discoveryProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [user, selectedCategory]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === 'all' ? '' : category);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadProducts}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-extrabold text-blue-700 mb-2 text-center">SportSwap</h1>
          <p className="text-gray-600 text-center mb-4">Intercambia productos deportivos fácilmente</p>
          {/* Filtro de categorías */}
          <div className="mt-4 max-w-xs mx-auto">
            <select
              value={selectedCategory || 'all'}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas las categorías</option>
              {ProductService.getCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Galería de productos */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏀</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">¡No hay productos disponibles!</h2>
            <p className="text-gray-600">Vuelve más tarde para ver nuevos productos.</p>
            <button 
              onClick={loadProducts}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Recargar
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow p-4 flex flex-col">
                <div className="h-48 bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.title} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-5xl text-gray-300">🏷️</span>
                  )}
                </div>
                <h2 className="text-lg font-bold mb-1">{product.title}</h2>
                <p className="text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>{product.category}</span>
                  <span>{product.condition}</span>
                </div>
                <span className="text-xs text-gray-400">Publicado el {product.createdAt.toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoverPage; 