import React from 'react';
import AnaliseAudio from '@/components/Analise-Audio'; // Importando o novo componente
import Header from '@/components/Header';

const AnalisarAudioPage = () => {
  return (
    <div>
        <Header/>
      <AnaliseAudio /> 
    </div>
  );
};

export default AnalisarAudioPage;
