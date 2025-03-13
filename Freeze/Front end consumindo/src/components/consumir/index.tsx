import React, { useEffect, useState } from 'react';
import { saveAs } from 'file-saver';
import XLSX from 'xlsx';
import { useRouter } from 'next/router';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const ConsumirDados = () => {
  const [dados, setDados] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tipoRuidoSelecionado, setTipoRuidoSelecionado] = useState<string | null>(null);
  const [visualizacaoCompleta, setVisualizacaoCompleta] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const fetchDados = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ia/datas`);
        if (!response.ok) {
          throw new Error(`Erro ao buscar os dados: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (data.length === 0) {
          setErrorMessage('Nenhum dado encontrado.');
        } else {
          const dadosOrdenados = data.sort((a: any, b: any) => {
            const dataA = new Date(`${a.data_identificacao} ${a.horario_identificacao}`);
            const dataB = new Date(`${b.data_identificacao} ${b.horario_identificacao}`);
            return dataB.getTime() - dataA.getTime();
          });
          setDados(dadosOrdenados);
        }
      } catch (error) {
        console.error('Erro ao buscar os dados:', error);
        setErrorMessage('Erro ao buscar os dados: ' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchDados();
  }, []);

  if (loading) {
    return <p className="text-center text-lg dark:text-gray-200 text-gray-700">Carregando...</p>;
  }

  if (errorMessage) {
    return <p className="text-red-500 text-center font-semibold">{errorMessage}</p>;
  }

  const dadosPorTipoRuido = dados.reduce((acc, item) => {
    (acc[item.tipo_ruido] = acc[item.tipo_ruido] || []).push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const tiposRuido = Object.keys(dadosPorTipoRuido);

  // Dados para o gráfico de pizza de distribuição de tipos de ruído
  const dadosGraficoPizza = {
    labels: tiposRuido,
    datasets: [{
      data: tiposRuido.map(tipo => dadosPorTipoRuido[tipo].length),
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF'
      ]
    }]
  };

  // Dados para o gráfico de barras de tempo de resposta médio
  const tempoRespostaMedio = tiposRuido.map(tipo => {
    const tempoMedio = dadosPorTipoRuido[tipo].reduce((acc, item) => acc + item.tempo_resposta, 0) / dadosPorTipoRuido[tipo].length;
    return tempoMedio.toFixed(2);
  });

  const dadosGraficoBarras = {
    labels: tiposRuido,
    datasets: [{
      label: 'Tempo de Resposta Médio (ms)',
      data: tempoRespostaMedio,
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };

  // Ranking de áudios por tempo de resposta
  const rankingTempoResposta = [...dados].sort((a, b) => a.tempo_resposta - b.tempo_resposta).slice(0, 5);

  const gerarExcel = () => {
    let dadosParaExcel;
    if (visualizacaoCompleta) {
      dadosParaExcel = dados;
    } else if (tipoRuidoSelecionado) {
      dadosParaExcel = dadosPorTipoRuido[tipoRuidoSelecionado];
    } else {
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dadosParaExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `dados_${visualizacaoCompleta ? 'completos' : tipoRuidoSelecionado}.xlsx`);
  };

  const renderizarListaDados = (dadosParaExibir: any[]) => (
    <ul className="space-y-4">
      {dadosParaExibir.map((item: any, index: number) => (
        <li
          key={index}
          className="p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-md transition-transform transform hover:shadow-xl hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
          onClick={() => router.push(`/Audios/details?id=${item.id}`)}
        >
          <div className="flex flex-col">
            <p className="font-medium text-gray-800 dark:text-gray-200">
              <span className="font-semibold text-gray-600 dark:text-gray-400">ID:</span> {item.id}
            </p>
            <p className="font-medium text-gray-800 dark:text-gray-200">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Data Identificação:</span> {item.data_identificacao}
            </p>
            <p className="font-medium text-gray-800 dark:text-gray-200">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Horário Identificação:</span> {item.horario_identificacao}
            </p>
            <p className="font-medium text-gray-800 dark:text-gray-200">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Nome do Áudio:</span> {item.nome_audio}
            </p>
            <p className="font-medium text-gray-800 dark:text-gray-200">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Tempo de Resposta:</span> {item.tempo_resposta}
            </p>
            <p className="font-medium text-gray-800 dark:text-gray-200">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Tipo de Ruído:</span> {item.tipo_ruido}
            </p>
          </div>
          <hr className="my-2 border-gray-300 dark:border-gray-700" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="container mx-auto px-6 py-12 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">Dashboard de Análise de Ruídos</h2>

      {/* Seção de Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Distribuição de Tipos de Ruído</h3>
          <div className="h-64">
            <Pie data={dadosGraficoPizza} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Tempo de Resposta Médio por Tipo</h3>
          <div className="h-64">
            <Bar data={dadosGraficoBarras} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Ranking de Tempo de Resposta */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Top 5 - Menor Tempo de Resposta</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-4 py-2 text-gray-800 dark:text-white">Posição</th>
                <th className="px-4 py-2 text-gray-800 dark:text-white">Nome do Áudio</th>
                <th className="px-4 py-2 text-gray-800 dark:text-white">Tipo de Ruído</th>
                <th className="px-4 py-2 text-gray-800 dark:text-white">Tempo de Resposta (ms)</th>
              </tr>
            </thead>
            <tbody>
              {rankingTempoResposta.map((item, index) => (
                <tr key={index} className="border-b dark:border-gray-700">
                  <td className="px-4 py-2 text-center text-gray-800 dark:text-gray-200">{index + 1}º</td>
                  <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{item.nome_audio}</td>
                  <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{item.tipo_ruido}</td>
                  <td className="px-4 py-2 text-right text-gray-800 dark:text-gray-200">{item.tempo_resposta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Controles de Visualização */}
      <div className="mb-6">
        <div className="flex justify-center space-x-4 mb-4">
          <button
            onClick={() => {
              setVisualizacaoCompleta(false);
              setTipoRuidoSelecionado(null);
            }}
            className={`px-4 py-2 rounded-lg ${!visualizacaoCompleta && !tipoRuidoSelecionado ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
          >
            Selecionar Tipo
          </button>
          <button
            onClick={() => {
              setVisualizacaoCompleta(true);
              setTipoRuidoSelecionado(null);
            }}
            className={`px-4 py-2 rounded-lg ${visualizacaoCompleta ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
          >
            Todos os Dados
          </button>
        </div>

        {!visualizacaoCompleta && (
          <div className="flex justify-center space-x-4 flex-wrap">
            {tiposRuido.map((tipoRuido) => (
              <button
                key={tipoRuido}
                onClick={() => setTipoRuidoSelecionado(tipoRuido)}
                className={`px-4 py-2 rounded-lg mb-2 ${tipoRuidoSelecionado === tipoRuido ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
              >
                {tipoRuido}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Dados */}
      {visualizacaoCompleta ? (
        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Todos os Dados</h3>
          {renderizarListaDados(dados)}
          <button
            onClick={gerarExcel}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Gerar Excel Completo
          </button>
        </div>
      ) : (
        tipoRuidoSelecionado && (
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">{tipoRuidoSelecionado}</h3>
            {dadosPorTipoRuido[tipoRuidoSelecionado]?.length === 0 ? (
              <p className="text-center text-lg text-gray-600 dark:text-gray-400">Nenhum dado encontrado para o tipo de ruído selecionado.</p>
            ) : (
              <>
                {renderizarListaDados(dadosPorTipoRuido[tipoRuidoSelecionado])}
                <button
                  onClick={gerarExcel}
                  className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Gerar Excel
                </button>
              </>
            )}
          </div>
        )
      )}
      
      <footer className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} Marcelitos dev Enterprise. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

// Exportar os subcomponentes separadamente
const GraficoPizza = ({ dados }: { dados: any[] }) => {
  const dadosPorTipoRuido = dados.reduce((acc, item) => {
    (acc[item.tipo_ruido] = acc[item.tipo_ruido] || []).push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const tiposRuido = Object.keys(dadosPorTipoRuido);

  const dadosGraficoPizza = {
    labels: tiposRuido,
    datasets: [{
      data: tiposRuido.map(tipo => dadosPorTipoRuido[tipo].length),
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF'
      ]
    }]
  };

  return <Pie data={dadosGraficoPizza} options={{ maintainAspectRatio: false }} />;
};

const GraficoBarras = ({ dados }: { dados: any[] }) => {
  const dadosPorTipoRuido = dados.reduce((acc, item) => {
    (acc[item.tipo_ruido] = acc[item.tipo_ruido] || []).push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const tiposRuido = Object.keys(dadosPorTipoRuido);

  const tempoRespostaMedio = tiposRuido.map(tipo => {
    const tempoMedio = dadosPorTipoRuido[tipo].reduce((acc, item) => acc + item.tempo_resposta, 0) / dadosPorTipoRuido[tipo].length;
    return tempoMedio.toFixed(2);
  });

  const dadosGraficoBarras = {
    labels: tiposRuido,
    datasets: [{
      label: 'Tempo de Resposta Médio (ms)',
      data: tempoRespostaMedio,
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };

  return <Bar data={dadosGraficoBarras} options={{ maintainAspectRatio: false }} />;
};

const RankingTempoResposta = ({ dados }: { dados: any[] }) => {
  const rankingTempoResposta = [...dados]
    .sort((a, b) => a.tempo_resposta - b.tempo_resposta)
    .slice(0, 5);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-700">
            <th className="px-4 py-2 text-gray-800 dark:text-white">Posição</th>
            <th className="px-4 py-2 text-gray-800 dark:text-white">Nome do Áudio</th>
            <th className="px-4 py-2 text-gray-800 dark:text-white">Tipo de Ruído</th>
            <th className="px-4 py-2 text-gray-800 dark:text-white">Tempo de Resposta (ms)</th>
          </tr>
        </thead>
        <tbody>
          {rankingTempoResposta.map((item, index) => (
            <tr key={index} className="border-b dark:border-gray-700">
              <td className="px-4 py-2 text-center text-gray-800 dark:text-gray-200">{index + 1}º</td>
              <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{item.nome_audio}</td>
              <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{item.tipo_ruido}</td>
              <td className="px-4 py-2 text-right text-gray-800 dark:text-gray-200">{item.tempo_resposta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ListagemCompleta = ({ dados }: { dados: any[] }) => {
  const router = useRouter();

  return (
    <ul className="space-y-4">
      {dados.map((item: any, index: number) => (
        <li
          key={index}
          className="p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-md transition-transform transform hover:shadow-xl hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
          onClick={() => router.push(`/Audios/details?id=${item.id}`)}
        >
          <div className="flex flex-col">
            <p className="font-medium text-gray-800 dark:text-gray-200">
              <span className="font-semibold text-gray-600 dark:text-gray-400">ID:</span> {item.id}
            </p>
            <p className="font-medium text-gray-800 dark:text-gray-200">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Data Identificação:</span>{' '}
              {item.data_identificacao}
            </p>
            <p className="font-medium text-gray-800 dark:text-gray-200">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Horário Identificação:</span>{' '}
              {item.horario_identificacao}
            </p>
            <p className="font-medium text-gray-800 dark:text-gray-200">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Nome do Áudio:</span>{' '}
              {item.nome_audio}
            </p>
            <p className="font-medium text-gray-800 dark:text-gray-200">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Tempo de Resposta:</span>{' '}
              {item.tempo_resposta}
            </p>
            <p className="font-medium text-gray-800 dark:text-gray-200">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Tipo de Ruído:</span>{' '}
              {item.tipo_ruido}
            </p>
          </div>
          <hr className="my-2 border-gray-300 dark:border-gray-700" />
        </li>
      ))}
    </ul>
  );
};

// Exportar tudo junto
export {
  ConsumirDados as default,
  GraficoPizza,
  GraficoBarras,
  RankingTempoResposta,
  ListagemCompleta
};
