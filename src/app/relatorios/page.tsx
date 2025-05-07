'use client';
import React, { useEffect, useState } from 'react';

const Relatorios: React.FC = () => {
  const [vendas, setVendas] = useState([]);

  useEffect(() => {
    // Carregar vendas do localStorage
    if (typeof window !== 'undefined') {
      const vendasSalvas = localStorage.getItem('vendas');
      if (vendasSalvas) {
        setVendas(JSON.parse(vendasSalvas));
      }
    }
  }, []);

  return (
    <div>
      {/* Renderização do componente */}
    </div>
  );
};

export default Relatorios; 