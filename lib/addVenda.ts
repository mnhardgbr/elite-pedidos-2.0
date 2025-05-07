import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const addVenda = async (categoria: string, valor: number) => {
  await addDoc(collection(db, 'vendas'), {
    categoria,
    valor,
    criadoEm: serverTimestamp(),
  });
}; 