'use client';

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { Venda } from '../../types/Venda';

interface Produto {
  id: number;
  nome: string;
  categoria: string;
  preco: number;
  imagem?: string;
  tipovenda: string;
  codigobarra?: string;
  peso?: number;
}

interface ItemPedido {
  produto: Produto;
  quantidade: number;
}

interface ProdutoAvulsoModal {
  isOpen: boolean;
  nome: string;
  preco: number;
  quantidade: number;
  observacao: string;
}

interface FormaPagamentoSplit {
  tipo: string;
  valor: number;
}

interface PesoModal {
  isOpen: boolean;
  produto: Produto | null;
  peso: number;
}

// Add new interface for edit payment modal
interface EditPagamentoModal {
  isOpen: boolean;
  venda: Venda | null;
  novaFormaPagamento: string;
  dividirPagamento: boolean;
  pagamentosDivididos: FormaPagamentoSplit[];
  novoValorPagamento: number;
}

interface Mesa {
  numero: number;
  status: 'LIVRE' | 'OCUPADA';
  pedidos: ItemPedido[];
  observacao?: string;
}

interface MesaModal {
  isOpen: boolean;
  mesa: Mesa | null;
}

// Adicionar constantes para as taxas
const TAXAS_PAGAMENTO = {
  'Cartão de Débito': 0.02, // 2%
  'Cartão de Crédito': 0.0436, // 4.36%
  'Vale Alimentação': 0, // 0% de taxa, mas 8% de acréscimo
  'PIX': 0,
  'Dinheiro': 0
};

const ACRESCIMO_ALIMENTACAO = 0.08; // 8%

// Função para calcular taxas e valor líquido
const calcularTaxasEValorLiquido = (valor: number, formaPagamento: string) => {
  const taxa = TAXAS_PAGAMENTO[formaPagamento as keyof typeof TAXAS_PAGAMENTO] || 0;
  const valorTaxa = valor * taxa;
  
  let acrescimoAlimentacao = 0;
  if (formaPagamento === 'Vale Alimentação') {
    acrescimoAlimentacao = valor * ACRESCIMO_ALIMENTACAO;
  }

  return {
    taxas: [
      {
        tipo: formaPagamento,
        percentual: taxa * 100,
        valor: valorTaxa
      }
    ],
    valorLiquido: valor - valorTaxa,
    acrescimoAlimentacao
  };
};

export default function Caixa() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('Todas');
  const [termoBusca, setTermoBusca] = useState('');
  const [pedidoAtual, setPedidoAtual] = useState<ItemPedido[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null);
  const [produtoAvulsoModal, setProdutoAvulsoModal] = useState<ProdutoAvulsoModal>({
    isOpen: false,
    nome: '',
    preco: 0,
    quantidade: 1,
    observacao: ''
  });
  const [formaPagamento, setFormaPagamento] = useState<string>('');
  const [dividirPagamento, setDividirPagamento] = useState(false);
  const [pagamentosDivididos, setPagamentosDivididos] = useState<FormaPagamentoSplit[]>([]);
  const [novoValorPagamento, setNovoValorPagamento] = useState<number>(0);
  const [novaFormaPagamento, setNovaFormaPagamento] = useState<string>('');
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [vendasDoDia, setVendasDoDia] = useState<Venda[]>([]);
  const [pesoModal, setPesoModal] = useState<PesoModal>({
    isOpen: false,
    produto: null,
    peso: 0
  });
  // Add new state for edit payment modal
  const [editPagamentoModal, setEditPagamentoModal] = useState<EditPagamentoModal>({
    isOpen: false,
    venda: null,
    novaFormaPagamento: '',
    dividirPagamento: false,
    pagamentosDivididos: [],
    novoValorPagamento: 0
  });
  const [mesaModal, setMesaModal] = useState<MesaModal>({
    isOpen: false,
    mesa: null
  });
  // Adicionar estados para o resumo do dia
  const [resumoDia, setResumoDia] = useState({
    dinheiro: 0,
    pix: 0,
    debito: 0,
    credito: 0,
    alimentacao: 0,
    ifood: 0,
    total: 0
  });
  // 1. Novo estado para pedidos do iFood
  const [ifoodPedidos, setIfoodPedidos] = useState<ItemPedido[]>([]);
  const [isIfoodPedido, setIsIfoodPedido] = useState(false);
  // 1. Lista fixa de produtos iFood
  const produtosIfood: Produto[] = [
    { id: 1001, nome: 'Pão francês un', categoria: 'Padaria', preco: 0, tipovenda: 'un' },
    { id: 1002, nome: 'Rosca de polvilho', categoria: 'Padaria', preco: 0, tipovenda: 'un' },
    { id: 1003, nome: 'Joelhinho', categoria: 'Padaria', preco: 0, tipovenda: 'un' },
    { id: 1004, nome: 'Bolacha Beliscão', categoria: 'Bolos e Doces', preco: 0, tipovenda: 'un' },
    { id: 1005, nome: 'Bolacha de Maisena com Leite condensado recheada de Doce de Leite', categoria: 'Bolos e Doces', preco: 0, tipovenda: 'un' },
    { id: 1006, nome: 'Bolacha de Nata com Coco', categoria: 'Bolos e Doces', preco: 0, tipovenda: 'un' },
    { id: 1007, nome: 'Bolo de Chocolate recheado com Brigadeiro', categoria: 'Bolos e Doces', preco: 0, tipovenda: 'un' },
    { id: 1008, nome: 'Cuca Simples', categoria: 'Bolos e Doces', preco: 0, tipovenda: 'un' },
    { id: 1009, nome: 'Cueca Virada Macia', categoria: 'Bolos e Doces', preco: 0, tipovenda: 'un' },
    { id: 1010, nome: 'Cueca Virada Royal', categoria: 'Bolos e Doces', preco: 0, tipovenda: 'un' },
    { id: 1011, nome: 'Nozinho', categoria: 'Bolos e Doces', preco: 0, tipovenda: 'un' },
    { id: 1012, nome: 'Sonho de Chocolate', categoria: 'Bolos e Doces', preco: 0, tipovenda: 'un' },
    { id: 1013, nome: 'Sonho de Doce de Leite', categoria: 'Bolos e Doces', preco: 0, tipovenda: 'un' },
    { id: 1014, nome: 'Bolacha Amanteigada', categoria: 'Bolos e Doces', preco: 0, tipovenda: 'un' },
    { id: 1015, nome: 'Bolacha de Maisena cobertura de Chocolate', categoria: 'Bolos e Doces', preco: 0, tipovenda: 'un' },
    { id: 1016, nome: 'Pão de Queijo de Vento', categoria: 'Salgados', preco: 0, tipovenda: 'un' },
    { id: 1017, nome: 'Pão de Queijo Tradicional', categoria: 'Salgados', preco: 0, tipovenda: 'un' },
    { id: 1018, nome: 'Coxinha de Carne', categoria: 'Salgados', preco: 0, tipovenda: 'un' },
    { id: 1019, nome: 'Coxinha de Frango', categoria: 'Salgados', preco: 0, tipovenda: 'un' },
    { id: 1020, nome: 'Pastel de Carne', categoria: 'Salgados', preco: 0, tipovenda: 'un' },
    { id: 1021, nome: 'Pastel de Frango', categoria: 'Salgados', preco: 0, tipovenda: 'un' },
    { id: 1022, nome: 'Pastel de Pizza', categoria: 'Salgados', preco: 0, tipovenda: 'un' },
    { id: 1023, nome: 'Pastel de Queijo', categoria: 'Salgados', preco: 0, tipovenda: 'un' },
    { id: 1024, nome: 'Bauru Assado', categoria: 'Salgados', preco: 0, tipovenda: 'un' },
    { id: 1025, nome: 'Esfirra de Frango', categoria: 'Salgados', preco: 0, tipovenda: 'un' },
    { id: 1026, nome: 'Doguinho', categoria: 'Salgados', preco: 0, tipovenda: 'un' },
    { id: 1027, nome: 'Hamburgão', categoria: 'Salgados', preco: 0, tipovenda: 'un' },
    { id: 1028, nome: 'Salgado Frito de Salsicha', categoria: 'Salgados', preco: 0, tipovenda: 'un' },
    { id: 1029, nome: 'Enroladinho Assado Frango', categoria: 'Salgados', preco: 0, tipovenda: 'un' },
    { id: 1030, nome: 'Enroladinho Assado Presunto e Queijo', categoria: 'Salgados', preco: 0, tipovenda: 'un' },
    { id: 1031, nome: 'Coca Cola 350ml', categoria: 'Bebidas', preco: 0, tipovenda: 'un' },
    { id: 1032, nome: 'Coca Cola 600ml', categoria: 'Bebidas', preco: 0, tipovenda: 'un' },
    { id: 1033, nome: 'Água Mineral', categoria: 'Bebidas', preco: 0, tipovenda: 'un' },
    { id: 1034, nome: 'Água com Gás', categoria: 'Bebidas', preco: 0, tipovenda: 'un' },
    { id: 1035, nome: 'Coca Cola 200ml', categoria: 'Bebidas', preco: 0, tipovenda: 'un' },
    { id: 1036, nome: 'Café G', categoria: 'Bebidas', preco: 0, tipovenda: 'un' },
    { id: 1037, nome: 'Café M', categoria: 'Bebidas', preco: 0, tipovenda: 'un' },
    { id: 1038, nome: 'Café P', categoria: 'Bebidas', preco: 0, tipovenda: 'un' },
    { id: 1039, nome: 'Café com Leite G', categoria: 'Bebidas', preco: 0, tipovenda: 'un' },
    { id: 1040, nome: 'Café com Leite M', categoria: 'Bebidas', preco: 0, tipovenda: 'un' },
    { id: 1041, nome: 'Café com Leite P', categoria: 'Bebidas', preco: 0, tipovenda: 'un' },
    { id: 1042, nome: 'Capuccino G', categoria: 'Bebidas', preco: 0, tipovenda: 'un' },
    { id: 1043, nome: 'Capuccino M', categoria: 'Bebidas', preco: 0, tipovenda: 'un' },
    { id: 1044, nome: 'Capuccino P', categoria: 'Bebidas', preco: 0, tipovenda: 'un' },
    { id: 1045, nome: 'Sprite Lata 350ml', categoria: 'Bebidas', preco: 0, tipovenda: 'un' },
    { id: 1046, nome: 'Fanta laranja 200ml', categoria: 'Bebidas', preco: 0, tipovenda: 'un' },
    { id: 1047, nome: 'Fanta laranja 600ml', categoria: 'Bebidas', preco: 0, tipovenda: 'un' },
    { id: 1048, nome: 'Bauru', categoria: 'Lanches', preco: 0, tipovenda: 'un' },
    { id: 1049, nome: 'Bauru com Ovo', categoria: 'Lanches', preco: 0, tipovenda: 'un' },
    { id: 1050, nome: 'Misto Quente com Bacon', categoria: 'Lanches', preco: 0, tipovenda: 'un' },
    { id: 1051, nome: 'Misto Quente com Ovo', categoria: 'Lanches', preco: 0, tipovenda: 'un' },
    { id: 1052, nome: 'Misto Quente', categoria: 'Lanches', preco: 0, tipovenda: 'un' },
    { id: 1053, nome: 'Queijo Quente', categoria: 'Lanches', preco: 0, tipovenda: 'un' },
    { id: 1054, nome: 'Pão na Chapa', categoria: 'Lanches', preco: 0, tipovenda: 'un' },
  ];
  // 2. Estado para modal de preço iFood
  const [ifoodModal, setIfoodModal] = useState<{produto: Produto|null, quantidade: number, preco: number, isOpen: boolean}>({produto: null, quantidade: 1, preco: 0, isOpen: false});
  // Adicionar estado para valor recebido
  const [valorRecebido, setValorRecebido] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  // Adicionar ref para o input de busca
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    // Não faz nada se algum modal estiver aberto
    if (ifoodModal.isOpen || produtoAvulsoModal.isOpen || pesoModal.isOpen || editPagamentoModal.isOpen) return;
    if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
      setMesaSelecionada(null);
      setIsIfoodPedido(false);
      setPedidoAtual([]);
    }
  }, [ifoodModal.isOpen, produtoAvulsoModal.isOpen, pesoModal.isOpen, editPagamentoModal.isOpen]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  // Filtrar produtos baseado na busca e categoria
  useEffect(() => {
    if (!produtos.length) {
      setProdutosFiltrados([]);
      return;
    }

    let resultados = [...produtos];

    // Função para normalizar texto para comparação
    const normalizar = (texto: string) => {
      if (!texto) return '';
      return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[~]/g, '') // Remove til
        .replace(/[^a-z0-9\s]/g, ' ') // Substitui caracteres especiais por espaço
        .replace(/\s+/g, ' ') // Remove espaços múltiplos
        .trim();
    };

    // Função para verificar se uma palavra está contida em outra
    const contemPalavra = (texto: string, busca: string) => {
      if (!busca.trim()) return true; // Se a busca estiver vazia, retorna true
      
      const textoNormalizado = normalizar(texto);
      const buscaNormalizada = normalizar(busca);

      // Debug para verificar a normalização
      console.log('Comparação:', {
        original: texto,
        normalizado: textoNormalizado,
        busca: busca,
        buscaNormalizada: buscaNormalizada
      });

      // Divide em palavras
      const palavrasTexto = textoNormalizado.split(' ').filter(p => p.length > 0);
      const palavrasBusca = buscaNormalizada.split(' ').filter(p => p.length > 0);
      
      // Verifica se todas as palavras da busca correspondem a alguma palavra do texto
      return palavrasBusca.every(palavraBusca => {
        // Para cada palavra da busca, deve haver uma palavra correspondente no texto
        return palavrasTexto.some(palavraTexto => {
          // Verifica correspondência exata ou se uma palavra contém a outra
          const match = palavraTexto === palavraBusca || 
                       (palavraBusca.length > 2 && palavraTexto.includes(palavraBusca)) ||
                       (palavraTexto.length > 2 && palavraBusca.includes(palavraTexto));
          
          if (match) {
            console.log('Match encontrado:', { palavraTexto, palavraBusca });
          }
          
          return match;
        });
      });
    };

    // Aplicar filtro de categoria primeiro
    if (categoriaSelecionada && categoriaSelecionada !== 'Todas') {
      resultados = resultados.filter(produto => 
        normalizar(produto.categoria) === normalizar(categoriaSelecionada)
      );
    }

    // Depois aplicar filtro de busca
    if (termoBusca.trim()) {
      const busca = termoBusca.trim();
      resultados = resultados.filter(produto => {
        // Busca exata por código de barras
        if (produto.codigobarra && normalizar(produto.codigobarra) === normalizar(busca)) {
          return true;
        }

        // Busca por palavras no nome do produto
        if (contemPalavra(produto.nome, busca)) {
          return true;
        }

        // Busca por palavras na categoria
        if (contemPalavra(produto.categoria, busca)) {
          return true;
        }

        return false;
      });
    }

    console.log('Debug filtros:', {
      categoria: categoriaSelecionada,
      termoBusca: termoBusca || '(vazio)',
      totalProdutos: produtos.length,
      produtosFiltrados: resultados.length,
      exemplos: resultados.slice(0, 3).map(p => ({
        nome: p.nome,
        categoria: p.categoria,
        nomeNormalizado: normalizar(p.nome),
        match: termoBusca ? contemPalavra(p.nome, termoBusca) : 'sem busca'
      }))
    });

    setProdutosFiltrados(resultados);
  }, [produtos, categoriaSelecionada, termoBusca]);

  // Carregar produtos do localStorage
  const carregarProdutos = () => {
    try {
      if (typeof window === 'undefined') return;
      const produtosSalvos = localStorage.getItem('produtos');
      if (!produtosSalvos) {
        setProdutos([]);
        setCategorias(['Todas']);
        return;
      }

      const produtosData = JSON.parse(produtosSalvos);
      
      // Limpar e validar dados
      const produtosLimpos = produtosData.map((p: Produto) => ({
        id: p.id || Date.now(),
        nome: p.nome?.trim() || '',
        categoria: p.categoria?.trim() || 'Sem Categoria',
        preco: Number(p.preco) || 0,
        codigobarra: p.codigobarra?.trim() || '',
        tipovenda: p.tipovenda || 'un',
        imagem: p.imagem || undefined
      }));

      // Filtrar produtos sem nome
      const produtosValidos = produtosLimpos.filter((p: Produto) => p.nome);

      // Extrair categorias únicas e ordenar
      const categoriasUnicas = ['Todas'];
      const categoriasSet = new Set<string>(
        produtosValidos
          .map((p: Produto) => p.categoria)
          .filter((cat: string): cat is string => Boolean(cat))
      );
      const categoriasOrdenadas = Array.from(categoriasSet) as string[];
      categoriasUnicas.push(...categoriasOrdenadas.sort((a, b) => a.localeCompare(b, 'pt-BR')));

      setProdutos(produtosValidos);
      setCategorias(categoriasUnicas);

      console.log('Produtos carregados:', {
        total: produtosValidos.length,
        categorias: categoriasUnicas,
        exemplos: produtosValidos.slice(0, 3)
      });
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProdutos([]);
      setCategorias(['Todas']);
    }
  };

  // Adicionar useEffect para debug de mudanças de estado
  useEffect(() => {
    console.log('Estado atual:', {
      totalProdutos: produtos.length,
      totalFiltrados: produtosFiltrados.length,
      categoriaSelecionada,
      termoBusca: termoBusca || '(vazio)'
    });
  }, [produtos, produtosFiltrados, categoriaSelecionada, termoBusca]);

  // Modificar o useEffect principal para garantir a ordem correta de carregamento
  useEffect(() => {
    carregarProdutos();
    carregarMesas();
    carregarVendas();
  }, []);

  // Modificar a função carregarVendas
  const carregarVendas = () => {
    try {
      if (typeof window === 'undefined') return;
      const vendasSalvas = localStorage.getItem('vendas');
      let vendasCarregadas: Venda[] = [];

      if (!vendasSalvas) {
        // Vendas iniciais baseadas na imagem
        const vendasIniciais: Venda[] = [
          {
            id: "20000051",
            data: new Date().setHours(20, 0, 51).toString(),
            itens: [
              {
                produto: {
                  id: 1,
                  nome: "pão de cachorro",
                  categoria: "Pães",
                  preco: 3.00,
                  tipovenda: "un",
                  peso: 100
                },
                quantidade: 1
              }
            ],
            total: 3.00,
            formaPagamento: "Dinheiro: R$ 1.50 + Cartão de Débito: R$ 1.50",
            status: 'CONCLUIDO'
          },
          {
            id: "19477252",
            data: new Date().setHours(19, 47, 52).toString(),
            itens: [
              {
                produto: {
                  id: 2,
                  nome: "enroladinho assado",
                  categoria: "Assado",
                  preco: 12.00,
                  tipovenda: "un",
                  peso: 300
                },
                quantidade: 1
              }
            ],
            total: 12.00,
            formaPagamento: "PIX: R$ 10.00 + Cartão de Débito: R$ 2.00",
            status: 'CONCLUIDO'
          },
          {
            id: "12463838",
            data: new Date().setHours(12, 46, 38).toString(),
            itens: [
              {
                produto: {
                  id: 3,
                  nome: "pão francês",
                  categoria: "Pães",
                  preco: 3.25,
                  tipovenda: "un",
                  peso: 100
                },
                quantidade: 1
              },
              {
                produto: {
                  id: 4,
                  nome: "pão Mini caseiro",
                  categoria: "Pães",
                  preco: 3.25,
                  tipovenda: "un",
                  peso: 200
                },
                quantidade: 1
              }
            ],
            total: 6.50,
            formaPagamento: "Dinheiro",
            status: 'CONCLUIDO'
          },
          {
            id: "10334040",
            data: new Date().setHours(10, 33, 40).toString(),
            itens: [
              {
                produto: {
                  id: 5,
                  nome: "pão de brioche",
                  categoria: "Pães",
                  preco: 7.25,
                  tipovenda: "un"
                },
                quantidade: 1
              },
              {
                produto: {
                  id: 6,
                  nome: "pão Mini caseiro",
                  categoria: "Pães",
                  preco: 7.25,
                  tipovenda: "un",
                  peso: 100
                },
                quantidade: 1
              }
            ],
            total: 14.50,
            formaPagamento: "Dinheiro: R$ 10.00 + Cartão de Débito: R$ 4.50",
            status: 'CONCLUIDO'
          }
        ];
        localStorage.setItem('vendas', JSON.stringify(vendasIniciais));
        vendasCarregadas = vendasIniciais;
      } else {
        vendasCarregadas = JSON.parse(vendasSalvas);
      }

      // Atualizar os estados
      setVendas(vendasCarregadas);
      const vendasDoDiaFiltradas = filtrarVendasDoDia(vendasCarregadas);
      setVendasDoDia(vendasDoDiaFiltradas);
      
      // Calcular e atualizar o resumo do dia
      const novoResumo = calcularResumoDia(vendasDoDiaFiltradas);
      setResumoDia(novoResumo);

      console.log('Vendas carregadas:', {
        total: vendasCarregadas.length,
        doDia: vendasDoDiaFiltradas.length,
        resumo: novoResumo
      });
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    }
  };

  // Modificar a função filtrarVendasDoDia para ser mais precisa
  const filtrarVendasDoDia = (todasVendas: Venda[]) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    return todasVendas.filter(venda => {
      const dataVenda = new Date(Number(venda.data));
      return dataVenda >= hoje && dataVenda < amanha;
    });
  };

  // Carregar mesas do localStorage
  const carregarMesas = () => {
    try {
      const mesasSalvas = localStorage.getItem('mesas');
      if (mesasSalvas) {
        setMesas(JSON.parse(mesasSalvas));
      } else {
        // Inicializar com 5 mesas vazias se não existir
        const mesasIniciais = Array.from({ length: 5 }, (_, i) => ({
          numero: i + 1,
          status: 'LIVRE' as const,
          pedidos: []
        }));
        localStorage.setItem('mesas', JSON.stringify(mesasIniciais));
        setMesas(mesasIniciais);
      }
    } catch (error) {
      console.error('Erro ao carregar mesas:', error);
    }
  };

  useEffect(() => {
    const handleProdutosAtualizados = (event: CustomEvent) => {
      carregarProdutos();
    };

    window.addEventListener('produtosAtualizados', handleProdutosAtualizados as EventListener);
    
    return () => {
      window.removeEventListener('produtosAtualizados', handleProdutosAtualizados as EventListener);
    };
  }, []);

  // Melhorar handler de busca
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setTermoBusca(valor);

    // Se for código de barras (8+ dígitos), buscar produto
    if (/^\d{8,}$/.test(valor)) {
      const produto = produtos.find(p => p.codigobarra === valor);
      if (produto) {
        handleProdutoClick(produto);
        setTimeout(() => setTermoBusca(''), 300);
      }
    }
  };

  const handleProdutoClick = (produto: Produto) => {
    if (isIfoodPedido) {
      setIfoodModal({produto, quantidade: 1, preco: 0, isOpen: true});
      return;
    }
    if (produto.tipovenda === 'kg') {
      setPesoModal({
        isOpen: true,
        produto,
        peso: 0
      });
    } else {
      adicionarProduto(produto);
      setTermoBusca('');
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  };

  const adicionarProduto = (produto: Produto) => {
    setPedidoAtual(prev => {
      // Para produtos vendidos por kg, cada adição é um novo item
      if (produto.tipovenda === 'kg') {
        return [...prev, { produto, quantidade: 1 }];
      }

      // Para outros produtos, procura item existente e incrementa quantidade
      const itemExistente = prev.find(item => 
        item.produto.id === produto.id && 
        item.produto.nome === produto.nome && 
        item.produto.tipovenda === 'un'
      );
      
      if (itemExistente) {
        return prev.map(item =>
          item === itemExistente
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }

      return [...prev, { produto, quantidade: 1 }];
    });
  };

  const adicionarProdutoAvulso = () => {
    if (produtoAvulsoModal.nome && produtoAvulsoModal.preco > 0) {
      const produtoAvulso: Produto = {
        id: Date.now(),
        nome: produtoAvulsoModal.nome,
        categoria: 'Avulso',
        preco: produtoAvulsoModal.preco,
        tipovenda: 'un'
      };
      adicionarProduto(produtoAvulso);
      setProdutoAvulsoModal({ isOpen: false, nome: '', preco: 0, quantidade: 1, observacao: '' });
      setTermoBusca('');
    }
  };

  const adicionarProdutoComPeso = () => {
    if (!pesoModal.produto || pesoModal.peso <= 0) return;

    // Mantém o preço original por kg e adiciona o peso
    const produtoComPeso: Produto = {
      ...pesoModal.produto,
      peso: pesoModal.peso
    };

    setPedidoAtual(prev => {
      // Procura um item existente com o mesmo produto E peso
      const itemExistente = prev.find(item => 
        item.produto.id === pesoModal.produto?.id && 
        item.produto.nome === pesoModal.produto?.nome &&
        item.produto.peso === pesoModal.peso
      );

      if (itemExistente) {
        return prev.map(item =>
          item === itemExistente
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }

      // Se não encontrou item com mesmo produto e peso, adiciona como novo item
      return [...prev, { 
        produto: produtoComPeso,
        quantidade: 1
      }];
    });

    setPesoModal({
      isOpen: false,
      produto: null,
      peso: 0
    });
    setTermoBusca('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const removerProduto = (item: ItemPedido) => {
    setPedidoAtual(prev => prev.filter(i => 
      !(i.produto.id === item.produto.id && 
        i.produto.nome === item.produto.nome && 
        i.produto.peso === item.produto.peso)
    ));
  };

  const atualizarQuantidade = (item: ItemPedido, novaQuantidade: number) => {
    if (novaQuantidade < 1) {
      removerProduto(item);
      return;
    }
    setPedidoAtual(prev =>
      prev.map(i =>
        (i.produto.id === item.produto.id && 
         i.produto.nome === item.produto.nome && 
         i.produto.peso === item.produto.peso)
          ? { ...i, quantidade: novaQuantidade }
          : i
      )
    );
  };

  const calcularTotal = () => {
    return pedidoAtual.reduce((total, item) => {
      const produto = item.produto;
      
      // Se for produto vendido por kg
      if (produto.tipovenda === 'kg') {
        // Calcula o preço baseado no peso em gramas
        const pesoEmKg = (produto.peso || 0) / 1000;
        const precoTotal = produto.preco * pesoEmKg * item.quantidade;
        console.log('Cálculo produto por peso:', {
          nome: produto.nome,
          precoKg: produto.preco,
          peso: produto.peso,
          pesoEmKg,
          quantidade: item.quantidade,
          precoTotal
        });
        return total + precoTotal;
      }
      
      // Para produtos vendidos por unidade
      const precoTotal = produto.preco * item.quantidade;
      console.log('Cálculo produto por unidade:', {
        nome: produto.nome,
        precoUn: produto.preco,
        quantidade: item.quantidade,
        precoTotal
      });
      return total + precoTotal;
    }, 0);
  };

  const adicionarFormaPagamento = () => {
    if (!novaFormaPagamento || novoValorPagamento <= 0) return;

    const novosPagamentos = [...pagamentosDivididos, {
      tipo: novaFormaPagamento,
      valor: novoValorPagamento
    }];

    setPagamentosDivididos(novosPagamentos);
    setNovoValorPagamento(0);
    setNovaFormaPagamento('');
  };

  const removerFormaPagamento = (index: number) => {
    setPagamentosDivididos(prev => prev.filter((_, i) => i !== index));
  };

  const calcularTotalPago = () => {
    const total = pagamentosDivididos.reduce((total, pag) => total + pag.valor, 0);
    // Arredonda para 2 casas decimais para evitar problemas de precisão
    return Number((Math.round(total * 100) / 100).toFixed(2));
  };

  const calcularValorRestante = () => {
    const totalPedido = Number(calcularTotal().toFixed(2));
    const totalPago = calcularTotalPago();
    // Arredonda para 2 casas decimais para evitar problemas de precisão
    return Number((totalPedido - totalPago).toFixed(2));
  };

  const calcularTotalComTaxas = () => {
    const subtotal = calcularTotal();
    if (formaPagamento === 'Vale Alimentação') {
      return subtotal * (1 + ACRESCIMO_ALIMENTACAO);
    }
    if (dividirPagamento) {
      const pagamentoVA = pagamentosDivididos.find(p => p.tipo === 'Vale Alimentação');
      if (pagamentoVA) {
        return subtotal + (pagamentoVA.valor * ACRESCIMO_ALIMENTACAO);
      }
    }
    return subtotal;
  };

  // Atualizar o display do total quando a forma de pagamento mudar
  useEffect(() => {
    if (formaPagamento === 'Vale Alimentação') {
      const subtotal = calcularTotal();
      const acrescimo = subtotal * ACRESCIMO_ALIMENTACAO;
      setNovoValorPagamento(subtotal + acrescimo);
    }
  }, [formaPagamento]);

  // Modificar a função finalizarPedido para atualizar corretamente os estados
  const finalizarPedido = () => {
    if (pedidoAtual.length === 0) return;

    let novaVenda: Venda;
    const totalPedido = calcularTotal();

    if (isIfoodPedido) {
      novaVenda = {
        id: Date.now().toString(),
        data: Date.now().toString(),
        itens: pedidoAtual,
        total: totalPedido,
        formaPagamento: 'Pago pelo App',
        status: 'CONCLUIDO'
      };
      setIfoodPedidos([...ifoodPedidos, ...pedidoAtual]);
      setPedidoAtual([]); // Limpa o pedido antes de sair do modo iFood
      setIfoodModal({produto: null, quantidade: 1, preco: 0, isOpen: false}); // Fecha o modal iFood
      setIsIfoodPedido(false); // Volta para balcão
      carregarProdutos(); // Volta para produtos normais
      window.location.reload(); // Recarrega a página após venda iFood
    } else if (mesaSelecionada) {
      // Venda de mesa
      novaVenda = {
        id: Date.now().toString(),
        data: Date.now().toString(),
        itens: pedidoAtual,
        total: totalPedido,
        formaPagamento: dividirPagamento 
          ? pagamentosDivididos.map(p => `${p.tipo}: R$ ${p.valor.toFixed(2)}`).join(' + ')
          : formaPagamento,
        status: 'CONCLUIDO'
      };
      // Atualizar pedidos da mesa
      const mesaAtualizada = {
        ...mesaSelecionada,
        pedidos: [],
        status: 'LIVRE' as const
      };
      atualizarMesa(mesaAtualizada);
      setMesaSelecionada(null);
    } else {
      // Venda de balcão
      novaVenda = {
        id: Date.now().toString(),
        data: Date.now().toString(),
        itens: pedidoAtual,
        total: totalPedido,
        formaPagamento: dividirPagamento 
          ? pagamentosDivididos.map(p => `${p.tipo}: R$ ${p.valor.toFixed(2)}`).join(' + ')
          : formaPagamento,
        status: 'CONCLUIDO'
      };
    }

    const vendasAtualizadas = [novaVenda, ...vendas];
    localStorage.setItem('vendas', JSON.stringify(vendasAtualizadas));
    setVendas(vendasAtualizadas);
    // Atualizar vendas do dia e resumo imediatamente
    const vendasDoDiaAtualizadas = filtrarVendasDoDia(vendasAtualizadas);
    setVendasDoDia(vendasDoDiaAtualizadas);
    const novoResumo = calcularResumoDia(vendasDoDiaAtualizadas);
    setResumoDia(novoResumo);

    setPedidoAtual([]);
    setFormaPagamento('');
    setDividirPagamento(false);
    setPagamentosDivididos([]);
    setIsIfoodPedido(false);
  };

  const cancelarVenda = (vendaId: string) => {
    if (confirm('Tem certeza que deseja cancelar esta venda? Ela será removida permanentemente.')) {
      try {
        // Remove a venda do estado
        const vendasAtualizadas = vendas.filter(venda => venda.id !== vendaId);
        
        // Atualiza o localStorage
        localStorage.setItem('vendas', JSON.stringify(vendasAtualizadas));
        
        // Atualiza os estados
        setVendas(vendasAtualizadas);
        setVendasDoDia(filtrarVendasDoDia(vendasAtualizadas));

        // Feedback visual
        alert('Venda cancelada com sucesso!');
      } catch (error) {
        console.error('Erro ao cancelar venda:', error);
        alert('Erro ao cancelar venda. Por favor, tente novamente.');
      }
    }
  };

  const atualizarFormaPagamento = (vendaId: string, novaFormaPagamento: string, pagamentosDivididos: FormaPagamentoSplit[] = []) => {
    const vendasAtualizadas = vendas.map(venda => {
      if (venda.id === vendaId) {
        const formaPagamentoFinal = pagamentosDivididos.length > 0
          ? pagamentosDivididos.map(p => `${p.tipo}: R$ ${p.valor.toFixed(2)}`).join(' + ')
          : novaFormaPagamento;
        return { ...venda, formaPagamento: formaPagamentoFinal };
      }
      return venda;
    });
    
    localStorage.setItem('vendas', JSON.stringify(vendasAtualizadas));
    setVendas(vendasAtualizadas);
    setEditPagamentoModal({
      isOpen: false,
      venda: null,
      novaFormaPagamento: '',
      dividirPagamento: false,
      pagamentosDivididos: [],
      novoValorPagamento: 0
    });
  };

  const selecionarMesa = (mesa: Mesa) => {
    setMesaSelecionada(mesa);
    setPedidoAtual(mesa.pedidos || []);
  };

  const atualizarMesa = (mesaAtualizada: Mesa) => {
    const mesasAtualizadas = mesas.map(m => 
      m.numero === mesaAtualizada.numero ? mesaAtualizada : m
    );
    localStorage.setItem('mesas', JSON.stringify(mesasAtualizadas));
    setMesas(mesasAtualizadas);
  };

  const finalizarPedidoMesa = () => {
    if (!mesaSelecionada || !pedidoAtual?.length) return;

    const mesaAtualizada = {
      ...mesaSelecionada,
      pedidos: pedidoAtual,
      status: 'OCUPADA' as const
    };

    atualizarMesa(mesaAtualizada);
    setMesaSelecionada(null);
    setPedidoAtual([]);
  };

  const fecharMesa = (mesa: Mesa) => {
    if (!mesa.pedidos?.length) {
      alert('Esta mesa não possui pedidos para fechar.');
      return;
    }

    selecionarMesa(mesa);
  };

  const pagarMesa = (mesa: Mesa) => {
    // Buscar a mesa mais atualizada pelo número
    const mesaAtual = mesas.find(m => m.numero === mesa.numero);
    if (!mesaAtual || !mesaAtual.pedidos?.length) {
      alert('Esta mesa não possui pedidos para pagar.');
      return;
    }

    if (!formaPagamento && !dividirPagamento) {
      alert('Selecione uma forma de pagamento.');
      return;
    }

    if (dividirPagamento) {
      const totalPago = calcularTotalPago();
      // Calcular o total dos pedidos da mesa
      const totalPedidoMesa = mesaAtual.pedidos.reduce((total, item) => {
        const produto = item.produto;
        if (produto.tipovenda === 'kg' && produto.peso) {
          const pesoEmKg = produto.peso / 1000;
          return total + (produto.preco * pesoEmKg * item.quantidade);
        }
        return total + (produto.preco * item.quantidade);
      }, 0);
      if (Math.abs(totalPago - totalPedidoMesa) > 0.01) {
        alert('O valor total dos pagamentos deve ser igual ao valor do pedido');
        return;
      }
    }

    // Calcular o total dos pedidos da mesa
    const totalMesa = mesaAtual.pedidos.reduce((total, item) => {
      const produto = item.produto;
      if (produto.tipovenda === 'kg' && produto.peso) {
        const pesoEmKg = produto.peso / 1000;
        return total + (produto.preco * pesoEmKg * item.quantidade);
      }
      return total + (produto.preco * item.quantidade);
    }, 0);
    console.log('DEBUG PAGAR MESA', { mesaAtual, totalMesa, pagamentosDivididos, formaPagamento });

    // Criar nova venda
    const novaVenda: Venda = {
      id: Date.now().toString(),
      data: Date.now().toString(),
      itens: mesaAtual.pedidos,
      total: totalMesa,
      formaPagamento: dividirPagamento 
        ? pagamentosDivididos.map(p => `${p.tipo}: R$ ${p.valor.toFixed(2)}`).join(' + ')
        : formaPagamento,
      status: 'CONCLUIDO'
    };

    // Adicionar venda ao histórico
    const vendasAtualizadas = [novaVenda, ...vendas];
    localStorage.setItem('vendas', JSON.stringify(vendasAtualizadas));
    setVendas(vendasAtualizadas);

    // Liberar a mesa
    const mesaAtualizada = {
      ...mesaAtual,
      status: 'LIVRE' as const,
      pedidos: []
    };
    atualizarMesa(mesaAtualizada);

    // Limpar estados
    setMesaSelecionada(null);
    setPedidoAtual([]);
    setFormaPagamento('');
    setDividirPagamento(false);
    setPagamentosDivididos([]);
  };

  // Modificar o componente de renderização dos produtos
  const renderizarProdutos = () => {
    if (!produtosFiltrados?.length) {
      return (
        <div className="text-center py-8 text-gray-500">
          {termoBusca.trim() 
            ? `Nenhum produto encontrado para "${termoBusca}"`
            : categoriaSelecionada !== 'Todas'
              ? `Nenhum produto encontrado na categoria "${categoriaSelecionada}"`
              : 'Nenhum produto cadastrado'}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-4 gap-2">
        {produtosFiltrados.map(produto => (
          <div
            key={produto.id}
            onClick={() => handleProdutoClick(produto)}
            className="bg-white border rounded p-2 cursor-pointer hover:bg-gray-50"
          >
            <div className="flex flex-col">
              <div className="text-sm font-medium">{produto.nome}</div>
              <div className="text-xs text-gray-500">{produto.categoria}</div>
              <div className="text-sm text-blue-600">
                R$ {produto.preco.toFixed(2)}/{produto.tipovenda}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Renderização do item no pedido
  const renderizarItemPedido = (item: ItemPedido) => {
    const produto = item.produto;
    let descricao = '';
    let valorTotal = 0;

    if (produto.tipovenda === 'kg' && produto.peso) {
      const pesoEmKg = produto.peso / 1000;
      valorTotal = produto.preco * pesoEmKg * item.quantidade;
      descricao = `${produto.peso}g x ${item.quantidade} = R$ ${valorTotal.toFixed(2)}`;
    } else {
      valorTotal = produto.preco * item.quantidade;
      descricao = `R$ ${produto.preco.toFixed(2)} x ${item.quantidade} = R$ ${valorTotal.toFixed(2)}`;
    }

    return (
      <div key={`${produto.id}-${produto.peso || ''}`} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border">
        <div>
          <h3 className="font-medium">{produto.nome}</h3>
          <p className="text-sm text-gray-500">{descricao}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => atualizarQuantidade(item, item.quantidade - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            -
          </button>
          <span className="w-8 text-center">{item.quantidade}</span>
          <button
            onClick={() => atualizarQuantidade(item, item.quantidade + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            +
          </button>
        </div>
      </div>
    );
  };

  // Função para calcular o resumo do dia
  const calcularResumoDia = (vendasDia: Venda[]) => {
    const resumo = {
      dinheiro: 0,
      pix: 0,
      debito: 0,
      credito: 0,
      alimentacao: 0,
      ifood: 0,
      total: 0
    };

    vendasDia.forEach(venda => {
      if (typeof venda.formaPagamento === 'string' && venda.formaPagamento.includes('+')) {
        // Pagamento dividido
        const pagamentos = venda.formaPagamento.split(' + ');
        pagamentos.forEach(pagamento => {
          const [tipoPagamento, valorStr] = pagamento.split(': R$ ');
          const valor = parseFloat(valorStr);
          const tipoLower = tipoPagamento.toLowerCase();
          if (!isNaN(valor)) {
            if (tipoLower.includes('dinheiro')) resumo.dinheiro += valor;
            else if (tipoLower.includes('pix')) resumo.pix += valor;
            else if (tipoLower.includes('débito')) resumo.debito += valor;
            else if (tipoLower.includes('crédito')) resumo.credito += valor;
            else if (tipoLower.includes('alimentação')) resumo.alimentacao += valor;
            else if (tipoLower.includes('pago pelo app') || tipoLower.includes('ifood')) resumo.ifood += valor;
          }
        });
      } else if (typeof venda.formaPagamento === 'string') {
        const valor = typeof venda.total === 'number' ? venda.total : 0;
        const tipoLower = venda.formaPagamento.toLowerCase();
        if (tipoLower.includes('dinheiro')) resumo.dinheiro += valor;
        else if (tipoLower.includes('pix')) resumo.pix += valor;
        else if (tipoLower.includes('débito')) resumo.debito += valor;
        else if (tipoLower.includes('crédito')) resumo.credito += valor;
        else if (tipoLower.includes('alimentação')) resumo.alimentacao += valor;
        else if (tipoLower.includes('pago pelo app') || tipoLower.includes('ifood')) resumo.ifood += valor;
      }
      resumo.total += typeof venda.total === 'number' ? venda.total : 0;
    });

    return resumo;
  };

  // Atualizar o resumo quando as vendas do dia mudarem
  useEffect(() => {
    const novoResumo = calcularResumoDia(vendasDoDia);
    setResumoDia(novoResumo);
  }, [vendasDoDia]);

  // 3. Ao selecionar iFood, exibir apenas produtosIfood
  useEffect(() => {
    if (isIfoodPedido && !ifoodModal.isOpen) {
      setProdutos(produtosIfood);
      setCategorias(['Todas', ...Array.from(new Set(produtosIfood.map(p => p.categoria)))]);
    } else if (!isIfoodPedido && !ifoodModal.isOpen) {
      carregarProdutos();
    }
  }, [isIfoodPedido, ifoodModal.isOpen]);

  // Opcional: resetar valorRecebido ao finalizar pedido
  useEffect(() => {
    if (pedidoAtual.length === 0) setValorRecebido(0);
  }, [pedidoAtual]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-50 to-amber-100 shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Image 
                src="/images/logo.png" 
                alt="Logo" 
                width={80} 
                height={80} 
                className="rounded-lg shadow-2xl hover:shadow-2xl transition-shadow duration-300"
                style={{ 
                  filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))',
                  boxShadow: '0 0 15px rgba(0, 0, 0, 0.7)'
                }}
              />
              <Image
                src="/images/Panificadora Elite.png"
                alt="Panificadora Elite"
                width={260}
                height={80}
                className="ml-2"
              />
            </div>
            <nav className="flex gap-2">
              {/* Remover o link de Fechamento de Caixa */}
              {/* <Link href="/fechamento-caixa" className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2 rounded hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-md">Fechamento de Caixa</Link> */}
              <Link href="/controle-financeiro" className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2 rounded hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-md">Controle Financeiro</Link>
              <Link href="/configuracoes" className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2 rounded hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-md">Configurações</Link>
              <Link href="/sair" className="text-red-600 hover:text-red-700 font-medium">Sair</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen px-2 py-6">
        <div className="flex gap-4" ref={containerRef}>
          {/* Mesas Column */}
          <div className="w-56">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Mesas</h2>
              <div className="space-y-3">
                {mesas.slice(0, 5).map(mesa => (
                  <div
                    key={mesa.numero}
                    className={`w-full p-3 rounded-lg shadow-sm ${
                      mesa.status === 'LIVRE' 
                        ? 'bg-green-100 hover:bg-green-200' 
                        : 'bg-yellow-100 hover:bg-yellow-200'
                    } ${mesaSelecionada?.numero === mesa.numero ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div 
                      onClick={() => {
                        setMesaSelecionada(mesa);
                        setPedidoAtual(mesa.pedidos || []);
                        setIsIfoodPedido(false);
                      }}
                      className="cursor-pointer"
                    >
                      <div className="text-lg font-medium">Mesa {mesa.numero}</div>
                      <div className="text-sm text-gray-600">{mesa.status}</div>
                      {mesa.status === 'OCUPADA' && (
                        <div className="text-sm mt-1">
                          {mesa.pedidos?.length || 0} itens
                        </div>
                      )}
                    </div>
                    {mesa.status === 'OCUPADA' && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => fecharMesa(mesa)}
                          className="flex-1 text-sm bg-gradient-to-r from-amber-600 to-amber-700 text-white px-2 py-1 rounded hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-md"
                        >
                          Fechar Mesa
                        </button>
                        <button
                          onClick={() => pagarMesa(mesa)}
                          className="flex-1 text-sm bg-gradient-to-r from-green-600 to-green-700 text-white px-2 py-1 rounded hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-md"
                        >
                          Pagar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {/* Card iFood */}
                <div
                  className={`w-full p-3 rounded-lg shadow-sm bg-yellow-50 hover:bg-yellow-100 cursor-pointer`}
                  onClick={() => {
                    setMesaSelecionada(null);
                    setPedidoAtual([]); // Começa um novo pedido iFood
                    setIsIfoodPedido(true);
                    setFormaPagamento('Pago pelo App');
                    setDividirPagamento(false);
                    setPagamentosDivididos([]);
                  }}
                >
                  <div className="text-lg font-medium">iFood</div>
                  <div className="text-sm text-gray-600">
                    {ifoodPedidos.length === 0 ? 'Nenhum pedido' : `${ifoodPedidos.length} itens`}
                  </div>
                  <div className="text-xs text-green-700 mt-1">Pago pelo App</div>
                </div>
              </div>
            </div>
          </div>

          {/* Produtos Column */}
          <div className="w-[38%]">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Produtos</h2>
                <button
                  onClick={() => setProdutoAvulsoModal({ ...produtoAvulsoModal, isOpen: true })}
                  className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-3 py-1 rounded text-sm hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-md"
                >
                  + Avulso
                </button>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Digite o código, código de barras ou nome do produto..."
                    value={termoBusca}
                    onChange={handleSearchInput}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && produtosFiltrados.length === 1) {
                        handleProdutoClick(produtosFiltrados[0]);
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2 border rounded"
                    ref={searchInputRef}
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex gap-1 overflow-x-auto mb-4 pb-2">
                {categorias.map(categoria => (
                  <button
                    key={categoria}
                    onClick={() => setCategoriaSelecionada(categoria)}
                    className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                      categoriaSelecionada === categoria
                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    {categoria}
                  </button>
                ))}
              </div>

              <div className="overflow-y-auto" style={{ height: 'calc(100vh - 300px)' }}>
                {renderizarProdutos()}
              </div>
            </div>
          </div>

          {/* Pedido Atual Column */}
          <div className="w-[28%] relative">
            <div className="bg-white rounded-lg shadow p-4 flex flex-col h-[calc(100vh-120px)] relative">
              {/* Botão para voltar ao balcão */}
              {mesaSelecionada && (
                <button
                  onClick={() => {
                    setMesaSelecionada(null);
                    setPedidoAtual([]);
                    setIsIfoodPedido(false);
                  }}
                  className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl"
                  title="Voltar para Balcão"
                >
                  ×
                </button>
              )}
              <h2 className="text-lg font-semibold mb-4">
                {isIfoodPedido ? 'Pedido - iFood' : mesaSelecionada ? `Pedido - Mesa ${mesaSelecionada.numero}` : 'Pedido Balcão'}
              </h2>
              
              <div className="flex-1 flex flex-col">
                {!pedidoAtual?.length ? (
                  <p className="text-gray-500 text-center py-4">Nenhum item no pedido</p>
                ) : (
                  <div className="flex-1 flex flex-col">
                    {/* Lista de Itens - altura máxima ajustada */}
                    <div className="flex-1 overflow-y-auto mb-4">
                      {pedidoAtual.map(item => renderizarItemPedido(item))}
                    </div>

                    {/* Seção de Total e Pagamento - sempre visível */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center text-lg font-medium mb-4">
                        <span>Total</span>
                        <div className="text-right">
                          <span className="text-blue-600">R$ {calcularTotalComTaxas().toFixed(2)}</span>
                          {(formaPagamento === 'Vale Alimentação' || pagamentosDivididos.some(p => p.tipo === 'Vale Alimentação')) && (
                            <div className="text-xs text-gray-500">
                              (Inclui 8% de taxa VA)
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm">Forma de Pagamento</h3>
                          <button
                            onClick={() => setDividirPagamento(!dividirPagamento)}
                            className="text-sm text-blue-500 hover:text-blue-600"
                          >
                            {dividirPagamento ? 'Pagamento Único' : 'Dividir Pagamento'}
                          </button>
                        </div>

                        {!dividirPagamento && (
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            {['Dinheiro', 'PIX', 'Cartão de Débito', 'Cartão de Crédito', 'Vale Alimentação'].map((forma) => (
                              <button
                                key={forma}
                                type="button"
                                onClick={() => setFormaPagamento(forma)}
                                className={`p-2 rounded text-sm w-full ${
                                  formaPagamento === forma
                                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md'
                                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                }`}
                              >
                                {forma}
                                {forma === 'Vale Alimentação' && (
                                  <span className="block text-xs">(+8%)</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {dividirPagamento && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              {['Dinheiro', 'PIX', 'Cartão de Débito', 'Cartão de Crédito', 'Vale Alimentação'].map((forma) => (
                                <button
                                  key={forma}
                                  type="button"
                                  onClick={() => setNovaFormaPagamento(forma)}
                                  className={`p-2 rounded text-sm w-full ${
                                    novaFormaPagamento === forma
                                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md'
                                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                  }`}
                                >
                                  {forma}
                                  {forma === 'Vale Alimentação' && (
                                    <span className="block text-xs">(+8%)</span>
                                  )}
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                value={novoValorPagamento || ''}
                                onChange={(e) => {
                                  const valorBase = parseFloat(e.target.value) || 0;
                                  setNovoValorPagamento(
                                    novaFormaPagamento === 'Vale Alimentação' ? Number((valorBase * 1.08).toFixed(2)) : valorBase
                                  );
                                }}
                                placeholder="Valor"
                                className="flex-1 p-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <button
                                onClick={adicionarFormaPagamento}
                                disabled={!novaFormaPagamento || novoValorPagamento <= 0}
                                className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                              >
                                Adicionar
                              </button>
                            </div>
                            {pagamentosDivididos.length > 0 && (
                              <div className="space-y-1">
                                {pagamentosDivididos.map((pagamento, index) => (
                                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                    <div className="text-sm">
                                      <span className="font-medium">{pagamento.tipo}</span>
                                      <span className="text-gray-500 ml-2">R$ {pagamento.valor.toFixed(2)}</span>
                                    </div>
                                    <button
                                      onClick={() => removerFormaPagamento(index)}
                                      className="text-red-500 hover:text-red-600 text-sm"
                                    >
                                      Remover
                                    </button>
                                  </div>
                                ))}
                                <div className="text-sm text-gray-500 flex justify-between pt-1">
                                  <span>Total pago: R$ {pagamentosDivididos.reduce((total, pag) => total + pag.valor, 0).toFixed(2)}</span>
                                  <span>Restante: R$ {(calcularTotal() - pagamentosDivididos.reduce((total, pag) => total + pag.valor, 0)).toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Observações
                          </label>
                          <textarea
                            className="w-full p-2 border rounded text-sm"
                            rows={2}
                            placeholder="Ex: Sem cebola, bem passado..."
                          />
                        </div>

                        {formaPagamento === 'Dinheiro' && (
                          <div className="mt-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Recebido</label>
                            <input
                              type="number"
                              min={calcularTotalComTaxas()}
                              step="0.01"
                              value={valorRecebido || ''}
                              onChange={e => setValorRecebido(parseFloat(e.target.value) || 0)}
                              className="w-full p-2 border rounded text-sm"
                              placeholder={`R$ ${calcularTotalComTaxas().toFixed(2)}`}
                            />
                            <div className="text-green-700 font-bold mt-1 text-sm">
                              Troco: R$ {valorRecebido > 0 ? (valorRecebido - calcularTotalComTaxas()).toFixed(2) : '0.00'}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={isIfoodPedido ? finalizarPedido : mesaSelecionada ? finalizarPedidoMesa : finalizarPedido}
                          disabled={
                            pedidoAtual.length === 0 ||
                            (isIfoodPedido || !mesaSelecionada
                              ? (formaPagamento === 'Dinheiro' ? valorRecebido < calcularTotalComTaxas() : false) ||
                                (dividirPagamento 
                                  ? Math.abs(calcularTotalPago() - calcularTotal()) > 0.01
                                  : !formaPagamento)
                              : false)
                          }
                          className={`${isIfoodPedido ? 'bg-green-600 hover:bg-green-700' : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800'} w-full mt-2 text-white py-2 rounded font-medium transition-all duration-300 shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed`}
                        >
                          {isIfoodPedido ? 'Finalizar Pedido iFood' : mesaSelecionada ? 'Salvar Pedido na Mesa' : 'Finalizar Pedido'}
                        </button>
                        {mesaSelecionada && (
                          <button
                            onClick={() => pagarMesa(mesaSelecionada)}
                            disabled={
                              pedidoAtual.length === 0 || 
                              (dividirPagamento 
                                ? Math.abs(calcularTotalPago() - calcularTotal()) > 0.01
                                : !formaPagamento)
                            }
                            className="w-1/2 mt-2 bg-gradient-to-r from-green-600 to-green-700 text-white py-2 rounded font-medium hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-md disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed ml-2"
                          >
                            Pagar Mesa
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Histórico de Vendas Column */}
          <div className="w-[28%]">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Vendas do Dia</h2>
                <span className="text-sm text-amber-600">{new Date().toLocaleDateString()}</span>
              </div>
              
              <div className="space-y-3 overflow-y-auto" style={{ height: 'calc(100vh - 300px)' }}>
                {vendasDoDia.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Nenhuma venda realizada hoje</p>
                ) : (
                  vendasDoDia.map(venda => (
                    <div key={venda.id} className="border-b pb-3 last:border-0">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">#{venda.id}</span>
                            <span className="text-sm text-gray-500">
                              {new Date(Number(venda.data)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-sm">
                            {venda.itens?.map(item => {
                              const produto = item.produto;
                              let valorTotal = 0;
                              if (produto.tipovenda === 'kg' && produto.peso) {
                                const pesoEmKg = produto.peso / 1000;
                                valorTotal = produto.preco * pesoEmKg * item.quantidade;
                              } else {
                                valorTotal = produto.preco * item.quantidade;
                              }
                              return (
                                <div key={`${produto.id}-${produto.nome}-${produto.peso}`} className="truncate">
                                  {item.quantidade}x {produto.nome}
                                  {produto.peso ? ` (${produto.peso}g)` : ''}
                                  {" - R$ " + valorTotal.toFixed(2)}
                                </div>
                              );
                            })}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            <div>Pagamento: {venda.formaPagamento}</div>
                            {venda.taxas && venda.taxas.length > 0 && (
                              <div className="text-xs text-gray-500">
                                Taxas: {venda.taxas.map(taxa => 
                                  `${taxa.tipo} (${taxa.percentual}%): R$ ${taxa.valor.toFixed(2)}`
                                ).join(', ')}
                              </div>
                            )}
                            {venda.acrescimoAlimentacao && venda.acrescimoAlimentacao > 0 && (
                              <div className="text-xs text-green-600">
                                Acréscimo VA (8%): +R$ {venda.acrescimoAlimentacao?.toFixed(2)}
                              </div>
                            )}
                            {venda.valorLiquido !== undefined && (
                              <div className="text-xs font-medium text-amber-600">
                                Valor Líquido: R$ {typeof venda.valorLiquido === 'number' ? venda.valorLiquido.toFixed(2) : '0.00'}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-medium whitespace-nowrap">
                            R$ {typeof venda.total === 'number' ? venda.total.toFixed(2) : '0.00'}
                          </div>
                          <button
                            onClick={() => cancelarVenda(venda.id)}
                            className="text-red-600 text-sm hover:text-red-700 mt-1"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => setEditPagamentoModal({
                              isOpen: true,
                              venda: venda,
                              novaFormaPagamento: '',
                              dividirPagamento: false,
                              pagamentosDivididos: [],
                              novoValorPagamento: 0
                            })}
                            className="text-blue-600 text-sm hover:text-blue-700 mt-1 ml-2"
                          >
                            Editar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {produtoAvulsoModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h3 className="text-lg font-medium mb-4">Adicionar Pedido Avulso</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Produto/Pedido
                </label>
                <input
                  type="text"
                  value={produtoAvulsoModal.nome}
                  onChange={(e) => setProdutoAvulsoModal({
                    ...produtoAvulsoModal,
                    nome: e.target.value
                  })}
                  className="w-full p-2 border rounded"
                  placeholder="Ex: Pedido especial, Combo personalizado..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={produtoAvulsoModal.preco}
                    onChange={(e) => setProdutoAvulsoModal({
                      ...produtoAvulsoModal,
                      preco: parseFloat(e.target.value) || 0
                    })}
                    className="w-full p-2 border rounded"
                    placeholder="R$ 0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={produtoAvulsoModal.quantidade}
                    onChange={(e) => setProdutoAvulsoModal({
                      ...produtoAvulsoModal,
                      quantidade: parseInt(e.target.value) || 1
                    })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={produtoAvulsoModal.observacao}
                  onChange={(e) => setProdutoAvulsoModal({
                    ...produtoAvulsoModal,
                    observacao: e.target.value
                  })}
                  rows={3}
                  className="w-full p-2 border rounded"
                  placeholder="Detalhes adicionais do pedido..."
                />
              </div>
              <div className="pt-2">
                <p className="text-sm text-gray-500">
                  Total: R$ {(produtoAvulsoModal.preco * produtoAvulsoModal.quantidade).toFixed(2)}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setProdutoAvulsoModal({
                    isOpen: false,
                    nome: '',
                    preco: 0,
                    quantidade: 1,
                    observacao: ''
                  })}
                  className="px-4 py-2 text-gray-600 hover:text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (produtoAvulsoModal.nome && produtoAvulsoModal.preco > 0) {
                      const produtoAvulso: Produto = {
                        id: Date.now(),
                        nome: produtoAvulsoModal.nome,
                        categoria: 'Avulso',
                        preco: produtoAvulsoModal.preco,
                        tipovenda: 'un'
                      };
                      
                      // Adicionar a quantidade especificada
                      setPedidoAtual(prev => [...prev, {
                        produto: produtoAvulso,
                        quantidade: produtoAvulsoModal.quantidade
                      }]);

                      // Resetar o modal
                      setProdutoAvulsoModal({
                        isOpen: false,
                        nome: '',
                        preco: 0,
                        quantidade: 1,
                        observacao: ''
                      });
                    }
                  }}
                  disabled={!produtoAvulsoModal.nome || produtoAvulsoModal.preco <= 0}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Adicionar ao Pedido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pesoModal.isOpen && pesoModal.produto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h3 className="text-lg font-medium mb-4">
              Informar peso - {pesoModal.produto.nome}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peso em gramas
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={pesoModal.peso || ''}
                    onChange={(e) => setPesoModal({
                      ...pesoModal,
                      peso: parseFloat(e.target.value) || 0
                    })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && pesoModal.peso > 0) {
                        e.preventDefault();
                        adicionarProdutoComPeso();
                      } else if (e.key === 'Escape') {
                        setPesoModal({
                          isOpen: false,
                          produto: null,
                          peso: 0
                        });
                      }
                    }}
                    autoFocus
                    className="flex-1 p-2 border rounded"
                    placeholder="Ex: 250"
                  />
                  <span className="text-gray-500">g</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Valor: R$ {((pesoModal.peso / 1000) * pesoModal.produto.preco).toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Pressione Enter para adicionar ou Esc para cancelar
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setPesoModal({
                    isOpen: false,
                    produto: null,
                    peso: 0
                  })}
                  className="px-4 py-2 text-gray-600 hover:text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={adicionarProdutoComPeso}
                  disabled={pesoModal.peso <= 0}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add new modal for editing payment method */}
      {editPagamentoModal.isOpen && editPagamentoModal.venda && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h3 className="text-lg font-medium mb-4">Alterar Forma de Pagamento</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Forma de Pagamento</h3>
                <button
                  onClick={() => setEditPagamentoModal(prev => ({
                    ...prev,
                    dividirPagamento: !prev.dividirPagamento,
                    pagamentosDivididos: [],
                    novaFormaPagamento: ''
                  }))}
                  className="text-sm text-blue-500 hover:text-blue-600"
                >
                  {editPagamentoModal.dividirPagamento ? 'Pagamento Único' : 'Dividir Pagamento'}
                </button>
              </div>

              {!editPagamentoModal.dividirPagamento ? (
                // Pagamento único
                <select
                  value={editPagamentoModal.novaFormaPagamento}
                  onChange={(e) => setEditPagamentoModal(prev => ({
                    ...prev,
                    novaFormaPagamento: e.target.value
                  }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Selecione a forma de pagamento</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="PIX">PIX</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                </select>
              ) : (
                // Pagamento dividido
                <div className="space-y-3">
                  {/* Lista de pagamentos adicionados */}
                  {editPagamentoModal.pagamentosDivididos.length > 0 && (
                    <div className="space-y-2">
                      {editPagamentoModal.pagamentosDivididos.map((pagamento, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="text-sm">
                            <span className="font-medium">{pagamento.tipo}</span>
                            <span className="text-gray-500 ml-2">R$ {pagamento.valor.toFixed(2)}</span>
                          </div>
                          <button
                            onClick={() => setEditPagamentoModal(prev => ({
                              ...prev,
                              pagamentosDivididos: prev.pagamentosDivididos.filter((_, i) => i !== index)
                            }))}
                            className="text-red-500 hover:text-red-600 text-sm"
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                      <div className="text-sm text-gray-500 flex justify-between pt-1">
                        <span>Total pago: R$ {editPagamentoModal.pagamentosDivididos.reduce((total, pag) => total + pag.valor, 0).toFixed(2)}</span>
                        <span>Restante: R$ {typeof editPagamentoModal.venda?.total === 'number' ? (editPagamentoModal.venda.total - editPagamentoModal.pagamentosDivididos.reduce((total, pag) => total + pag.valor, 0)).toFixed(2) : '0.00'}</span>
                      </div>
                    </div>
                  )}

                  {/* Formulário para adicionar novo pagamento */}
                  <div className="space-y-2">
                    <select
                      value={editPagamentoModal.novaFormaPagamento}
                      onChange={(e) => setEditPagamentoModal(prev => ({
                        ...prev,
                        novaFormaPagamento: e.target.value
                      }))}
                      className="w-full p-2 border rounded text-sm"
                    >
                      <option value="">Selecione a forma de pagamento</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="PIX">PIX</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                    </select>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={editPagamentoModal.novoValorPagamento || ''}
                        onChange={(e) => setEditPagamentoModal(prev => ({
                          ...prev,
                          novoValorPagamento: parseFloat(e.target.value) || 0
                        }))}
                        placeholder="Valor"
                        className="flex-1 p-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => {
                          if (editPagamentoModal.novaFormaPagamento && editPagamentoModal.novoValorPagamento > 0) {
                            setEditPagamentoModal(prev => ({
                              ...prev,
                              pagamentosDivididos: [
                                ...prev.pagamentosDivididos,
                                {
                                  tipo: prev.novaFormaPagamento,
                                  valor: prev.novoValorPagamento
                                }
                              ],
                              novaFormaPagamento: '',
                              novoValorPagamento: 0
                            }));
                          }
                        }}
                        disabled={!editPagamentoModal.novaFormaPagamento || editPagamentoModal.novoValorPagamento <= 0}
                        className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setEditPagamentoModal({
                    isOpen: false,
                    venda: null,
                    novaFormaPagamento: '',
                    dividirPagamento: false,
                    pagamentosDivididos: [],
                    novoValorPagamento: 0
                  })}
                  className="px-4 py-2 text-gray-600 hover:text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (editPagamentoModal.dividirPagamento && editPagamentoModal.venda) {
                      const totalPago = editPagamentoModal.pagamentosDivididos.reduce((total, pag) => total + pag.valor, 0);
                      if (totalPago !== editPagamentoModal.venda.total) {
                        alert('O valor total dos pagamentos deve ser igual ao valor do pedido');
                        return;
                      }
                      atualizarFormaPagamento(editPagamentoModal.venda.id, '', editPagamentoModal.pagamentosDivididos);
                    } else if (editPagamentoModal.venda) {
                      atualizarFormaPagamento(editPagamentoModal.venda.id, editPagamentoModal.novaFormaPagamento);
                    }
                  }}
                  disabled={
                    editPagamentoModal.dividirPagamento
                      ? editPagamentoModal.pagamentosDivididos.reduce((total, pag) => total + pag.valor, 0) !== editPagamentoModal.venda.total
                      : !editPagamentoModal.novaFormaPagamento
                  }
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Salvar Alteração
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumo do Dia */}
      <div className="w-56">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Resumo do Dia</h2>
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-700">Dinheiro</div>
              <div className="text-xl font-bold text-blue-600">R$ {resumoDia.dinheiro.toFixed(2)}</div>
              <div className="text-xs text-blue-500">
                Saldo em Caixa: R$ {resumoDia.dinheiro.toFixed(2)}
              </div>
            </div>

            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-green-700">PIX</div>
              <div className="text-xl font-bold text-green-600">R$ {resumoDia.pix.toFixed(2)}</div>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-purple-700">Cartão de Débito</div>
              <div className="text-xl font-bold text-purple-600">R$ {resumoDia.debito.toFixed(2)}</div>
              <div className="text-xs text-purple-500">Taxa: 2%</div>
            </div>

            <div className="bg-indigo-50 p-3 rounded-lg">
              <div className="text-sm text-indigo-700">Cartão de Crédito</div>
              <div className="text-xl font-bold text-indigo-600">R$ {resumoDia.credito.toFixed(2)}</div>
              <div className="text-xs text-indigo-500">Taxa: 4.36%</div>
            </div>

            <div className="bg-amber-50 p-3 rounded-lg">
              <div className="text-sm text-amber-700">Vale Alimentação</div>
              <div className="text-xl font-bold text-amber-600">R$ {resumoDia.alimentacao.toFixed(2)}</div>
              <div className="text-xs text-amber-500">Acréscimo: 8%</div>
            </div>

            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-sm text-red-700">iFood</div>
              <div className="text-xl font-bold text-red-600">R$ {resumoDia.ifood.toFixed(2)}</div>
              <div className="text-xs text-red-500">Pago pelo App</div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total em Vendas</span>
                <span className="text-xl font-bold">R$ {resumoDia.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Modal para preço iFood */}
      {ifoodModal.isOpen && ifoodModal.produto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h3 className="text-lg font-medium mb-4">Adicionar {ifoodModal.produto.nome} (iFood)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço</label>
                <input
                  type="number"
                  step="0.01"
                  value={ifoodModal.preco || ''}
                  onChange={e => setIfoodModal(m => ({...m, preco: parseFloat(e.target.value) || 0}))}
                  className="w-full p-2 border rounded"
                  placeholder="R$ 0,00"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  value={ifoodModal.quantidade}
                  onChange={e => setIfoodModal(m => ({...m, quantidade: parseInt(e.target.value) || 1}))}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIfoodModal({produto: null, quantidade: 1, preco: 0, isOpen: false})}
                  className="px-4 py-2 text-gray-600 hover:text-gray-700"
                >Cancelar</button>
                <button
                  onClick={() => {
                    if (ifoodModal.produto && ifoodModal.preco > 0) {
                      adicionarProduto({...ifoodModal.produto, preco: ifoodModal.preco});
                      setIfoodModal({produto: null, quantidade: 1, preco: 0, isOpen: false});
                    }
                  }}
                  disabled={ifoodModal.preco <= 0}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >Adicionar ao Pedido</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
