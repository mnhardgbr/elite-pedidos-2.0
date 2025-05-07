'use client';

import { useVendasStore } from '../stores/useVendasStore';
import { useVendasSync } from '../hooks/useVendasSync';
import { addVenda } from '../lib/addVenda';
import { useState } from 'react';

export default function VendasList() {
  const vendas = useVendasStore((state) => state.vendas);
  useVendasSync(); // ativa sincronização com Firestore

  const [categoria, setCategoria] = useState('Venda Mesa');
  const [valor, setValor] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleAddVenda = async () => {
    setLoading(true);
    await addVenda(categoria, valor);
    setLoading(false);
    setValor(0);
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Vendas (Tempo Real)</h2>
      <ul className="mb-4">
        {vendas.map((venda) => (
          <li key={venda.id} className="border-b py-2 flex justify-between">
            <span>{venda.categoria}</span>
            <span>R$ {venda.valor}</span>
          </li>
        ))}
        {vendas.length === 0 && <li className="text-gray-500">Nenhuma venda registrada</li>}
      </ul>
      <div className="flex gap-2 mb-2">
        <input
          className="border rounded px-2 py-1 flex-1"
          placeholder="Categoria"
          value={categoria}
          onChange={e => setCategoria(e.target.value)}
        />
        <input
          className="border rounded px-2 py-1 w-24"
          type="number"
          placeholder="Valor"
          value={valor}
          onChange={e => setValor(Number(e.target.value))}
        />
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={handleAddVenda}
        disabled={loading || !categoria || valor <= 0}
      >
        {loading ? 'Adicionando...' : 'Adicionar Venda'}
      </button>
    </div>
  );
} 