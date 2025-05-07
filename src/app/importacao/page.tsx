'use client';

import { useState } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

interface Produto {
  codigo: string;
  nome: string;
  categoria: string;
  preco: number;
  unidade?: string;
}

export default function ImportacaoProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [erro, setErro] = useState<string>('');
  const [sucesso, setSucesso] = useState<string>('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setErro('');
    setSucesso('');

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          // Validar e formatar os dados
          const produtosFormatados = jsonData.map((row: any) => {
            // Verificar campos obrigatórios usando os nomes exatos da planilha
            if (!row['Produto'] || !row['Categoria'] || !row['Preco tipo de venda'] || !row['Codigo de barra']) {
              throw new Error('Dados obrigatórios faltando na planilha. Certifique-se de incluir: Produto, Categoria, Preco tipo de venda e Codigo de barra');
            }

            // Extrair a unidade do preço (ex: "14.99 kg" -> "kg")
            const precoString = String(row['Preco tipo de venda']);
            const [preco, unidade] = precoString.split(' ');

            return {
              codigo: String(row['Codigo de barra']),
              nome: String(row['Produto']),
              categoria: String(row['Categoria']),
              preco: Number(preco),
              unidade: unidade
            };
          });

          setProdutos(produtosFormatados);
          setSucesso(`${produtosFormatados.length} produtos carregados com sucesso!`);
        } catch (error) {
          setErro('Erro ao processar a planilha. Verifique se os campos estão corretos: Produto, Categoria, Preco tipo de venda e Codigo de barra');
          console.error(error);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleImportar = async () => {
    try {
      // Aqui você implementará a lógica para salvar no banco de dados
      console.log('Produtos a serem importados:', produtos);
      setSucesso('Produtos importados com sucesso!');
    } catch (error) {
      setErro('Erro ao importar produtos.');
      console.error(error);
    }
  };

  const downloadModelo = () => {
    const ws = XLSX.utils.json_to_sheet([{
      'Produto': 'pão francês',
      'Categoria': 'Pães',
      'Preco tipo de venda': '14.99 kg',
      'Codigo de barra': '1'
    }]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
    XLSX.writeFile(wb, 'modelo_importacao_produtos.xlsx');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-[1000px] mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Importação de Produtos</h1>
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

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Instruções</h2>
            <p className="text-gray-600 text-sm mb-4">
              1. Baixe o modelo de planilha clicando no botão abaixo<br />
              2. Preencha os dados dos produtos seguindo o formato do modelo<br />
              3. Faça o upload da planilha preenchida<br />
              4. Confira os dados e clique em Importar
            </p>
            <button
              onClick={downloadModelo}
              className="bg-green-500 text-white px-4 py-2 rounded-md text-sm hover:bg-green-600"
            >
              Baixar Modelo da Planilha
            </button>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecione a planilha com os produtos
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>

            {erro && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                {erro}
              </div>
            )}

            {sucesso && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-md text-sm">
                {sucesso}
              </div>
            )}

            {produtos.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Produtos Carregados</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left">Código</th>
                        <th className="px-4 py-2 text-left">Nome</th>
                        <th className="px-4 py-2 text-left">Categoria</th>
                        <th className="px-4 py-2 text-right">Preço</th>
                        <th className="px-4 py-2 text-left">Unidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {produtos.map((produto, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="px-4 py-2">{produto.codigo}</td>
                          <td className="px-4 py-2">{produto.nome}</td>
                          <td className="px-4 py-2">{produto.categoria}</td>
                          <td className="px-4 py-2 text-right">R$ {produto.preco.toFixed(2)}</td>
                          <td className="px-4 py-2">{produto.unidade || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleImportar}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm hover:bg-blue-700"
                  >
                    Importar Produtos
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 