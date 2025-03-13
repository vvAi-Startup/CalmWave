import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '@/components/Header';

interface AudioDetails {
  id: string;
  data_identificacao: string;
  horario_identificacao: string;
  nome_audio: string;
  tempo_resposta: number;
  tipo_ruido: string;
  espectrograma: string;
  forma_de_onda: string;
  audio: string;
}

const AudioDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const [audioDetails, setAudioDetails] = useState<AudioDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAudioDetails = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ia/data/${id}`);
        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setAudioDetails(data);
      } catch (error) {
        setError(`Erro ao carregar detalhes do áudio: ${(error as Error).message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAudioDetails();
  }, [id]);

  const renderContent = (path: string | undefined, fieldName: string) => {
    if (!path) return null;
    const fullUrl = `${process.env.NEXT_PUBLIC_API_URL}/uploads/${path}`;

    return (
      <div className="bg-gray-800/40 rounded-2xl p-8 backdrop-blur-sm border border-gray-700/30 shadow-2xl">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 mb-6">
          {fieldName === 'espectrograma' && 'Espectrograma'}
          {fieldName === 'forma_de_onda' && 'Forma de Onda'}
          {fieldName === 'audio' && 'Áudio Original'}
        </h2>
        
        <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/30">
          {fieldName === 'espectrograma' || fieldName === 'forma_de_onda' ? (
            <img 
              src={fullUrl}
              alt={fieldName}
              className="w-full h-auto object-contain max-h-[500px] rounded-lg hover:scale-[1.02] transition-transform duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement?.insertAdjacentHTML(
                  'beforeend',
                  '<p class="text-red-400 p-4 text-center font-medium">Erro ao carregar imagem</p>'
                );
              }}
            />
          ) : fieldName === 'audio' ? (
            <audio 
              controls 
              className="w-full"
              src={fullUrl}
            >
              Seu navegador não suporta o elemento de áudio.
            </audio>
          ) : null}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl backdrop-blur-sm">
        {error}
      </div>
    </div>
  );

  if (!audioDetails) return null;

  return (
    <>
      <Header/> 
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="bg-gray-800/40 rounded-2xl p-8 mb-8 backdrop-blur-sm border border-gray-700/30 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
              Detalhes do Áudio
            </h1>
            <button 
              onClick={() => router.back()}
              className="bg-gray-700/50 hover:bg-gray-600/50 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-600/30"
            >
              Voltar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700/30">
              <p className="text-sm text-gray-400 mb-2">Nome do Áudio</p>
              <p className="text-lg font-semibold text-white">
                {audioDetails.nome_audio}
              </p>
            </div>
            <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700/30">
              <p className="text-sm text-gray-400 mb-2">Tipo de Ruído</p>
              <p className="text-lg font-semibold text-white capitalize">
                {audioDetails.tipo_ruido}
              </p>
            </div>
            <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700/30">
              <p className="text-sm text-gray-400 mb-2">Tempo de Resposta</p>
              <p className="text-lg font-semibold text-white">
                {audioDetails.tempo_resposta.toFixed(3)}s
              </p>
            </div>
          </div>
        </div>

        {/* Informações de Data/Hora */}
        <div className="bg-gray-800/40 rounded-2xl p-8 mb-8 backdrop-blur-sm border border-gray-700/30 shadow-2xl">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 mb-6">
            Informações de Identificação
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700/30">
              <p className="text-sm text-gray-400 mb-2">Data de Identificação</p>
              <p className="text-lg font-semibold text-white">
                {new Date(audioDetails.data_identificacao).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700/30">
              <p className="text-sm text-gray-400 mb-2">Horário de Identificação</p>
              <p className="text-lg font-semibold text-white">
                {new Date(audioDetails.horario_identificacao).toLocaleTimeString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        {/* Grid de Visualizações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {renderContent(audioDetails.espectrograma, 'espectrograma')}
          {renderContent(audioDetails.forma_de_onda, 'forma_de_onda')}
        </div>

        {/* Player de Áudio */}
        <div className="mt-8">
          {renderContent(audioDetails.audio, 'audio')}
        </div>
      </div>
      </div>
    </>
  );
};

export default AudioDetails;
