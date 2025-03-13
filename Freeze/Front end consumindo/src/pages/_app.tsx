import { Toaster } from 'react-hot-toast';
import ProtectedRoute from '../components/ProtectedRoute';
import type { AppProps } from 'next/app';
import '../styles/globals.css';

function MyApp({ Component, pageProps, router }: AppProps) {
  const publicRoutes = ['/', '/Login'];
  const isPublicRoute = publicRoutes.includes(router.pathname);

  return (
    <>
      <Toaster position="top-right" />
      {isPublicRoute ? (
        <Component {...pageProps} />
      ) : (
        <ProtectedRoute>
          <Component {...pageProps} />
        </ProtectedRoute>
      )}
    </>
  );
}

export default MyApp;
