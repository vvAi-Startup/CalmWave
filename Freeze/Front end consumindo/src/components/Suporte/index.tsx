import React, { useState } from 'react';
import Header from '../Header';
import { toast } from 'react-hot-toast';
import { FiMail, FiUser, FiMessageSquare, FiAlertCircle, FiSend } from 'react-icons/fi';

export default function Suporte() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    assunto: '',
    descricao: '',
    prioridade: 'baixa'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Você precisa estar logado para enviar uma solicitação');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_EXPRESS}/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: formData.assunto,
          content: formData.descricao,
          typeRequest: formData.assunto,
          priority: formData.prioridade,
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Solicitação enviada com sucesso! Em breve entraremos em contato.');
        // Limpa o formulário após o envio bem-sucedido
        setFormData({
          nome: '',
          email: '',
          assunto: '',
          descricao: '',
          prioridade: 'baixa'
        });
      } else {
        throw new Error(data.error || 'Erro ao enviar solicitação');
      }
    } catch (error) {
      console.error('Erro:', error);
      if (error instanceof Error) {
        toast.error(error.message || 'Erro ao enviar solicitação. Tente novamente.');
      } else {
        toast.error('Erro ao enviar solicitação. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
              Suporte Técnico
            </h1>
            <p className="text-gray-400 text-lg">
              Estamos aqui para ajudar! Preencha o formulário abaixo e nossa equipe entrará em contato.
            </p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl shadow-2xl p-8 animate-fade-in border border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="transform hover:scale-105 transition-all duration-300">
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <FiUser className="mr-2" />
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>

                <div className="transform hover:scale-105 transition-all duration-300">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <FiMail className="mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="transform hover:scale-105 transition-all duration-300">
                  <label htmlFor="assunto" className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <FiMessageSquare className="mr-2" />
                    Assunto
                  </label>
                  <input
                    type="text"
                    id="assunto"
                    name="assunto"
                    value={formData.assunto}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>

                <div className="transform hover:scale-105 transition-all duration-300">
                  <label htmlFor="prioridade" className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <FiAlertCircle className="mr-2" />
                    Prioridade
                  </label>
                  <select
                    id="prioridade"
                    name="prioridade"
                    value={formData.prioridade}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>

              <div className="transform hover:scale-105 transition-all duration-300">
                <label htmlFor="descricao" className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição do Problema
                </label>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FiSend className="text-xl" />
                    <span>Enviar Solicitação</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
