import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '@/components/Header';
import { FaAmbulance, FaCar } from 'react-icons/fa';
import { GiDogBowl, GiMineTruck, GiSoundWaves, GiWaveSurfer } from 'react-icons/gi';
import { BsClock, BsCalendarEvent, BsBarChartFill, BsInfoCircle, BsArrowLeft } from 'react-icons/bs';
import { BiShare, BiDownload } from 'react-icons/bi';
import { IoMdTimer } from 'react-icons/io';
import { MdContentCopy } from 'react-icons/md';

interface AudioDetails {
  id: string;
  nome_audio: string;
  tipo_ruido: string;
  data_identificacao: string;
  horario_identificacao: string;
  tempo_resposta: number;
  audio: string;
  espectrograma: string;
  forma_de_onda: string;
}

const AudioDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const [audioDetails, setAudioDetails] = useState<AudioDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getIcon = (tipo: string) => {
    const icons: {[key: string]: JSX.Element} = {
      'ambulance': <FaAmbulance className="text-2xl" />,
      'dog': <GiDogBowl className="text-2xl" />,
      'firetruck': <GiMineTruck className="text-2xl" />,
      'traffic': <FaCar className="text-2xl" />
    };
    return icons[tipo.toLowerCase()] || <GiSoundWaves className="text-2xl" />;
  };

  useEffect(() => {
    const fetchAudioDetails = async () => {
      if (!id) return;

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ia/data/${id}`);
        console.log(`Resposta da API: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          throw new Error(`Erro ao buscar o resultado: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setAudioDetails(data);
      } catch (error) {
        console.error('Erro ao buscar o resultado:', error);
        setError('Erro ao buscar o resultado: ' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchAudioDetails();
  }, [id]);

  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatarHora = (dataString: string) => {
    return new Date(dataString).toLocaleTimeString('pt-BR');
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Adicionar notificação de sucesso aqui
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
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
                Análise de Áudio
              </h1>
              {getIcon(audioDetails.tipo_ruido)}
            </div>
            <button 
              onClick={() => router.back()}
              className="bg-gray-700/50 hover:bg-gray-600/50 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-600/30 flex items-center gap-2"
            >
              <BsArrowLeft /> Voltar
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/30">
              <p className="text-gray-400 text-sm mb-2 flex items-center gap-2"><GiSoundWaves /> Nome do Arquivo</p>
              <p className="text-white text-lg font-medium">{audioDetails.nome_audio}</p>
            </div>
            <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/30">
              <p className="text-gray-400 text-sm mb-2 flex items-center gap-2">{getIcon(audioDetails.tipo_ruido)} Tipo de Ruído</p>
              <p className="text-white text-lg font-medium capitalize">{audioDetails.tipo_ruido}</p>
            </div>
            <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/30">
              <p className="text-gray-400 text-sm mb-2 flex items-center gap-2"><BsClock /> Tempo de Processamento</p>
              <p className="text-white text-lg font-medium">{audioDetails.tempo_resposta.toFixed(3)}s</p>
            </div>
          </div>
        </div>

        {/* Player de Áudio */}
        <div className="bg-gray-800/40 rounded-2xl p-8 mb-8 backdrop-blur-sm border border-gray-700/30 shadow-2xl">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 mb-6 flex items-center gap-2">
            <GiSoundWaves /> Áudio Original
          </h2>
          <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/30">
            <audio 
              controls 
              className="w-full"
              src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${audioDetails.audio}`}
            >
              Seu navegador não suporta o elemento de áudio.
            </audio>
          </div>
        </div>

        {/* Visualizações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Espectrograma */}
          <div className="bg-gray-800/40 rounded-2xl p-8 backdrop-blur-sm border border-gray-700/30 shadow-2xl">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 mb-6 flex items-center gap-2">
              <BsBarChartFill /> Espectrograma
            </h2>
            <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30">
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${audioDetails.espectrograma}`}
                alt="Espectrograma"
                className="w-full h-auto rounded-lg object-contain hover:scale-[1.02] transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-image.png';
                }}
              />
            </div>
          </div>

          {/* Forma de Onda */}
          <div className="bg-gray-800/40 rounded-2xl p-8 backdrop-blur-sm border border-gray-700/30 shadow-2xl">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 mb-6 flex items-center gap-2">
              <GiWaveSurfer /> Forma de Onda
            </h2>
            <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30">
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${audioDetails.forma_de_onda}`}
                alt="Forma de Onda"
                className="w-full h-auto rounded-lg object-contain hover:scale-[1.02] transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-image.png';
                }}
              />
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="bg-gray-800/40 rounded-2xl p-8 mt-8 backdrop-blur-sm border border-gray-700/30 shadow-2xl">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 mb-6 flex items-center gap-2">
            <BsInfoCircle /> Informações Adicionais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/30">
              <p className="text-gray-400 text-sm mb-2 flex items-center gap-2"><BsCalendarEvent /> Data de Identificação</p>
              <p className="text-white text-lg font-medium">{formatarData(audioDetails.data_identificacao)}</p>
            </div>
            <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/30">
              <p className="text-gray-400 text-sm mb-2 flex items-center gap-2"><BsClock /> Horário de Identificação</p>
              <p className="text-white text-lg font-medium">{formatarHora(audioDetails.horario_identificacao)}</p>
            </div>
          </div>
        </div>

        {/* Métricas Adicionais */}
        <div className="bg-gray-800/40 rounded-2xl p-8 mb-8 backdrop-blur-sm border border-gray-700/30 shadow-2xl">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 mb-6">
            Métricas Detalhadas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700/30">
              <div className="flex items-center gap-2 text-purple-400 mb-2">
                <IoMdTimer className="text-xl" />
                <span>Processamento Total</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {audioDetails?.tempo_resposta.toFixed(3)}s
              </p>
            </div>
            {/* Adicione mais métricas aqui */}
          </div>
        </div>

        {/* Timeline de Processamento */}
        <div className="bg-gray-800/40 rounded-2xl p-8 mb-8 backdrop-blur-sm border border-gray-700/30 shadow-2xl">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 mb-6">
            Timeline de Processamento
          </h2>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500/20"></div>
            <div className="space-y-6 pl-8">
              <div className="relative">
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-purple-500"></div>
                <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30">
                  <p className="text-sm text-gray-400">Upload Iniciado</p>
                  <p className="text-white">{new Date(audioDetails?.data_identificacao || '').toLocaleTimeString()}</p>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-purple-500"></div>
                <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30">
                  <p className="text-sm text-gray-400">Análise Concluída</p>
                  <p className="text-white">{new Date(audioDetails?.horario_identificacao || '').toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Ações */}
        <div className="fixed bottom-8 right-8 flex flex-col gap-4">
          <button 
            onClick={() => handleDownload(`${process.env.NEXT_PUBLIC_API_URL}/uploads/${audioDetails?.audio}`, audioDetails?.nome_audio || 'audio.wav')}
            className="p-3 bg-purple-600 hover:bg-purple-700 rounded-full text-white shadow-lg transition-all duration-300"
            title="Baixar Áudio"
          >
            <BiDownload size={24} />
          </button>
          <button 
            onClick={() => copyToClipboard(window.location.href)}
            className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full text-white shadow-lg transition-all duration-300"
            title="Compartilhar Link"
          >
            <BiShare size={24} />
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default AudioDetails;
