import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HomeIcon,
  HeartIcon,
  UserIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Descubrir', href: '/', icon: HomeIcon },
    { name: 'Mis Productos', href: '/my-products', icon: PlusIcon },
    { name: 'Matches', href: '/matches', icon: HeartIcon },
    { name: 'Chats', href: '/chats', icon: ChatBubbleLeftRightIcon },
    { name: 'Perfil', href: '/profile', icon: UserIcon },
  ];

  if (!user) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {/* Botón hamburguesa para todas las resoluciones */}
              <button
                className="mr-2 text-gray-600 hover:text-gray-900 focus:outline-none"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Abrir menú"
              >
                <Bars3Icon className="h-7 w-7" />
              </button>
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-sport-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🏃</span>
                </div>
                <span className="text-xl font-bold text-gray-900">SportSwap</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img
                  className="h-8 w-8 rounded-full"
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                  alt={user.name}
                />
                <span className="text-sm font-medium text-gray-700">{user.name}</span>
              </div>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-gray-600"
                title="Cerrar sesión"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar (ocultable en todas las resoluciones) */}
      <nav
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="pt-16 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Menú</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label="Cerrar menú"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-sport-100 text-sport-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Overlay para cerrar el sidebar solo en móvil/tablet */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content con margen si sidebar está abierto en escritorio */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-200 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        {children}
      </main>

      {/* Botón flotante para agregar producto */}
      <Link
        to="/add-product"
        className="fixed bottom-20 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl"
        title="Agregar producto"
      >
        +
      </Link>
    </div>
  );
};

export default Layout; 