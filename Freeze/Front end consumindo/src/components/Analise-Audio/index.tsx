import React, { useState } from 'react';
import { GiSoundWaves, GiWaveSurfer } from 'react-icons/gi';
import { BsBarChartFill, BsClock, BsUpload, BsCheckCircle } from 'react-icons/bs';
import { AiOutlineAudio, AiOutlineLoading3Quarters } from 'react-icons/ai';
import { FaFileAudio } from 'react-icons/fa';

interface AnalysisResult {
  analysis_results: {
    predicted_class: string;
    tempo_resposta: number;
    saved_id: string;
    spectrogram_base64: string;
    waveform_base64: string;
    audio_vector: string;
  };
  id: string;
  message: string;
}

const AnaliseAudio = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      if (file && file.type === 'audio/wav') {
        setAudioFile(file);
        setErrorMessage(null);
      } else {
        setErrorMessage('Por favor, selecione um arquivo de áudio no formato WAV.');
      }
    }
  };

  const renderContent = (path: string | undefined, fieldName: string) => {
    if (!path) return null;

    const fullUrl = `${process.env.NEXT_PUBLIC_API_URL}/uploads/${path}`;

    return (
      <div className="border-t border-gray-600/30 pt-8 mt-8">
        <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-purple-500 to-blue-500 inline-block text-transparent bg-clip-text flex items-center gap-2">
          {fieldName === 'spectrogram_base64' && <><BsBarChartFill /> Espectrograma</>}
          {fieldName === 'waveform_base64' && <><GiWaveSurfer /> Forma de Onda</>}
          {fieldName === 'audio_vector' && <><AiOutlineAudio /> Áudio Original</>}
        </h2>
        
        <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg backdrop-blur-sm mb-6 border border-gray-700/30 hover:border-purple-500/30 transition-all duration-300">
          {(fieldName === 'spectrogram_base64' || fieldName === 'waveform_base64') ? (
            <img 
              src={fullUrl}
              alt={fieldName}
              className="w-full h-auto object-contain max-h-[500px] rounded-lg hover:scale-[1.02] transition-transform duration-300"
              onError={(e) => {
                console.error(`Erro ao carregar imagem ${fieldName}:`, e);
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement?.insertAdjacentHTML(
                  'beforeend',
                  '<p class="text-red-400 p-4 text-center font-medium">Erro ao carregar imagem</p>'
                );
              }}
            />
          ) : fieldName === 'audio_vector' ? (
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!audioFile) return;

    const formData = new FormData();
    formData.append('file', audioFile);
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ia/insert_audio`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ${response.status}: ${errorData.message || 'Erro na análise do áudio'}`);
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (error) {
      console.error('Erro completo:', error);
      setErrorMessage('Erro ao analisar o áudio: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-gray-800/40 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm border border-gray-700/30">
        <div className="px-8 py-10">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 mb-10 text-center flex items-center justify-center gap-3">
            <GiSoundWaves className="text-4xl text-purple-400" />
            Análise de Áudio
          </h1>

          <form onSubmit={handleSubmit} className="mb-10">
            <div className="mb-8">
              <label className="block text-gray-200 text-xl font-medium mb-4 flex items-center gap-2">
                <FaFileAudio className="text-purple-400" />
                Selecione um arquivo de áudio (WAV):
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".wav"
                  onChange={handleFileChange}
                  className="w-full p-4 rounded-xl bg-gray-700/50 text-white border border-gray-600/30 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 hover:bg-gray-700/70"
                />
                <BsUpload className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              {errorMessage && (
                <p className="mt-3 text-red-400 bg-red-400/10 p-3 rounded-lg flex items-center gap-2">
                  <BsCheckCircle className="text-red-400" />
                  {errorMessage}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !audioFile}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white text-lg transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 ${
                loading || !audioFile
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg'
              }`}
            >
              {loading ? (
                <>
                  <AiOutlineLoading3Quarters className="animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <GiSoundWaves />
                  Analisar Áudio
                </>
              )}
            </button>
          </form>

          {analysisResult && (
            <div className="space-y-8">
              <div className="border-b border-gray-700/30 pb-6">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 mb-6 flex items-center gap-2">
                  <BsCheckCircle />
                  Resultados da Análise
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700/30 hover:border-purple-500/30 transition-all duration-300">
                    <p className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                      <GiSoundWaves />
                      Tipo de Ruído
                    </p>
                    <p className="text-lg font-semibold text-white capitalize">
                      {analysisResult.analysis_results.predicted_class || 'Não identificado'}
                    </p>
                  </div>
                  <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700/30 hover:border-purple-500/30 transition-all duration-300">
                    <p className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                      <BsCheckCircle />
                      ID do Registro
                    </p>
                    <p className="text-lg font-semibold text-white">
                      {analysisResult.id || 'Não disponível'}
                    </p>
                  </div>
                  <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700/30 hover:border-purple-500/30 transition-all duration-300">
                    <p className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                      <BsClock />
                      Tempo de Resposta
                    </p>
                    <p className="text-lg font-semibold text-white">
                      {analysisResult.analysis_results.tempo_resposta ? `${analysisResult.analysis_results.tempo_resposta.toFixed(2)}s` : '0.00s'}
                    </p>
                  </div>
                </div>
              </div>

              {analysisResult.analysis_results.spectrogram_base64 && (
                renderContent(analysisResult.analysis_results.spectrogram_base64, 'spectrogram_base64')
              )}
              {analysisResult.analysis_results.waveform_base64 && (
                renderContent(analysisResult.analysis_results.waveform_base64, 'waveform_base64')
              )}
              {analysisResult.analysis_results.audio_vector && (
                renderContent(analysisResult.analysis_results.audio_vector, 'audio_vector')
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnaliseAudio;
