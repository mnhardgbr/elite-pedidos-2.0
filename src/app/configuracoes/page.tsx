'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import * as XLSX from 'xlsx';

interface Categoria {
  id: number;
  nome: string;
}

interface Produto {
  id: number;
  nome: string;
  categoria: string;
  preco: number;
  imagem: string;
  descricao: string;
  tipovenda: string;
  codigobarra: string;
}

interface ExcelRow {
  [key: string]: any;  // Permite qualquer nome de coluna
}

interface NovoProduto {
  nome: string;
  categoria: string;
  preco: string;
  tipovenda: string;
  codigobarra: string;
}

export default function ConfiguracoesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novoProduto, setNovoProduto] = useState<NovoProduto>({
    nome: '',
    categoria: '',
    preco: '',
    tipovenda: 'unidade',
    codigobarra: ''
  });
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [modalProduto, setModalProduto] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [duplicados, setDuplicados] = useState<{[key: string]: Produto[]}>({});
  const [duplicadosNome, setDuplicadosNome] = useState<{[key: string]: Produto[]}>({});
  const [duplicadosCodigo, setDuplicadosCodigo] = useState<{[key: string]: Produto[]}>({});
  const [mostrarCafes, setMostrarCafes] = useState(false);
  const [periodoSelecionado, setPeriodoSelecionado] = useState('semana');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [vendas, setVendas] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      carregarCategorias();
      carregarProdutos();
      verificarProdutosDuplicados();
      const vendasSalvas = localStorage.getItem('vendas');
      if (vendasSalvas) setVendas(JSON.parse(vendasSalvas));
    }
  }, []);

  const carregarCategorias = async () => {
    try {
      if (typeof window === 'undefined') return;
      const categoriasSalvas = localStorage.getItem('categorias');
      if (categoriasSalvas) {
        setCategorias(JSON.parse(categoriasSalvas));
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const carregarProdutos = async () => {
    try {
      if (typeof window === 'undefined') return;
      const produtosSalvos = localStorage.getItem('produtos');
      if (produtosSalvos) {
        const produtosData = JSON.parse(produtosSalvos) as Produto[];
        setProdutos(produtosData);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const adicionarCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const novaCategoriaObj = {
        id: Date.now(), // Usar timestamp como ID
        nome: novaCategoria
      };

      const novasCategorias = [...categorias, novaCategoriaObj];
      if (typeof window !== 'undefined') {
        localStorage.setItem('categorias', JSON.stringify(novasCategorias));
      }
      setCategorias(novasCategorias);
      setNovaCategoria('');
    } catch (error) {
      console.error('Erro ao adicionar categoria:', error);
    }
  };

  // Função para gerar id único
  function gerarIdUnico() {
    return Date.now() + Math.floor(Math.random() * 10000);
  }

  const adicionarProduto = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const novoProdutoObj: Produto = {
        id: gerarIdUnico(),
        nome: novoProduto.nome,
        categoria: novoProduto.categoria,
        preco: parseFloat(novoProduto.preco),
        tipovenda: novoProduto.tipovenda,
        codigobarra: novoProduto.codigobarra,
        imagem: '',
        descricao: ''
      };
      const novaLista = [...produtos, novoProdutoObj];
      const produtosLimpos = limparDuplicadosAuto(novaLista);
      setProdutos(produtosLimpos);
      if (typeof window !== 'undefined') {
        localStorage.setItem('produtos', JSON.stringify(produtosLimpos));
      }
      setModalProduto(false);
      setNovoProduto({
        nome: '',
        categoria: '',
        preco: '',
        tipovenda: 'unidade',
        codigobarra: ''
      });
      window.dispatchEvent(new CustomEvent('produtosAtualizados'));
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
    }
  };

  const editarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoEditando) return;

    try {
      // Verificar se já existe outro produto com o mesmo código de barras (exceto o próprio produto)
      if (produtoEditando.codigobarra) {
        const produtoExistente = produtos.find(p => 
          p.codigobarra === produtoEditando.codigobarra && 
          p.id !== produtoEditando.id
        );
        
        if (produtoExistente) {
          if (!confirm(`Já existe um produto com este código de barras: ${produtoExistente.nome}. Deseja continuar mesmo assim?`)) {
            return;
          }
        }
      }

      // Atualizar o produto na lista (substituir pelo id)
      const produtosAtualizados = produtos.map(p => 
        p.id === produtoEditando.id ? {
          ...produtoEditando,
          preco: parseFloat(produtoEditando.preco.toString()),
          codigobarra: produtoEditando.codigobarra || '',
          id: p.id // garantir que o id original seja mantido
        } : p
      );
      // NÃO adicionar produto novo, apenas atualizar
      // const produtosLimpos = limparDuplicadosAuto(produtosAtualizados); // Se quiser manter a limpeza
      if (typeof window !== 'undefined') {
        localStorage.setItem('produtos', JSON.stringify(produtosAtualizados));
      }
      setProdutos(produtosAtualizados);
      setModalProduto(false);
      setProdutoEditando(null);
      window.dispatchEvent(new CustomEvent('produtosAtualizados'));
    } catch (error) {
      console.error('Erro ao editar produto:', error);
    }
  };

  const excluirProduto = (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      setProdutos(prevProdutos => {
        const produtosAtualizados = prevProdutos.filter(p => p.id !== id);
        if (typeof window !== 'undefined') {
          localStorage.setItem('produtos', JSON.stringify(produtosAtualizados));
        }
        return produtosAtualizados;
      });
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
    }
  };

  const excluirTodosProdutos = () => {
    if (!confirm('Tem certeza que deseja excluir TODOS os produtos? Esta ação não pode ser desfeita!')) return;
    
    try {
      // Limpar localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('produtos');
      }
      // Atualizar estado
      setProdutos([]);
      // Disparar evento de atualização
      window.dispatchEvent(new CustomEvent('produtosAtualizados'));
      alert('Todos os produtos foram excluídos com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir todos os produtos:', error);
      alert('Erro ao excluir todos os produtos.');
    }
  };

  const handleExcelImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('Importando produtos...');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
        raw: false,
        defval: '',
        header: ['produto', 'categoria', 'preco', 'tipovenda', 'codigobarra']
      });

      console.log('Dados importados:', jsonData);

      if (jsonData.length === 0) {
        setImportStatus('Erro: A planilha está vazia ou não contém dados válidos.');
        return;
      }

      let importedCount = 0;
      let errorCount = 0;
      let errors: string[] = [];

      // Carregar dados existentes
      let produtosExistentes: Produto[] = [];
      let categoriasExistentes: Categoria[] = [];
      if (typeof window !== 'undefined') {
        produtosExistentes = JSON.parse(localStorage.getItem('produtos') || '[]');
        categoriasExistentes = JSON.parse(localStorage.getItem('categorias') || '[]');
      }

      for (const row of jsonData) {
        if (!row.produto || !row.categoria) {
          errorCount++;
          errors.push(`Linha ignorada: Nome do produto ou categoria faltando`);
          continue;
        }

        // Processar preço
        let preco = 0;
        const valorPreco = row.preco?.toString() || '';
        const precoStr = valorPreco.replace(',', '.').trim();
        preco = parseFloat(precoStr);

        if (isNaN(preco) || preco <= 0) {
          errorCount++;
          errors.push(`Linha ignorada: Preço inválido para o produto "${row.produto}"`);
          continue;
        }

        // Processar tipo de venda
        let tipoVenda = row.tipovenda?.toString().toLowerCase().trim() || 'un';
        if (!['kg', 'un'].includes(tipoVenda)) {
          tipoVenda = 'un';
        }

        // Adicionar categoria se não existir
        if (!categoriasExistentes.find((c: Categoria) => c.nome === row.categoria)) {
          const novaCategoria = {
            id: Date.now(),
            nome: row.categoria.toString().trim()
          };
          categoriasExistentes.push(novaCategoria);
        }

        const produto = {
          id: gerarIdUnico(),
          nome: row.produto.toString().trim(),
          categoria: row.categoria.toString().trim(),
          preco: preco,
          tipovenda: tipoVenda,
          codigobarra: row.codigobarra ? row.codigobarra.toString().trim() : '',
          imagem: '',
          descricao: ''
        };

        produtosExistentes.push(produto);
        importedCount++;
      }

      // Salvar no localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('categorias', JSON.stringify(categoriasExistentes));
        localStorage.setItem('produtos', JSON.stringify(produtosExistentes));
      }

      // Atualizar o estado
      setCategorias(categoriasExistentes);
      setProdutos(produtosExistentes);

      // Disparar evento de atualização
      window.dispatchEvent(new CustomEvent('produtosAtualizados', {
        detail: {
          produtos: produtosExistentes,
          categorias: categoriasExistentes
        }
      }));

      // Mostra o resultado da importação
      let statusMessage = `Importação concluída! ${importedCount} produtos importados com sucesso.`;
      if (errorCount > 0) {
        statusMessage += `\n${errorCount} produtos não puderam ser importados.`;
        console.log('Resumo dos erros:', errors);
      }
      
      setImportStatus(statusMessage);
      
      // Limpa o input de arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Limpa a mensagem de status após 10 segundos
      setTimeout(() => {
        setImportStatus('');
      }, 10000);

    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      setImportStatus('Erro ao processar o arquivo. Verifique o formato e tente novamente.');
    }
  };

  // Função para sincronizar dados entre páginas
  const sincronizarDados = () => {
    let produtosAtualizados: Produto[] = [];
    let categoriasAtualizadas: Categoria[] = [];
    if (typeof window !== 'undefined') {
      produtosAtualizados = JSON.parse(localStorage.getItem('produtos') || '[]');
      categoriasAtualizadas = JSON.parse(localStorage.getItem('categorias') || '[]');
    }
    setProdutos(produtosAtualizados);
    setCategorias(categoriasAtualizadas);
  };

  // Adicionar listener para atualizações
  useEffect(() => {
    const handleProdutosAtualizados = (event: CustomEvent) => {
      sincronizarDados();
    };

    window.addEventListener('produtosAtualizados', handleProdutosAtualizados as EventListener);
    
    return () => {
      window.removeEventListener('produtosAtualizados', handleProdutosAtualizados as EventListener);
    };
  }, []);

  // Função para verificar produtos duplicados ou com possíveis erros
  const verificarProdutosDuplicados = () => {
    if (typeof window === 'undefined') return;
    const produtosSalvos = localStorage.getItem('produtos');
    if (!produtosSalvos) return;

    const produtosLocal = JSON.parse(produtosSalvos) as Produto[];
    const duplicadosPorNome: {[key: string]: Produto[]} = {};
    const duplicadosPorCodigo: {[key: string]: Produto[]} = {};

    // Agrupar por nome
    produtosLocal.forEach((produto: Produto) => {
      const nomeLower = produto.nome.toLowerCase().trim();
      if (!duplicadosPorNome[nomeLower]) {
        duplicadosPorNome[nomeLower] = [];
      }
      duplicadosPorNome[nomeLower].push(produto);
    });

    // Agrupar por código de barras (se não for vazio)
    produtosLocal.forEach((produto: Produto) => {
      if (produto.codigobarra) {
        if (!duplicadosPorCodigo[produto.codigobarra]) {
          duplicadosPorCodigo[produto.codigobarra] = [];
        }
        duplicadosPorCodigo[produto.codigobarra].push(produto);
      }
    });

    // Filtrar apenas os que têm duplicatas
    const duplicadosNome = Object.entries(duplicadosPorNome)
      .filter(([_, produtos]) => produtos.length > 1)
      .reduce((acc, [nome, produtos]) => ({...acc, [nome]: produtos}), {});

    const duplicadosCodigo = Object.entries(duplicadosPorCodigo)
      .filter(([_, produtos]) => produtos.length > 1)
      .reduce((acc, [codigo, produtos]) => ({...acc, [codigo]: produtos}), {});

    // Se encontrar duplicatas, mostrar alerta
    if (Object.keys(duplicadosNome).length > 0 || Object.keys(duplicadosCodigo).length > 0) {
      alert(`Atenção! Foram encontrados produtos possivelmente duplicados:\n\n${
        Object.entries(duplicadosNome as {[key: string]: Produto[]})
          .map(([nome, produtos]) => 
            `${nome}:\n${produtos.map(p => `- ${p.nome} (R$ ${p.preco}) [${p.codigobarra || 'Sem código'}]`).join('\n')}`
          ).join('\n\n')
      }\n\n${
        Object.keys(duplicadosCodigo).length > 0 ? 
          Object.entries(duplicadosCodigo as {[key: string]: Produto[]})
            .map(([codigo, produtos]) => 
              `${codigo}:\n${produtos.map(p => `- ${p.nome} (R$ ${p.preco})`).join('\n')}`
            ).join('\n\n')
          : ''
      }`);
      
      setDuplicados({...duplicadosNome, ...duplicadosCodigo});
    }
  };

  // Função para corrigir produto duplicado
  const corrigirProduto = (produtoId: number, novoPreco: number) => {
    const produtosAtualizados = produtos.map((p: Produto) => 
      p.id === produtoId ? {...p, preco: novoPreco} : p
    );
    if (typeof window !== 'undefined') {
      localStorage.setItem('produtos', JSON.stringify(produtosAtualizados));
    }
    setProdutos(produtosAtualizados);
    window.dispatchEvent(new CustomEvent('produtosAtualizados'));
  };

  // Função para verificar produtos de café
  const verificarCafes = () => {
    const cafes = produtos.filter(p => 
      p.nome.toLowerCase().includes('café') || 
      p.categoria.toLowerCase().includes('café')
    );
    
    if (cafes.length > 0) {
      setDuplicados({
        'cafes': cafes
      });
      setMostrarCafes(true);
    } else {
      alert('Nenhum café encontrado no sistema.');
    }
  };

  // Função para gerar código de barras automático
  const gerarCodigoBarrasAutomatico = (produto: Produto): string => {
    if (produto.codigobarra && produto.codigobarra.trim() !== '') {
      return produto.codigobarra;
    }

    const nomeLower = produto.nome.toLowerCase();
    
    // Tratamento especial para cafés
    if (nomeLower.includes('café')) {
      // Procura por P, M ou G no nome
      let tamanho = '';
      if (nomeLower.includes(' p')) tamanho = 'P';
      else if (nomeLower.includes(' m')) tamanho = 'M';
      else if (nomeLower.includes(' g')) tamanho = 'G';
      
      return `CAFE_${tamanho}`;
    }

    // Para outros produtos, usa um prefixo baseado na categoria + nome simplificado
    const categoria = produto.categoria.toUpperCase().substring(0, 3);
    const nomeSemEspacos = produto.nome.replace(/\s+/g, '_').toUpperCase();
    return `${categoria}_${nomeSemEspacos}`;
  };

  // Função para atualizar códigos de barras faltantes
  const atualizarCodigosBarras = () => {
    const produtosAtualizados = produtos.map(produto => ({
      ...produto,
      codigobarra: gerarCodigoBarrasAutomatico(produto)
    }));

    if (typeof window !== 'undefined') {
      localStorage.setItem('produtos', JSON.stringify(produtosAtualizados));
    }
    setProdutos(produtosAtualizados);
    window.dispatchEvent(new CustomEvent('produtosAtualizados'));
    
    alert('Códigos de barras atualizados com sucesso!');
    verificarCafes(); // Atualiza a lista de cafés se estiver aberta
  };

  // Função para limpar produtos duplicados
  const limparDuplicados = () => {
    if (!confirm('Isso irá manter apenas uma cópia de cada produto com o mesmo código de barras. Deseja continuar?')) {
      return;
    }

    try {
      // Agrupar produtos por código de barras
      const grupos = produtos.reduce((acc, produto) => {
        const chave = produto.codigobarra || produto.nome.toLowerCase();
        if (!acc[chave]) {
          acc[chave] = [];
        }
        acc[chave].push(produto);
        return acc;
      }, {} as { [key: string]: Produto[] });

      // Manter apenas um produto de cada grupo (o mais recente)
      const produtosLimpos = Object.values(grupos).map(grupo => {
        // Ordenar por ID decrescente e pegar o primeiro (mais recente)
        return grupo.sort((a, b) => b.id - a.id)[0];
      });

      console.log('Produtos antes da limpeza:', produtos.length);
      console.log('Produtos após limpeza:', produtosLimpos.length);
      console.log('Produtos removidos:', produtos.length - produtosLimpos.length);

      // Atualizar localStorage e estado
      if (typeof window !== 'undefined') {
        localStorage.setItem('produtos', JSON.stringify(produtosLimpos));
      }
      setProdutos(produtosLimpos);
      
      // Disparar evento de atualização
      window.dispatchEvent(new CustomEvent('produtosAtualizados'));
      
      alert(`Limpeza concluída! ${produtos.length - produtosLimpos.length} produtos duplicados foram removidos.`);
    } catch (error) {
      console.error('Erro ao limpar duplicados:', error);
      alert('Erro ao limpar produtos duplicados.');
    }
  };

  // Função para limpar produtos duplicados automaticamente
  const limparDuplicadosAuto = (produtosLista: Produto[]) => {
    // Se estiver editando um produto, preservar ele
    const produtoEditandoId = produtoEditando?.id;
    
    // Agrupar por nome (case insensitive) + tipo de venda
    const grupos = produtosLista.reduce((acc, produto) => {
      const chave = produto.nome.trim().toLowerCase() + '_' + (produto.tipovenda || 'un');
      if (!acc[chave]) acc[chave] = [];
      acc[chave].push(produto);
      return acc;
    }, {} as { [key: string]: Produto[] });

    // Para cada grupo, manter o produto que está sendo editado (se existir) ou o mais recente
    return Object.values(grupos).map(grupo => {
      // Se houver um produto sendo editado neste grupo, mantê-lo
      const produtoEditandoNoGrupo = grupo.find(p => p.id === produtoEditandoId);
      if (produtoEditandoNoGrupo) {
        return produtoEditandoNoGrupo;
      }
      // Caso contrário, manter o mais recente
      return grupo.sort((a, b) => b.id - a.id)[0];
    });
  };

  // Função para filtrar vendas pelo período
  function filtrarVendasPorPeriodo(vendas: any[]) {
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
    return vendas.filter(venda => {
      const dataVenda = new Date(Number(venda.data));
      return dataVenda >= inicio && dataVenda <= fim;
    });
  }

  // Função para calcular total vendido de um produto no período
  function totalVendido(produto: Produto) {
    const vendasPeriodo = filtrarVendasPorPeriodo(vendas);
    if (produto.tipovenda === 'kg') {
      // Soma o peso em gramas e converte para kg
      const totalGramas = vendasPeriodo.reduce((total, venda) => {
        return total + (venda.itens?.filter((item: any) => {
          if (produto.codigobarra && item.produto.codigobarra) {
            return item.produto.codigobarra === produto.codigobarra;
          } else {
            return item.produto.id === produto.id;
          }
        })
          .reduce((soma: number, item: any) => soma + ((item.produto.peso || 0) * item.quantidade), 0) || 0);
      }, 0);
      return (totalGramas / 1000).toFixed(2); // retorna em kg com 2 casas decimais
    }
    // Para unidade, soma normalmente
    return vendasPeriodo.reduce((total, venda) => {
      return total + (venda.itens?.filter((item: any) => {
        if (produto.codigobarra && item.produto.codigobarra) {
          return item.produto.codigobarra === produto.codigobarra;
        } else {
          return item.produto.id === produto.id;
        }
      })
        .reduce((soma: number, item: any) => soma + item.quantidade, 0) || 0);
    }, 0);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div className="text-xl font-bold text-gray-800">Elite Pedidos</div>
            <div className="flex items-center space-x-4">
              <Link href="/caixa" className="text-blue-500 hover:text-blue-700">
                Voltar para o Caixa
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-lg font-semibold">Produtos</h1>
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleExcelImport}
                  accept=".xlsx,.xls"
                  className="hidden"
                />
                <button
                  onClick={limparDuplicados}
                  className="bg-yellow-500 text-white px-3 py-1.5 rounded text-sm hover:bg-yellow-600"
                >
                  Limpar Duplicados
                </button>
                <button
                  onClick={() => {
                    // Create template workbook
                    const ws = XLSX.utils.json_to_sheet([{
                      produto: 'Café P',
                      categoria: 'Bebidas',
                      preco: '5.00',
                      tipovenda: 'un',
                      codigobarra: '123'
                    }]);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
                    XLSX.writeFile(wb, 'modelo_produtos.xlsx');
                  }}
                  className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600"
                >
                  Baixar Modelo Excel
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-green-500 text-white px-3 py-1.5 rounded text-sm hover:bg-green-600"
                >
                  Importar Excel
                </button>
                <button
                  onClick={() => setModalProduto(true)}
                  className="bg-green-500 text-white px-3 py-1.5 rounded text-sm hover:bg-green-600"
                >
                  + Produto
                </button>
                <button
                  onClick={excluirTodosProdutos}
                  className="bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600"
                >
                  Excluir Todos
                </button>
              </div>
            </div>

            {importStatus && (
              <div className={`mb-4 p-3 rounded text-sm ${
                importStatus.includes('Erro') 
                  ? 'bg-red-50 border border-red-200 text-red-600' 
                  : 'bg-green-50 border border-green-200 text-green-600'
              }`}>
                {importStatus}
              </div>
            )}

            <div className="flex gap-4 mb-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700">Período:</label>
                <select 
                  className="border rounded-md px-3 py-1.5 text-sm"
                  value={periodoSelecionado}
                  onChange={e => setPeriodoSelecionado(e.target.value)}
                >
                  <option value="hoje">Hoje</option>
                  <option value="semana">Esta Semana</option>
                  <option value="mes">Este Mês</option>
                  <option value="periodo">Período Específico</option>
                </select>
              </div>
              {periodoSelecionado === 'periodo' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Início:</label>
                    <input
                      type="date"
                      className="border rounded-md px-3 py-1.5 text-sm"
                      value={dataInicio}
                      onChange={e => setDataInicio(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fim:</label>
                    <input
                      type="date"
                      className="border rounded-md px-3 py-1.5 text-sm"
                      value={dataFim}
                      onChange={e => setDataFim(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-8">
              {/* Tabela de Produtos */}
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left">Nome</th>
                      <th className="px-3 py-2 text-left">Preço</th>
                      <th className="px-3 py-2 text-left">Tipo</th>
                      <th className="px-3 py-2 text-left">Categoria</th>
                      <th className="px-3 py-2 text-left">Código de Barras</th>
                      <th className="px-3 py-2 text-left">Vendas</th>
                      <th className="px-3 py-2 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtos.map((produto) => (
                      <tr key={produto.id} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2">{produto.nome}</td>
                        <td className="px-3 py-2">R$ {produto.preco.toFixed(2)}</td>
                        <td className="px-3 py-2">{produto.tipovenda}</td>
                        <td className="px-3 py-2">{produto.categoria}</td>
                        <td className="px-3 py-2">{produto.codigobarra || '-'}</td>
                        <td className="px-3 py-2 font-bold">{totalVendido(produto)} {produto.tipovenda === 'kg' ? 'kg' : 'un'}</td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => {
                              setProdutoEditando({
                                id: produto.id,
                                nome: produto.nome,
                                categoria: produto.categoria,
                                preco: produto.preco,
                                tipovenda: produto.tipovenda,
                                codigobarra: produto.codigobarra,
                                imagem: produto.imagem,
                                descricao: produto.descricao
                              });
                              setModalProduto(true);
                            }}
                            className="text-blue-500 hover:text-blue-700 mr-2 text-sm"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => excluirProduto(produto.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Ranking dos Mais Vendidos */}
              <div className="w-80 flex-shrink-0">
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-lg font-semibold mb-2">Ranking Mais Vendidos</h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-2 py-1 text-left">#</th>
                        <th className="px-2 py-1 text-left">Produto</th>
                        <th className="px-2 py-1 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {produtos
                        .map(produto => ({
                          ...produto,
                          total: parseFloat(totalVendido(produto))
                        }))
                        .sort((a, b) => b.total - a.total)
                        .slice(0, 10)
                        .map((produto, idx) => (
                          <tr key={produto.id} className="border-t hover:bg-gray-50">
                            <td className="px-2 py-1 font-bold">{idx + 1}</td>
                            <td className="px-2 py-1">{produto.nome}</td>
                            <td className="px-2 py-1 text-right">{produto.total} {produto.tipovenda === 'kg' ? 'kg' : 'un'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Adicionar/Editar Produto */}
      {modalProduto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 w-[400px]">
            <h2 className="text-lg font-medium mb-4">
              {produtoEditando ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            <form onSubmit={produtoEditando ? editarProduto : adicionarProduto} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={produtoEditando ? produtoEditando.nome : novoProduto.nome}
                  onChange={(e) => produtoEditando 
                    ? setProdutoEditando({ ...produtoEditando, nome: e.target.value })
                    : setNovoProduto({ ...novoProduto, nome: e.target.value })
                  }
                  className="w-full p-2 border rounded text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <input
                  type="text"
                  value={produtoEditando ? produtoEditando.categoria : novoProduto.categoria}
                  onChange={(e) => produtoEditando
                    ? setProdutoEditando({ ...produtoEditando, categoria: e.target.value })
                    : setNovoProduto({ ...novoProduto, categoria: e.target.value })
                  }
                  className="w-full p-2 border rounded text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={produtoEditando ? produtoEditando.preco : novoProduto.preco}
                  onChange={(e) => produtoEditando
                    ? setProdutoEditando({ ...produtoEditando, preco: parseFloat(e.target.value) || 0 })
                    : setNovoProduto({ ...novoProduto, preco: e.target.value })
                  }
                  className="w-full p-2 border rounded text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Venda
                </label>
                <select
                  value={produtoEditando ? produtoEditando.tipovenda : novoProduto.tipovenda}
                  onChange={(e) => produtoEditando
                    ? setProdutoEditando({ ...produtoEditando, tipovenda: e.target.value })
                    : setNovoProduto({ ...novoProduto, tipovenda: e.target.value })
                  }
                  className="w-full p-2 border rounded text-sm"
                  required
                >
                  <option value="un">Unidade</option>
                  <option value="kg">Quilograma (kg)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de Barras
                </label>
                <input
                  type="text"
                  value={produtoEditando ? produtoEditando.codigobarra : novoProduto.codigobarra}
                  onChange={(e) => produtoEditando
                    ? setProdutoEditando({ ...produtoEditando, codigobarra: e.target.value })
                    : setNovoProduto({ ...novoProduto, codigobarra: e.target.value })
                  }
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalProduto(false);
                    setProdutoEditando(null);
                    setNovoProduto({
                      nome: '',
                      categoria: '',
                      preco: '',
                      tipovenda: 'un',
                      codigobarra: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {produtoEditando ? 'Salvar Alterações' : 'Adicionar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 