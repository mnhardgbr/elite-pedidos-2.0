import { create } from 'zustand';
import { Venda } from '../src/types/Venda';

interface VendasStore {
  vendas: Venda[];
  setVendas: (vendas: Venda[]) => void;
  addVenda: (venda: Venda) => void;
}

export const useVendasStore = create<VendasStore>((set) => ({
  vendas: [],
  setVendas: (vendas) => set({ vendas }),
  addVenda: (venda) => set((state) => ({ vendas: [...state.vendas, venda] })),
})); 