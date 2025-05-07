'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem('userName');
    if (name) setUserName(name);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    router.push('/login');
  };

  const menuItems = [
    { path: '/caixa', label: 'Caixa' },
    { path: '/mesas', label: 'Mesas' },
    { path: '/fechamento-caixa', label: 'Fechamento' },
    { path: '/controle-financeiro', label: 'Financeiro' }
  ];

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Logo e Nome */}
        <div className="h-16 flex items-center justify-between">
          <div className="text-xl font-bold text-gray-800">Elite Pedidos</div>
          
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-700 font-medium">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium">{userName}</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Menu de Navegação */}
        <nav className="flex space-x-1 border-b">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                pathname === item.path
                  ? 'border-b-2 border-blue-500 text-blue-600 -mb-[2px]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
} 