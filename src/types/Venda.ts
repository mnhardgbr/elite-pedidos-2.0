export interface ItemPedido {
  produto: {
    id: number;
    nome: string;
    categoria: string;
    preco: number;
    tipovenda: string;
    peso?: number;
  };
  quantidade: number;
}

export interface TaxaPagamento {
  tipo: string;
  percentual: number;
  valor: number;
}

export interface Venda {
  id: string;
  categoria?: string;
  valor?: number;
  criadoEm?: any;
  data?: string;
  itens?: ItemPedido[];
  total?: number;
  formaPagamento?: string;
  status?: 'CONCLUIDO' | 'CANCELADO';
  taxas?: TaxaPagamento[];
  acrescimoAlimentacao?: number;
  valorLiquido?: number;
} 