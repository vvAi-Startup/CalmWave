import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { FiSearch, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface AudioItem {
  id: string;
  nome_audio: string;
  tipo_ruido: string;
  data_identificacao: string;
  tempo_resposta: number;
}

const AudioList = () => {
  const [audios, setAudios] = useState<AudioItem[]>([]);
  const [filteredAudios, setFilteredAudios] = useState<AudioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({
    tipo: 'todos',
    dataInicio: '',
    dataFim: ''
  });
  
  const router = useRouter();
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchAudios = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ia/datas`);
        if (!response.ok) throw new Error('Falha ao carregar os dados');
        const data = await response.json();
        setAudios(data);
        setFilteredAudios(data);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchAudios();
  }, []);

  useEffect(() => {
    let result = audios;

    if (search) {
      result = result.filter(audio => 
        audio.nome_audio.toLowerCase().includes(search.toLowerCase()) ||
        audio.tipo_ruido.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filter.tipo !== 'todos') {
      result = result.filter(audio => audio.tipo_ruido === filter.tipo);
    }

    if (filter.dataInicio) {
      result = result.filter(audio => 
        new Date(audio.data_identificacao) >= new Date(filter.dataInicio)
      );
    }
    if (filter.dataFim) {
      result = result.filter(audio => 
        new Date(audio.data_identificacao) <= new Date(filter.dataFim)
      );
    }

    setFilteredAudios(result);
    setCurrentPage(1);
  }, [search, filter, audios]);

  const totalPages = Math.ceil(filteredAudios.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAudios = filteredAudios.slice(startIndex, endIndex);

  if (loading) return (
    <div className="min-h-[600px] flex justify-center items-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-[600px] flex justify-center items-center">
      <div className="text-red-500 text-center p-6 bg-red-100 rounded-lg shadow-lg max-w-md">
        <FiFilter className="w-12 h-12 mx-auto mb-4" />
        {error}
      </div>
    </div>
  );

  return (
    <div className="min-h-[600px] space-y-6">
      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg backdrop-blur-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative group">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar áudios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 border border-gray-200 dark:border-gray-600"
            />
          </div>

          <select
            value={filter.tipo}
            onChange={(e) => setFilter({...filter, tipo: e.target.value})}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            <option value="todos">Todos os tipos</option>
            <option value="ambulance">Ambulância</option>
            <option value="dog">Cachorro</option>
            <option value="firetruck">Caminhão de Bombeiros</option>
            <option value="traffic">Tráfego</option>
          </select>

          <input
            type="date"
            value={filter.dataInicio}
            onChange={(e) => setFilter({...filter, dataInicio: e.target.value})}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 border border-gray-200 dark:border-gray-600"
          />

          <input
            type="date"
            value={filter.dataFim}
            onChange={(e) => setFilter({...filter, dataFim: e.target.value})}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 border border-gray-200 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Lista de Áudios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[400px]">
        {currentAudios.map((audio) => (
          <div
            key={audio.id}
            onClick={() => router.push(`/Audios/details/${audio.id}`)}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 border border-gray-200 dark:border-gray-700 backdrop-blur-lg"
          >
            <div className="flex flex-col h-full">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 line-clamp-2">
                {audio.nome_audio}
              </h3>
              <div className="flex-grow space-y-3">
                <p className="text-gray-600 dark:text-gray-300 flex items-center bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                  <FiFilter className="mr-2 text-blue-500" />
                  {audio.tipo_ruido}
                </p>
                <p className="text-gray-600 dark:text-gray-300 flex items-center">
                  <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                  {new Date(audio.data_identificacao).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg hover:shadow-xl transition-shadow">
                  {audio.tempo_resposta.toFixed(2)}s
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-6 mt-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-300 disabled:cursor-not-allowed"
          >
            <FiChevronLeft className="w-6 h-6" />
          </button>
          
          <span className="text-gray-600 dark:text-gray-300 font-medium">
            Página {currentPage} de {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-300 disabled:cursor-not-allowed"
          >
            <FiChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioList;