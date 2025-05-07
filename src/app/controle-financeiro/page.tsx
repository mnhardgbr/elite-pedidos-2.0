'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { Venda } from '../../types/Venda';

interface Movimentacao {
  id: string;
  data: string;
  tipo: 'entrada' | 'saida';
  categoria: string;
  descricao: string;
  valor: number;
  formaPagamento?: string;
  responsavel: string;
}

interface ResumoFinanceiro {
  data: string;
  trocoInicial: number;
  entradas: {
    vendas: {
      mesas: number;
      delivery: number;
      balcao: number;
    };
    reforcoCaixa: number;
    outrasEntradas: number;
  };
  saidas: {
    despesas: {
      insumos: number;
      utilidades: number;
      funcionarios: number;
    };
    retiradas: number;
    trocoDevolvido: number;
  };
  faturamento: number;
  custos: number;
  lucro: number;
  saldoAtual: number;
}

export default function ControleFinanceiro() {
  const [dataAtual] = useState(new Date().toLocaleDateString('pt-BR'));
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('todas');
  const [saldoInicial, setSaldoInicial] = useState(0);
  const [vendas, setVendas] = useState<Venda[]>([
    // TESTE: Vendas do mês anterior
    {
      id: 'v1',
      data: (new Date(2025, 2, 15, 10, 0, 0).getTime()).toString(), // 15/03/2025
      formaPagamento: 'Dinheiro',
      total: 80.00
    },
    {
      id: 'v2',
      data: (new Date(2025, 2, 16, 15, 30, 0).getTime()).toString(), // 16/03/2025
      formaPagamento: 'Cartão',
      total: 120.00
    },
    {
      id: 'v3',
      data: (new Date(2025, 2, 17, 18, 45, 0).getTime()).toString(), // 17/03/2025
      formaPagamento: 'PIX',
      total: 60.00
    },
    // ...vendas reais do localStorage serão carregadas normalmente
  ]);
  const [faturamento, setFaturamento] = useState(0);
  const [valorIfood, setValorIfood] = useState(0);

  const categoriasEntrada = [
    'Venda Mesa',
    'Venda Delivery',
    'Venda Balcão',
    'Troco Inicial',
    'Reforço de Caixa',
    'Entrada Manual'
  ];

  const categoriasSaida = [
    'Insumos',
    'Utilidades',
    'Salários',
    'Retirada',
    'Troco Devolvido',
    'Outras Despesas'
  ];

  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([
    {
      id: '1',
      data: '29/04/2025',
      tipo: 'entrada',
      categoria: 'Troco Inicial',
      descricao: 'Troco para início do dia',
      valor: 200.00,
      responsavel: 'João'
    },
    {
      id: '2',
      data: '29/04/2025',
      tipo: 'entrada',
      categoria: 'Venda Mesa',
      descricao: 'Mesa 1 - Pedido #1745592396579',
      valor: 150.00,
      formaPagamento: 'Dinheiro',
      responsavel: 'Maria'
    },
    {
      id: '3',
      data: '29/04/2025',
      tipo: 'saida',
      categoria: 'Insumos',
      descricao: 'Compra emergencial de pão',
      valor: 45.00,
      responsavel: 'João'
    },
    // TESTE: Movimentações do mês anterior
    {
      id: '4',
      data: '15/03/2025',
      tipo: 'entrada',
      categoria: 'Venda Balcão',
      descricao: 'Venda balcão teste março',
      valor: 80.00,
      formaPagamento: 'Dinheiro',
      responsavel: 'Teste'
    },
    {
      id: '5',
      data: '16/03/2025',
      tipo: 'saida',
      categoria: 'Insumos',
      descricao: 'Compra de farinha março',
      valor: 30.00,
      responsavel: 'Teste'
    },
    {
      id: '6',
      data: '17/03/2025',
      tipo: 'saida',
      categoria: 'Utilidades',
      descricao: 'Conta de luz março',
      valor: 50.00,
      responsavel: 'Teste'
    }
  ]);

  const [resumos] = useState<ResumoFinanceiro[]>([
    {
      data: '29/04/2025',
      trocoInicial: 200.00,
      entradas: {
        vendas: {
          mesas: 450.00,
          delivery: 150.00,
          balcao: 200.00
        },
        reforcoCaixa: 200.00,
        outrasEntradas: 0
      },
      saidas: {
        despesas: {
          insumos: 150.00,
          utilidades: 80.00,
          funcionarios: 200.00
        },
        retiradas: 300.00,
        trocoDevolvido: 50.00
      },
      faturamento: 800.00,
      custos: 780.00,
      lucro: 20.00,
      saldoAtual: 420.00
    }
  ]);

  const [novaMovModal, setNovaMovModal] = useState(false);
  const [novaMov, setNovaMov] = useState<Partial<Movimentacao>>({ tipo: 'entrada', categoria: '', descricao: '', valor: 0, formaPagamento: '', responsavel: '', data: '' });
  const [editandoMovId, setEditandoMovId] = useState<string|null>(null);

  // Estado para saldos iniciais por dia
  const [saldosIniciais, setSaldosIniciais] = useState<{[data: string]: number}>({});

  // Estado para modal de nova abertura
  const [novaAberturaModal, setNovaAberturaModal] = useState(false);
  const [novaAbertura, setNovaAbertura] = useState<{data: string, valor: number}>({data: '', valor: 0});

  // Adicionar estado para ajuste manual do saldo
  const [ajusteSaldo, setAjusteSaldo] = useState<number>(0);

  // Adicionar estado para mostrar/ocultar ajuste manual
  const [mostrarAjuste, setMostrarAjuste] = useState(false);

  // Função para carregar vendas do localStorage
  const carregarVendas = () => {
    if (typeof window !== 'undefined') {
      try {
        const vendasSalvas = localStorage.getItem('vendas');
        if (vendasSalvas) {
          setVendas(JSON.parse(vendasSalvas));
        } else {
          setVendas([]);
        }
      } catch {
        setVendas([]);
      }
    }
  };

  // Função utilitária para comparar datas apenas por ano, mês e dia
  function soData(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  // Corrigir filtro de vendas por período para comparar só ano/mês/dia
  const filtrarVendasPorPeriodo = (todasVendas: Venda[]) => {
    let inicio = new Date();
    let fim = new Date();
    if (periodoSelecionado === 'hoje') {
      inicio.setHours(0,0,0,0);
      fim = new Date(inicio);
      fim.setDate(fim.getDate() + 1);
    } else if (periodoSelecionado === 'mes') {
      inicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1, 0, 0, 0, 0);
      fim = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (periodoSelecionado === 'semana') {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      inicio = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      fim = new Date(inicio);
      fim.setDate(fim.getDate() + 6);
      fim.setHours(23,59,59,999);
    } else if (periodoSelecionado === 'periodo' && dataInicio && dataFim) {
      const [iy, im, id] = dataInicio.split('-').map(Number);
      const [fy, fm, fd] = dataFim.split('-').map(Number);
      inicio = new Date(iy, im - 1, id, 0, 0, 0, 0);
      fim = new Date(fy, fm - 1, fd, 23, 59, 59, 999);
    }
    return todasVendas.filter(venda => {
      const dataVenda = new Date(Number(venda.data));
      return dataVenda >= inicio && dataVenda <= fim;
    });
  };

  // Calcular faturamento e iFood
  useEffect(() => {
    carregarVendas();
  }, []);

  useEffect(() => {
    const vendasPeriodo = filtrarVendasPorPeriodo(vendas);
    let somaFaturamento = 0;
    let somaIfood = 0;
    vendasPeriodo.forEach(venda => {
      const tipo = (venda.formaPagamento || '').toLowerCase();
      if (tipo.includes('pago pelo app') || tipo.includes('ifood')) {
        somaIfood += (venda.total || 0);
      } else {
        somaFaturamento += (venda.total || 0);
      }
    });
    setFaturamento(somaFaturamento);
    setValorIfood(somaIfood);
  }, [vendas, periodoSelecionado, dataInicio, dataFim]);

  // Função para editar movimentação
  const editarMovimentacao = (mov: Movimentacao) => {
    setNovaMov(mov);
    setEditandoMovId(mov.id);
    setNovaMovModal(true);
  };

  // Função para salvar edição ou nova
  const salvarMovimentacao = () => {
    if (!novaMov.categoria || !novaMov.descricao || !novaMov.valor || !novaMov.responsavel) return;
    let lista;
    if (editandoMovId) {
      lista = movimentacoes.map(m => m.id === editandoMovId ? {
        ...m,
        ...novaMov,
        valor: Number(novaMov.valor),
        data: novaMov.data || m.data
      } : m);
    } else {
      const nova: Movimentacao = {
        id: Date.now().toString(),
        data: novaMov.data || new Date().toLocaleString('pt-BR'),
        tipo: novaMov.tipo as 'entrada' | 'saida',
        categoria: novaMov.categoria!,
        descricao: novaMov.descricao!,
        valor: Number(novaMov.valor),
        formaPagamento: novaMov.formaPagamento || '',
        responsavel: novaMov.responsavel!,
      };
      lista = [nova, ...movimentacoes];
      // Se for entrada e categoria Venda Mesa ou Venda Balcão, criar venda correspondente
      if (novaMov.tipo === 'entrada' && (novaMov.categoria === 'Venda Mesa' || novaMov.categoria === 'Venda Balcão')) {
        const novaVenda = {
          id: Date.now().toString(),
          data: Date.now().toString(),
          formaPagamento: novaMov.formaPagamento || novaMov.categoria,
          total: Number(novaMov.valor)
        };
        const vendasSalvas = localStorage.getItem('vendas');
        let vendasAtualizadas = vendas;
        if (vendasSalvas) {
          vendasAtualizadas = JSON.parse(vendasSalvas);
        }
        vendasAtualizadas = [novaVenda, ...vendasAtualizadas];
        setVendas(vendasAtualizadas);
        localStorage.setItem('vendas', JSON.stringify(vendasAtualizadas));
        alert('Movimentação salva e valor incluído no faturamento do dia!');
      }
    }
    setMovimentacoes(lista);
    localStorage.setItem('movimentacoes', JSON.stringify(lista));
    setNovaMovModal(false);
    setNovaMov({ tipo: 'entrada', categoria: '', descricao: '', valor: 0, formaPagamento: '', responsavel: '', data: '' });
    setEditandoMovId(null);
  };

  // Função para excluir movimentação
  const excluirMovimentacao = (id: string) => {
    if (!window.confirm('Deseja realmente excluir esta movimentação?')) return;
    const lista = movimentacoes.filter(m => m.id !== id);
    setMovimentacoes(lista);
    localStorage.setItem('movimentacoes', JSON.stringify(lista));
  };

  // Carregar movimentações do localStorage ao iniciar
  useEffect(() => {
    const movSalvas = localStorage.getItem('movimentacoes');
    if (movSalvas) setMovimentacoes(JSON.parse(movSalvas));
  }, []);

  // Corrigir filtro de movimentações para comparar só ano/mês/dia
  const filtrarMovimentacoes = () => {
    let inicio = new Date();
    let fim = new Date();
    if (periodoSelecionado === 'hoje') {
      inicio.setHours(0,0,0,0);
      fim = new Date(inicio);
      fim.setDate(fim.getDate() + 1);
    } else if (periodoSelecionado === 'mes') {
      inicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1, 0, 0, 0, 0);
      fim = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (periodoSelecionado === 'semana') {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      inicio = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      fim = new Date(inicio);
      fim.setDate(fim.getDate() + 6);
      fim.setHours(23,59,59,999);
    } else if (periodoSelecionado === 'periodo' && dataInicio && dataFim) {
      const [iy, im, id] = dataInicio.split('-').map(Number);
      const [fy, fm, fd] = dataFim.split('-').map(Number);
      inicio = new Date(iy, im - 1, id, 0, 0, 0, 0);
      fim = new Date(fy, fm - 1, fd, 23, 59, 59, 999);
    }
    return movimentacoes.filter(mov => {
      const dataMov = new Date(mov.data.split(' ')[0].split('/').reverse().join('-') || mov.data);
      const periodoOk = dataMov >= inicio && dataMov <= fim;
      const categoriaOk = categoriaSelecionada === 'todas' || mov.categoria === categoriaSelecionada;
      return periodoOk && categoriaOk;
    });
  };

  // Função para gerar detalhamento por dia
  const detalhamentoPorDia = () => {
    // Agrupar vendas e movimentações por data (formato dd/mm/yyyy)
    const vendasPorDia: Record<string, {mesas: number, delivery: number, balcao: number}> = {};
    const trocoInicialPorDia: Record<string, number> = {};
    const despesasPorDia: Record<string, number> = {};
    const retiradasPorDia: Record<string, number> = {};
    const saldoFinalPorDia: Record<string, number> = {};

    // Agrupar vendas
    filtrarVendasPorPeriodo(vendas).forEach(venda => {
      const data = new Date(Number(venda.data));
      const dataStr = data.toLocaleDateString('pt-BR');
      if (!vendasPorDia[dataStr]) vendasPorDia[dataStr] = {mesas: 0, delivery: 0, balcao: 0};
      // Classificação simples: se formaPagamento contém 'app' ou 'ifood' ignora, se descrição/formaPagamento contém 'delivery' soma em delivery, se não houver mesa, soma em balcão, senão mesa
      const tipo = (venda.formaPagamento || '').toLowerCase();
      if (tipo.includes('pago pelo app') || tipo.includes('ifood')) return;
      // Aqui você pode melhorar a lógica para identificar delivery/mesa/balcao
      if ((venda.formaPagamento || '').toLowerCase().includes('delivery')) {
        vendasPorDia[dataStr].delivery += (venda.total || 0);
      } else if ((venda.formaPagamento || '').toLowerCase().includes('mesa')) {
        vendasPorDia[dataStr].mesas += (venda.total || 0);
      } else {
        vendasPorDia[dataStr].balcao += (venda.total || 0);
      }
    });

    // Agrupar movimentações
    filtrarMovimentacoes().forEach(mov => {
      let data: Date | null = null;
      if (mov.data) {
        // Tenta converter para Date
        const partes = mov.data.split(' ')[0].split('/');
        if (partes.length === 3) {
          // dd/mm/yyyy
          data = new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
        } else if (!isNaN(Date.parse(mov.data))) {
          data = new Date(mov.data);
        }
      }
      if (!data || isNaN(data.getTime())) return; // ignora datas inválidas
      const dataStr = data.toLocaleDateString('pt-BR');
      if (mov.tipo === 'entrada' && mov.categoria === 'Troco Inicial') {
        trocoInicialPorDia[dataStr] = (trocoInicialPorDia[dataStr] || 0) + mov.valor;
      }
      if (mov.tipo === 'saida' && categoriasSaida.includes(mov.categoria)) {
        despesasPorDia[dataStr] = (despesasPorDia[dataStr] || 0) + mov.valor;
      }
      if (mov.tipo === 'saida' && mov.categoria === 'Retirada') {
        retiradasPorDia[dataStr] = (retiradasPorDia[dataStr] || 0) + mov.valor;
      }
    });

    // Calcular saldo final (simplificado: troco inicial + vendas - despesas - retiradas)
    const todasDatas = Array.from(new Set([
      ...Object.keys(vendasPorDia),
      ...Object.keys(trocoInicialPorDia),
      ...Object.keys(despesasPorDia),
      ...Object.keys(retiradasPorDia)
    ])).filter(dataStr => {
      // Só inclui datas dentro do período filtrado
      const [dia, mes, ano] = dataStr.split('/').map(Number);
      const dataObj = new Date(ano, mes - 1, dia);
      let inicio = new Date();
      let fim = new Date();
      if (periodoSelecionado === 'hoje') {
        inicio.setHours(0,0,0,0);
        fim = new Date(inicio);
        fim.setDate(fim.getDate() + 1);
      } else if (periodoSelecionado === 'mes') {
        inicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1, 0, 0, 0, 0);
        fim = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);
      } else if (periodoSelecionado === 'semana') {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        inicio = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
        fim = new Date(inicio);
        fim.setDate(fim.getDate() + 6);
        fim.setHours(23,59,59,999);
      } else if (periodoSelecionado === 'periodo' && dataInicio && dataFim) {
        const [iy, im, id] = dataInicio.split('-').map(Number);
        const [fy, fm, fd] = dataFim.split('-').map(Number);
        inicio = new Date(iy, im - 1, id, 0, 0, 0, 0);
        fim = new Date(fy, fm - 1, fd, 23, 59, 59, 999);
      }
      return dataObj >= inicio && dataObj <= fim;
    }).sort((a, b) => {
      const [da, ma, ya] = a.split('/').map(Number);
      const [db, mb, yb] = b.split('/').map(Number);
      return new Date(ya, ma-1, da).getTime() - new Date(yb, mb-1, db).getTime();
    });

    return todasDatas.map(dataStr => {
      const mesas = vendasPorDia[dataStr]?.mesas || 0;
      const delivery = vendasPorDia[dataStr]?.delivery || 0;
      const balcao = vendasPorDia[dataStr]?.balcao || 0;
      const trocoInicial = saldosIniciais[dataStr] || 0;
      const despesas = despesasPorDia[dataStr] || 0;
      const retiradas = retiradasPorDia[dataStr] || 0;
      const saldoFinal = trocoInicial + mesas + delivery + balcao - despesas - retiradas;
      return {
        data: dataStr,
        trocoInicial,
        mesas,
        delivery,
        balcao,
        despesas,
        retiradas,
        saldoFinal
      };
    });
  };

  // Função para excluir todas as movimentações e vendas de um dia
  const excluirDia = (dataStr: string) => {
    if (!window.confirm(`Deseja realmente excluir todas as movimentações e vendas do dia ${dataStr}?`)) return;
    // Remover movimentações
    const novasMov = movimentacoes.filter(mov => {
      let data: Date | null = null;
      if (mov.data) {
        const partes = mov.data.split(' ')[0].split('/');
        if (partes.length === 3) {
          data = new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
        } else if (!isNaN(Date.parse(mov.data))) {
          data = new Date(mov.data);
        }
      }
      if (!data || isNaN(data.getTime())) return true;
      return data.toLocaleDateString('pt-BR') !== dataStr;
    });
    setMovimentacoes(novasMov);
    localStorage.setItem('movimentacoes', JSON.stringify(novasMov));
    // Remover vendas
    const novasVendas = vendas.filter(venda => {
      const data = new Date(Number(venda.data));
      return data.toLocaleDateString('pt-BR') !== dataStr;
    });
    setVendas(novasVendas);
    localStorage.setItem('vendas', JSON.stringify(novasVendas));
  };

  // Usar apenas movimentações filtradas pelo período e categoria para os cards
  const movimentacoesFiltradas = filtrarMovimentacoes();
  const custosDespesas = movimentacoesFiltradas.filter(mov => mov.tipo === 'saida' && categoriasSaida.includes(mov.categoria)).reduce((acc, mov) => acc + mov.valor, 0);
  const entradas = movimentacoesFiltradas.filter(mov => mov.tipo === 'entrada').reduce((acc, mov) => acc + mov.valor, 0);
  const saidas = movimentacoesFiltradas.filter(mov => mov.tipo === 'saida').reduce((acc, mov) => acc + mov.valor, 0);
  const lucro = faturamento - custosDespesas;
  const saldoAtual = (entradas + faturamento) - saidas;

  // Carregar saldos iniciais do localStorage ao iniciar
  useEffect(() => {
    const salvos = localStorage.getItem('saldosIniciais');
    if (salvos) setSaldosIniciais(JSON.parse(salvos));
  }, []);

  // Função para salvar saldo inicial do dia
  const salvarSaldoInicial = (valor: number) => {
    const hoje = new Date();
    const dataStr = hoje.toLocaleDateString('pt-BR');
    const novos = { ...saldosIniciais, [dataStr]: valor };
    setSaldosIniciais(novos);
    localStorage.setItem('saldosIniciais', JSON.stringify(novos));
    setSaldoInicial(valor);
  };

  // Ao mudar o dia, mostrar o saldo inicial salvo
  useEffect(() => {
    const hoje = new Date();
    const dataStr = hoje.toLocaleDateString('pt-BR');
    setSaldoInicial(saldosIniciais[dataStr] || 0);
  }, [saldosIniciais]);

  // Função para adicionar nova abertura
  const adicionarAbertura = () => {
    if (!novaAbertura.data || novaAbertura.valor <= 0) return;
    const novos = { ...saldosIniciais, [novaAbertura.data]: novaAbertura.valor };
    setSaldosIniciais(novos);
    localStorage.setItem('saldosIniciais', JSON.stringify(novos));
    setNovaAberturaModal(false);
    setNovaAbertura({data: '', valor: 0});
  };

  // Função para excluir abertura
  const excluirAbertura = (data: string) => {
    if (!window.confirm(`Deseja realmente excluir a abertura de caixa do dia ${data}?`)) return;
    const novos = { ...saldosIniciais };
    delete novos[data];
    setSaldosIniciais(novos);
    localStorage.setItem('saldosIniciais', JSON.stringify(novos));
  };

  // Corrigir filtro de aberturas de caixa para comparar só ano/mês/dia
  const filtrarDatasAbertura = () => {
    let inicio = new Date();
    let fim = new Date();
    if (periodoSelecionado === 'hoje') {
      inicio.setHours(0,0,0,0);
      fim = new Date(inicio);
      fim.setDate(fim.getDate() + 1);
    } else if (periodoSelecionado === 'mes') {
      inicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1, 0, 0, 0, 0);
      fim = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (periodoSelecionado === 'semana') {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      inicio = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      fim = new Date(inicio);
      fim.setDate(fim.getDate() + 6);
      fim.setHours(23,59,59,999);
    } else if (periodoSelecionado === 'periodo' && dataInicio && dataFim) {
      const [iy, im, id] = dataInicio.split('-').map(Number);
      const [fy, fm, fd] = dataFim.split('-').map(Number);
      inicio = new Date(iy, im - 1, id, 0, 0, 0, 0);
      fim = new Date(fy, fm - 1, fd, 23, 59, 59, 999);
    }
    return Object.entries(saldosIniciais).filter(([data]) => {
      const [dia, mes, ano] = data.split('/').map(Number);
      const dataObj = new Date(ano, mes - 1, dia);
      return dataObj >= inicio && dataObj <= fim;
    });
  };

  // Função para gerar o texto do período para os cards
  const textoPeriodo = () => {
    if (periodoSelecionado === 'hoje') return 'do Dia';
    if (periodoSelecionado === 'semana') return 'da Semana';
    if (periodoSelecionado === 'mes') return 'do Mês';
    if (periodoSelecionado === 'periodo') return 'do Período';
    return '';
  };

  // Função para calcular dias úteis (segunda a sábado) no mês
  function diasUteisNoMes(ano: number, mes: number) {
    let dias = 0;
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    for (let dia = 1; dia <= ultimoDia; dia++) {
      const data = new Date(ano, mes, dia);
      const diaSemana = data.getDay();
      if (diaSemana >= 1 && diaSemana <= 6) { // 1=segunda, 6=sábado
        dias++;
      }
    }
    return dias;
  }

  // Inicialização segura para SSR
  const [faturamentoMedio, setFaturamentoMedio] = useState<number>(500);
  const [gastoMedio, setGastoMedio] = useState<number>(350);

  // Carregar valores do localStorage apenas no client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFaturamento = localStorage.getItem('faturamentoMedio');
      if (savedFaturamento) setFaturamentoMedio(Number(savedFaturamento));
      const savedGasto = localStorage.getItem('gastoMedio');
      if (savedGasto) setGastoMedio(Number(savedGasto));
    }
  }, []);

  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const diasUteis = diasUteisNoMes(ano, mes);
  const faturamentoProjetado = diasUteis * faturamentoMedio;
  const despesasProjetadas = diasUteis * gastoMedio;
  const lucroProjetado = faturamentoProjetado - despesasProjetadas;

  const exportarVendas = () => {
    if (typeof window === 'undefined') return;
    const vendasSalvas = localStorage.getItem('vendas');
    if (!vendasSalvas) {
      alert('Nenhuma venda encontrada para exportar.');
      return;
    }
    // ... rest of the function ...
  };

  // Carregar ajuste do localStorage ao iniciar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAjuste = localStorage.getItem('ajusteSaldoAtual');
      if (savedAjuste) setAjusteSaldo(Number(savedAjuste));
    }
  }, []);

  // Função para salvar ajuste
  const salvarAjusteSaldo = () => {
    localStorage.setItem('ajusteSaldoAtual', ajusteSaldo.toString());
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-[1200px] mx-auto">
        {/* Cabeçalho */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Controle Financeiro</h1>
            <Link
              href="/caixa"
              className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar para o Caixa
            </Link>
          </div>

          {/* Filtros */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">Período:</label>
                <select 
                  className="border rounded-md px-3 py-1.5 text-sm"
                  value={periodoSelecionado}
                  onChange={(e) => setPeriodoSelecionado(e.target.value)}
                >
                  <option value="hoje">Hoje</option>
                  <option value="semana">Esta Semana</option>
                  <option value="mes">Este Mês</option>
                  <option value="periodo">Período Específico</option>
                </select>
              </div>
              
              {periodoSelecionado === 'periodo' && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    className="border rounded-md px-3 py-1.5 text-sm"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                  <span className="text-gray-500">até</span>
                  <input
                    type="date"
                    className="border rounded-md px-3 py-1.5 text-sm"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">Categoria:</label>
                <select 
                  className="border rounded-md px-3 py-1.5 text-sm"
                  value={categoriaSelecionada}
                  onChange={(e) => setCategoriaSelecionada(e.target.value)}
                >
                  <option value="todas">Todas</option>
                  <optgroup label="Entradas">
                    {categoriasEntrada.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Saídas">
                    {categoriasSaida.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <button className="bg-blue-500 text-white px-4 py-1.5 rounded-md text-sm hover:bg-blue-600">
                Filtrar
              </button>
            </div>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600">Faturamento {textoPeriodo()}</div>
            <div className="text-2xl font-bold text-blue-600">R$ {faturamento.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600">iFood {textoPeriodo()}</div>
            <div className="text-2xl font-bold text-red-600">R$ {valorIfood.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600">Custos e Despesas {textoPeriodo()}</div>
            <div className="text-2xl font-bold text-red-600">R$ {custosDespesas.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600">Lucro {textoPeriodo()}</div>
            <div className="text-2xl font-bold text-green-600">R$ {lucro.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Saldo Atual {textoPeriodo()}</div>
              <button
                className="text-xs text-purple-600 hover:underline ml-2"
                onClick={() => {
                  const senha = prompt('Digite a senha de administrador para ajustar o saldo:');
                  if (senha === 'admin123') {
                    setMostrarAjuste(true);
                  } else if (senha !== null) {
                    alert('Senha incorreta!');
                  }
                }}
              >Ajustar Saldo</button>
            </div>
            <div className="text-2xl font-bold text-purple-600 mb-2">R$ {(saldoAtual + ajusteSaldo).toFixed(2)}</div>
            {mostrarAjuste && (
              <div className="mt-2 flex items-center gap-2">
                <label className="text-xs text-purple-500">Ajuste manual:</label>
                <input
                  type="number"
                  value={ajusteSaldo}
                  onChange={e => setAjusteSaldo(Number(e.target.value) || 0)}
                  className="w-20 p-1 border rounded text-xs text-right"
                  step="0.01"
                />
                <button
                  onClick={() => {
                    salvarAjusteSaldo();
                    setMostrarAjuste(false);
                  }}
                  className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200"
                >Salvar</button>
                <button
                  onClick={() => setMostrarAjuste(false)}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                >Cancelar</button>
              </div>
            )}
          </div>
        </div>

        {/* Seção de Aberturas de Caixa */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6 mt-6">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800">Aberturas de Caixa</h2>
            <button onClick={() => setNovaAberturaModal(true)} className="bg-amber-500 text-white px-4 py-1.5 rounded text-sm hover:bg-amber-600">Nova Abertura</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Data</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Abertura de Caixa</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrarDatasAbertura().sort((a, b) => {
                  const [da, ma, ya] = a[0].split('/').map(Number);
                  const [db, mb, yb] = b[0].split('/').map(Number);
                  return new Date(ya, ma-1, da).getTime() - new Date(yb, mb-1, db).getTime();
                }).map(([data, valor]) => (
                  <tr key={data} className="border-b border-gray-200">
                    <td className="px-4 py-2">{data}</td>
                    <td className="px-4 py-2 text-right">R$ {valor.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => excluirAbertura(data)} className="text-red-600 hover:underline">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detalhamento por Dia */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800">Detalhamento por Dia</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Data</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Vendas Mesas</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Vendas Delivery</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Vendas Balcão</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Despesas</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Retiradas</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Saldo Final</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {detalhamentoPorDia().map((resumo) => (
                  <tr key={resumo.data} className="border-b border-gray-200">
                    <td className="px-4 py-2">{resumo.data}</td>
                    <td className="px-4 py-2 text-right">R$ {resumo.mesas.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">R$ {resumo.delivery.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">R$ {resumo.balcao.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-red-600">R$ {resumo.despesas.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-red-600">R$ {resumo.retiradas.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-medium">R$ {resumo.saldoFinal.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => excluirDia(resumo.data)} className="text-red-600 hover:underline">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lista de Movimentações */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800">Movimentações</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Data/Hora</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Categoria</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Descrição</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Valor</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Forma Pagto</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Responsável</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrarMovimentacoes().map((mov) => (
                  <tr key={mov.id} className="border-b border-gray-200">
                    <td className="px-4 py-2">{mov.data}</td>
                    <td className="px-4 py-2">{mov.categoria}</td>
                    <td className="px-4 py-2">{mov.descricao}</td>
                    <td className={`px-4 py-2 text-right ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                      {mov.tipo === 'entrada' ? '+' : '-'} R$ {mov.valor.toFixed(2)}
                    </td>
                    <td className="px-4 py-2">{mov.formaPagamento || '-'}</td>
                    <td className="px-4 py-2">{mov.responsavel}</td>
                    <td className="px-4 py-2">
                      <button onClick={() => editarMovimentacao(mov)} className="text-blue-600 hover:underline mr-2">Editar</button>
                      <button onClick={() => excluirMovimentacao(mov.id)} className="text-red-600 hover:underline">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="bg-amber-500 text-white px-4 py-2 rounded-md text-sm hover:bg-amber-600"
            onClick={() => setNovaMovModal(true)}
          >
            Nova Movimentação
          </button>
          <button className="bg-green-500 text-white px-4 py-2 rounded-md text-sm hover:bg-green-600">
            Exportar Excel
          </button>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600">
            Imprimir Relatório
          </button>
        </div>

        {/* Projeção Mensal */}
        <div className="bg-blue-50 rounded-lg shadow-sm p-4 mt-6 mb-6">
          <h2 className="text-lg font-medium text-blue-800 mb-2">Projeção do Mês</h2>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Faturamento Projetado</div>
              <div className="text-xl font-bold text-blue-600">R$ {faturamentoProjetado.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Despesas Projetadas</div>
              <div className="text-xl font-bold text-red-600">R$ {despesasProjetadas.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Lucro Projetado</div>
              <div className="text-xl font-bold text-green-600">R$ {lucroProjetado.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Dias Úteis</div>
              <div className="text-xl font-bold">{diasUteis}</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-700">
            <strong>Observação:</strong> Projeção baseada em faturamento médio diário de R$ 500,00 e gasto médio diário de R$ 350,00 (segunda a sábado).
          </div>
          {/* Inputs para simulação */}
          <div className="flex gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-700">Faturamento médio diário</label>
              <input
                type="number"
                className="border rounded px-2 py-1 w-32"
                value={faturamentoMedio}
                onChange={e => setFaturamentoMedio(Number(e.target.value))}
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Gasto médio diário</label>
              <input
                type="number"
                className="border rounded px-2 py-1 w-32"
                value={gastoMedio}
                onChange={e => setGastoMedio(Number(e.target.value))}
                min={0}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal Nova Movimentação */}
      {novaMovModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h3 className="text-lg font-medium mb-4">{editandoMovId ? 'Editar Movimentação' : 'Nova Movimentação'}</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <select value={novaMov.tipo} onChange={e => setNovaMov(m => ({...m, tipo: e.target.value as 'entrada' | 'saida'}))} className="p-2 border rounded flex-1">
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </select>
                <select value={novaMov.categoria} onChange={e => setNovaMov(m => ({...m, categoria: e.target.value}))} className="p-2 border rounded flex-1">
                  <option value="">Categoria</option>
                  {(novaMov.tipo === 'entrada' ? categoriasEntrada : categoriasSaida).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <input type="text" placeholder="Descrição" value={novaMov.descricao} onChange={e => setNovaMov(m => ({...m, descricao: e.target.value}))} className="w-full p-2 border rounded" />
              <input type="number" step="0.01" placeholder="Valor" value={novaMov.valor || ''} onChange={e => setNovaMov(m => ({...m, valor: parseFloat(e.target.value) || 0}))} className="w-full p-2 border rounded" />
              <input type="text" placeholder="Forma de Pagamento" value={novaMov.formaPagamento} onChange={e => setNovaMov(m => ({...m, formaPagamento: e.target.value}))} className="w-full p-2 border rounded" />
              <input type="text" placeholder="Responsável" value={novaMov.responsavel} onChange={e => setNovaMov(m => ({...m, responsavel: e.target.value}))} className="w-full p-2 border rounded" />
              <input type="datetime-local" value={novaMov.data || ''} onChange={e => setNovaMov(m => ({...m, data: e.target.value}))} className="w-full p-2 border rounded" />
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setNovaMovModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-700">Cancelar</button>
                <button onClick={salvarMovimentacao} disabled={!novaMov.categoria || !novaMov.descricao || !novaMov.valor || !novaMov.responsavel} className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed">{editandoMovId ? 'Salvar Alterações' : 'Salvar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Abertura */}
      {novaAberturaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[350px]">
            <h3 className="text-lg font-medium mb-4">Nova Abertura de Caixa</h3>
            <div className="space-y-3">
              <input type="date" value={novaAbertura.data} onChange={e => setNovaAbertura(a => ({...a, data: e.target.value.split('-').reverse().join('/')}))} className="w-full p-2 border rounded" />
              <input type="number" step="0.01" placeholder="Valor" value={novaAbertura.valor || ''} onChange={e => setNovaAbertura(a => ({...a, valor: parseFloat(e.target.value) || 0}))} className="w-full p-2 border rounded" />
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setNovaAberturaModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-700">Cancelar</button>
                <button onClick={adicionarAbertura} disabled={!novaAbertura.data || novaAbertura.valor <= 0} className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 