import React from 'react';

export default function PedidosCliente() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-4 text-blue-700">Área do Cliente</h1>
        <p className="text-center text-gray-700 mb-6">
          Bem-vindo! Aqui você pode fazer seus pedidos para delivery e acompanhar o status da entrega.
        </p>
        {/* Em breve: listagem de pedidos, botão para novo pedido, etc. */}
        <div className="text-center text-gray-400 text-sm mt-8">
          Funcionalidade de pedidos em desenvolvimento.
        </div>
      </div>
    </div>
  );
} 