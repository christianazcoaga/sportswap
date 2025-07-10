import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ProductService, Product } from '../services/productService';
import { MatchService } from '../services/matchService';

const Discovery: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, []);

  const fetchProducts = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const fetchedProducts = await ProductService.getDiscoveryProducts(user.id);
      setProducts(fetchedProducts);
    } catch (err: any) {
      setError(err.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (action: 'like' | 'dislike') => {
    if (!user || currentIndex >= products.length) return;
    const currentProduct = products[currentIndex];
    try {
      await MatchService.createSwipe(user.id, currentProduct.id, action);
      setCurrentIndex(prev => prev + 1);
    } catch (err: any) {
      console.error('Error al hacer swipe:', err);
    }
  };

  const handleLike = () => handleSwipe('like');
  const handleDislike = () => handleSwipe('dislike');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sport-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchProducts}
            className="bg-sport-500 text-white px-4 py-2 rounded-md hover:bg-sport-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (products.length === 0 || currentIndex >= products.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl">🏃</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡No hay más productos!
          </h2>
          <p className="text-gray-600 mb-4">
            Has visto todos los productos disponibles. Vuelve más tarde para ver nuevos productos.
          </p>
          <button
            onClick={() => {
              setCurrentIndex(0);
              fetchProducts();
            }}
            className="bg-sport-500 text-white px-6 py-2 rounded-md hover:bg-sport-600"
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }

  const currentProduct = products[currentIndex];

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8 mt-8 text-center">
        <h1 className="text-4xl font-extrabold text-blue-700 mb-2">SportSwap</h1>
        <p className="text-gray-600 text-lg">Intercambia productos deportivos fácilmente</p>
      </div>

      {/* Product Card */}
      <div className="relative">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Product Image */}
          <div className="relative h-96 bg-gray-200">
            {currentProduct.images.length > 0 ? (
              <img
                src={currentProduct.images[0]}
                alt={currentProduct.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl">🏃</span>
              </div>
            )}
            {/* User Info Overlay */}
            {/* Puedes agregar aquí info del usuario si lo deseas */}
          </div>

          {/* Product Info */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {currentProduct.title}
            </h2>
            <p className="text-gray-600 mb-4">
              {currentProduct.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sport-100 text-sport-800">
                {currentProduct.condition}
              </span>
              <span className="text-sm text-gray-500">
                {currentProduct.category}
              </span>
            </div>
          </div>
        </div>

        {/* Swipe Buttons */}
        <div className="flex justify-center space-x-4 mt-6">
          <button
            onClick={handleDislike}
            className="w-16 h-16 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:border-red-400 transition-colors"
          >
            <span className="text-2xl">✕</span>
          </button>
          
          <button
            onClick={handleLike}
            className="w-16 h-16 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:border-sport-400 transition-colors"
          >
            <span className="text-2xl">♥</span>
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          {currentIndex + 1} de {products.length} productos
        </p>
      </div>
    </div>
  );
};

export default Discovery; 