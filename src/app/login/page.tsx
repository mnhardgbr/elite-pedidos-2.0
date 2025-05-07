'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      // Aqui você implementará a lógica de autenticação com o backend
      // Por enquanto, vamos simular um login básico
      if (email === 'admin@exemplo.com' && senha === 'admin123') {
        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Salvar token de autenticação (implementar adequadamente)
        localStorage.setItem('authToken', 'token-exemplo');
        localStorage.setItem('userName', 'Administrador');
        
        // Redirecionar para o caixa
        router.push('/caixa');
      } else {
        setErro('Email ou senha incorretos');
      }
    } catch (error) {
      setErro('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative w-32 h-32">
                <Image
                  src="/images/logo.png"
                  alt="Logo Elite Pedidos"
                  fill
                  className="object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                  priority
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Elite Pedidos</h2>
            <p className="text-sm text-gray-600">Faça login para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Seu email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sua senha"
                required
              />
            </div>

            {erro && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Esqueceu sua senha?
              </button>
            </div>
          </form>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Precisa de ajuda? Entre em contato com o suporte
          </p>
        </div>
      </div>
    </div>
  );
} 