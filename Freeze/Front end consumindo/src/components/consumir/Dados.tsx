import React, { useState, useEffect } from 'react';
import ConsumirDados, { GraficoBarras, GraficoPizza, ListagemCompleta, RankingTempoResposta } from './index';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FiDownload } from 'react-icons/fi';
import { BiBarChart, BiTime, BiCalendar, BiTargetLock, BiCalendarAlt } from 'react-icons/bi';

interface MetricaCardProps {
  titulo: string;
  valor: string | number;
  icone: React.ReactNode;
  descricao?: string;
}

interface DadosAudio {
  audio: string;
  data_identificacao: string;
  espectrograma: string;
  forma_de_onda: string;
  horario_identificacao: string;
  id: string;
  nome_audio: string;
  tempo_resposta: number;
  tipo_ruido: string;
  confianca?: number;
  duracao?: number;
}

const Dados = () => {
  const [mostrarListagem, setMostrarListagem] = useState(false);
  const [dados, setDados] = useState<DadosAudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);

  const calcularMediaTempo = (dados: DadosAudio[]): string => {
    if (dados.length === 0) return '0.00s';
    const media = dados.reduce((acc, item) => acc + item.tempo_resposta, 0) / dados.length;
    return `${media.toFixed(2)}s`;
  };

  const calcularMediaConfianca = (dados: DadosAudio[]): string => {
    if (dados.length === 0) return '0';
    const mediaConfianca = dados.reduce((acc, item) => acc + (item.confianca || 0), 0) / dados.length;
    return mediaConfianca.toFixed(1);
  };

  const formatarDuracaoTotal = (dados: DadosAudio[]): string => {
    const duracaoTotal = dados.reduce((acc, item) => acc + (item.duracao || 0), 0);
    const minutos = Math.floor(duracaoTotal / 60);
    const segundos = Math.floor(duracaoTotal % 60);
    return `${minutos}m ${segundos}s`;
  };

  const gerarPDF = async () => {
    if (gerando) return;
    
    const dashboardMetricas = document.getElementById('dashboard-metricas');
    const dashboardGraficos = document.getElementById('dashboard-graficos');
    
    if (!dashboardMetricas || !dashboardGraficos) {
      setError('Elementos não encontrados para gerar PDF');
      return;
    }

    try {
      setGerando(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasMetricas = await html2canvas(dashboardMetricas, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#1a1a1a'
      });
      
      const metricasWidth = pdfWidth - 20;
      const metricasHeight = (metricasWidth * canvasMetricas.height) / canvasMetricas.width;
      pdf.addImage(
        canvasMetricas.toDataURL('image/png'), 
        'PNG', 
        10,
        10,
        metricasWidth,
        metricasHeight
      );
      
      pdf.addPage();
      
      const canvasGraficos = await html2canvas(dashboardGraficos, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#1a1a1a'
      });
      
      const graficosWidth = pdfWidth - 20;
      const graficosHeight = (graficosWidth * canvasGraficos.height) / canvasGraficos.width;
      
      const escalaGraficos = Math.min(1, (pdfHeight - 20) / graficosHeight);
      const alturaFinal = graficosHeight * escalaGraficos;
      
      pdf.addImage(
        canvasGraficos.toDataURL('image/png'),
        'PNG',
        10,
        10,
        graficosWidth * escalaGraficos,
        alturaFinal
      );
      
      pdf.save('dashboard-analise-ruidos.pdf');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      setError('Não foi possível gerar o PDF. Por favor, tente novamente.');
    } finally {
      setGerando(false);
    }
  };

  const calcularEstatisticasPorDia = (dados: DadosAudio[]) => {
    const estatisticas = dados.reduce((acc, item) => {
      const data = new Date(item.data_identificacao).toLocaleDateString();
      if (!acc[data]) {
        acc[data] = { total: 0, tipos: {} };
      }
      acc[data].total++;
      acc[data].tipos[item.tipo_ruido] = (acc[data].tipos[item.tipo_ruido] || 0) + 1;
      return acc;
    }, {} as Record<string, { total: number, tipos: Record<string, number> }>);
    return estatisticas;
  };

  const calcularAnalisesPorPeriodo = (dados: DadosAudio[]) => {
    const periodos = {
      madrugada: 0,
      manha: 0,
      tarde: 0,
      noite: 0
    };

    dados.forEach(dado => {
      const hora = new Date(dado.horario_identificacao).getHours();
      
      if (hora >= 0 && hora < 6) periodos.madrugada++;
      else if (hora >= 6 && hora < 12) periodos.manha++;
      else if (hora >= 12 && hora < 18) periodos.tarde++;
      else periodos.noite++;
    });

    return periodos;
  };

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ia/datas`);
        if (!response.ok) {
          throw new Error(`Erro ao buscar dados: ${response.status}`);
        }
        const data = await response.json();
        setDados(data);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setError('Erro ao carregar os dados');
      } finally {
        setLoading(false);
      }
    };

    fetchDados();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-red-500 text-xl text-center">{error}</div>
      </div>
    );
  }

  const MetricaCard: React.FC<MetricaCardProps> = ({ titulo, valor, icone, descricao }) => (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700">
      <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
        <span className="text-2xl sm:text-3xl bg-gray-700 p-3 sm:p-4 rounded-lg shadow-inner">{icone}</span>
        <div className="text-center sm:text-left">
          <h4 className="text-sm font-medium text-gray-300">{titulo}</h4>
          <p className="text-xl sm:text-2xl font-bold text-purple-400">{valor}</p>
          {descricao && (
            <p className="text-xs text-gray-400 mt-1">{descricao}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 py-6 sm:py-12">
      <div className="container mx-auto px-4">
        {dados.length === 0 ? (
          <div className="text-center text-gray-400 p-4">
            <p className="text-xl">Nenhum dado encontrado</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
              <h2 className="text-2xl sm:text-4xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent text-center sm:text-left">
                Dashboard de Análise de Ruídos
              </h2>
              <button
                onClick={gerarPDF}
                disabled={gerando}
                className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 ${gerando ? 'bg-gray-600' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'} text-white rounded-lg shadow-lg transition-all duration-300 flex items-center justify-center`}
              >
                {gerando ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <FiDownload className="mr-2" />
                    Exportar PDF
                  </>
                )}
              </button>
            </div>

            <div id="dashboard-metricas" className="mb-8 sm:mb-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                <MetricaCard 
                  titulo="Total de Análises"
                  valor={dados.length}
                  icone={<BiBarChart size={24} />}
                  descricao="Total de áudios processados"
                />
                <MetricaCard 
                  titulo="Média de Tempo"
                  valor={calcularMediaTempo(dados)}
                  icone={<BiTime size={24} />}
                  descricao="Tempo médio de processamento"
                />
                <MetricaCard 
                  titulo="Análises Hoje"
                  valor={dados.filter(d => new Date(d.data_identificacao).toDateString() === new Date().toDateString()).length}
                  icone={<BiCalendar size={24} />}
                  descricao="Análises realizadas hoje"
                />
                <MetricaCard 
                  titulo="Tipos Únicos"
                  valor={new Set(dados.map(d => d.tipo_ruido)).size}
                  icone={<BiTargetLock size={24} />}
                  descricao="Tipos diferentes de ruídos"
                />
                <MetricaCard 
                  titulo="Tempo Médio/Dia"
                  valor={`${(dados.length / (new Set(dados.map(d => d.data_identificacao)).size)).toFixed(1)}`}
                  icone={<BiCalendarAlt size={24} />}
                  descricao="Média de análises por dia"
                />
              </div>
            </div>

            <div id="dashboard-graficos" className="mb-8 sm:mb-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-8">
                <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 text-white text-center sm:text-left">
                    Distribuição de Tipos de Ruído
                  </h3>
                  <div className="h-48 sm:h-64">
                    <GraficoPizza dados={dados} />
                  </div>    
                </div>

                <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 text-white text-center sm:text-left">
                    Tempo de Resposta Médio por Tipo
                  </h3>
                  <div className="h-48 sm:h-64">
                    <GraficoBarras dados={dados} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 text-white text-center sm:text-left">
                    Ranking de Tempo de Resposta
                  </h3>
                  <RankingTempoResposta dados={dados} />
                </div>

                <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 text-white text-center sm:text-left">
                    Análises por Período do Dia
                  </h3>
                  <div className="h-48 sm:h-64 flex items-center justify-center">
                    {(() => {
                      const periodos = calcularAnalisesPorPeriodo(dados);
                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 w-full max-w-2xl">
                          {Object.entries(periodos).map(([periodo, quantidade]) => (
                            <div key={periodo} className="bg-gray-700 p-3 sm:p-4 rounded-lg hover:bg-gray-600 transition-colors duration-300">
                              <h4 className="text-xs sm:text-sm font-medium text-gray-300 capitalize text-center">
                                {periodo}
                              </h4>
                              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-400 text-center mt-1">
                                {quantidade}
                              </p>
                              <p className="text-xs text-gray-400 text-center mt-1">
                                análises
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dados;
