import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ProductService, Product } from '../services/productService';
import { Link } from 'react-router-dom';

const MyProductsPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const myProducts = await ProductService.getUserProducts(user.id);
      setProducts(myProducts);
    } catch (err: any) {
      setError(err.message || 'Error al cargar tus productos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Mis Productos</h1>
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-center">{error}</div>
      )}
      {!loading && products.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          <p>No has publicado ningún producto aún.</p>
          <Link to="/add-product" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">Agregar producto</Link>
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2">
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
    </div>
  );
};

export default MyProductsPage; 