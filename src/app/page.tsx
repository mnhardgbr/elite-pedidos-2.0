import { redirect } from 'next/navigation';
 
export default function Home() {
  // Redireciona automaticamente para a página de login
  redirect('/login');
} 