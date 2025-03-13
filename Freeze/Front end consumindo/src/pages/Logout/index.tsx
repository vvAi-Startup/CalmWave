import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    // Remove o token JWT do localStorage
    localStorage.removeItem('token');
    
    // Redireciona para a página inicial
    router.push('/');
  }, []);

  // Retorna null pois esta página não precisa renderizar nada
  return null;
}
