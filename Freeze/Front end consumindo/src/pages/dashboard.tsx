import React from 'react';
import Dados from '@/components/consumir/Dados';
import Header from '@/components/Header';
import Footer from '@/components/Footer-sistema';

const DashboardPage = () => {
  return (
    <div>
      <Header />
      <Dados />
      <Footer />
    </div>
  );
};

export default DashboardPage;