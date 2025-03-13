import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { motion } from "framer-motion";
import { 
  FaMicrophone, 
  FaChartBar, 
  FaTachometerAlt, 
  FaHistory, 
  FaSearch,
  FaBell
} from "react-icons/fa";
import { BsArrowRight } from "react-icons/bs";
import Link from "next/link";
import Footer from "@/components/Footer-sistema";

interface RecentAnalysis {
  id: string;
  nome_audio: string;
  tipo_ruido: string;
  data_identificacao: string;
  tempo_resposta: number;
}

interface Stats {
  total_analises: number;
  media_tempo_resposta: number;
  tipos_ruido: { [key: string]: number };
}

export default function Home() {
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar análises recentes (limitado a 5)
        const analysesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ia/datas?limit=5`);
        if (!analysesResponse.ok) {
          throw new Error('Erro na resposta da API');
        }
        const analysesData = await analysesResponse.json();
        // Garantir que apenas as 5 análises mais recentes sejam exibidas
        setRecentAnalyses(analysesData.slice(0, 5));

        // Calcular estatísticas a partir dos dados recebidos
        const totalAnalises = analysesData.length;
        const mediaTempoResposta = analysesData.reduce((acc: number, curr: RecentAnalysis) => 
          acc + curr.tempo_resposta, 0) / totalAnalises;
        
        const tiposRuido = analysesData.reduce((acc: {[key: string]: number}, curr: RecentAnalysis) => {
          acc[curr.tipo_ruido] = (acc[curr.tipo_ruido] || 0) + 1;
          return acc;
        }, {});

        setStats({
          total_analises: totalAnalises,
          media_tempo_resposta: mediaTempoResposta,
          tipos_ruido: tiposRuido
        });

      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        // Adicionar tratamento de erro mais específico aqui se necessário
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Resto do código permanece igual...
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
            Bem-vindo ao Calm Wave
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Sua plataforma inteligente para análise e processamento de áudio
          </p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <QuickActionCard
            title="Analisar Novo Áudio"
            description="Upload e análise de novos arquivos de áudio com processamento avançado"
            icon={<FaMicrophone />}
            link="/Audios/Analisar-audio"
            color="from-blue-900 via-purple-800 to-purple-900"
          />
          <QuickActionCard
            title="Visualizar Análises"
            description="Acesse a lista completa de áudios analisados com detalhes e métricas"
            icon={<FaChartBar />}
            link="/Audios/lista"
            color="from-blue-900 via-purple-800 to-purple-900"
          />
          <QuickActionCard
            title="Dashboard"
            description="Visualize estatísticas detalhadas e métricas gerais do sistema"
            icon={<FaTachometerAlt />}
            link="/dashboard"
            color="from-blue-900 via-purple-800 to-purple-900"
          />
        </div>

        {/* Stats Overview */}
        {stats && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
          >
            <StatCard
              title="Total de Análises"
              value={stats.total_analises}
              icon={<FaChartBar />}
            />
            <StatCard
              title="Tempo Médio de Resposta"
              value={`${stats.media_tempo_resposta.toFixed(2)}s`}
              icon={<FaHistory />}
            />
            <StatCard
              title="Tipos de Ruído"
              value={Object.keys(stats.tipos_ruido).length}
              icon={<FaMicrophone />}
            />
          </motion.div>
        )}

        {/* Recent Analyses */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Análises Recentes
            </h2>
            <Link 
              href="/Audios/lista"
              className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
            >
              Ver todas <BsArrowRight />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-4 px-4 text-gray-600 dark:text-gray-400">Nome</th>
                  <th className="text-left py-4 px-4 text-gray-600 dark:text-gray-400">Tipo</th>
                  <th className="text-left py-4 px-4 text-gray-600 dark:text-gray-400">Data</th>
                  <th className="text-left py-4 px-4 text-gray-600 dark:text-gray-400">Tempo</th>
                </tr>
              </thead>
              <tbody>
                {recentAnalyses.slice(0, 5).map((analysis) => (
                  <tr 
                    key={analysis.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="py-4 px-4">{analysis.nome_audio}</td>
                    <td className="py-4 px-4 capitalize">{analysis.tipo_ruido}</td>
                    <td className="py-4 px-4">
                      {new Date(analysis.data_identificacao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-4 px-4">{analysis.tempo_resposta.toFixed(2)}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            title="Análise em Tempo Real"
            description="Processamento rápido e eficiente de arquivos de áudio"
            icon={<FaBell />}
          />
          <FeatureCard
            title="Busca Avançada"
            description="Encontre análises específicas com filtros personalizados"
            icon={<FaSearch />}
          />
          <FeatureCard
            title="Relatórios Detalhados"
            description="Visualize métricas e insights detalhados sobre suas análises"
            icon={<FaChartBar />}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Componentes auxiliares
const QuickActionCard = ({ title, description, icon, link, color }: any) => (
  <Link href={link}>
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 cursor-pointer border border-gray-100 dark:border-gray-700 group"
    >
      <div className={`bg-gradient-to-r ${color} p-4 rounded-xl w-16 h-16 flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300">
        {description}
      </p>
    </motion.div>
  </Link>
);

const StatCard = ({ title, value, icon }: any) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
    <div className="flex items-center gap-4 mb-4">
      <div className="text-purple-600 dark:text-purple-400">
        {icon}
      </div>
      <h3 className="text-gray-600 dark:text-gray-400">{title}</h3>
    </div>
    <p className="text-3xl font-bold text-gray-800 dark:text-white">
      {value}
    </p>
  </div>
);

const FeatureCard = ({ title, description, icon }: any) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
    <div className="text-purple-600 dark:text-purple-400 mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-300">
      {description}
    </p>
  </div>
);
