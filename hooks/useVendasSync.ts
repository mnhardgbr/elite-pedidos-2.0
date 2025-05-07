import { useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useVendasStore } from '../stores/useVendasStore';
import { Venda, ItemPedido } from '../src/types/Venda';

export const useVendasSync = () => {
  const setVendas = useVendasStore((state) => state.setVendas);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'vendas'), (snapshot) => {
      const docs = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          data: data.data?.toDate ? data.data.toDate().toISOString() : data.data || '',
          itens: data.itens || [],
          total: data.total || 0,
          formaPagamento: data.formaPagamento || '',
          status: data.status || 'CONCLUIDO',
        } as Venda;
      });
      setVendas(docs);
    });

    return () => unsub();
  }, [setVendas]);
}; 