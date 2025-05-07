"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Sair() {
  const router = useRouter();

  useEffect(() => {
    localStorage.clear();
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-600">Saindo...</p>
    </div>
  );
} 