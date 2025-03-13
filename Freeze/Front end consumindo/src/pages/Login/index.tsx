import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiPhone } from "react-icons/fi";

const Login = () => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    cellphone_number: "",
    confirmPassword: ""
  });

  // Detecta se é dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Função para verificar se o token é válido
  const validateToken = async (token: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_EXPRESS;
      const response = await fetch(`${baseUrl}/validate-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao validar token:', error);
      return false;
    }
  };

  // Verifica se já existe um token válido ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        const isValid = await validateToken(token);
        if (isValid) {
          router.push('/home');
        } else {
          localStorage.removeItem('token');
        }
      }
    };

    checkAuth();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validação de email
      if (!validateEmail(formData.email)) {
        toast.error("Por favor, insira um email válido!");
        setLoading(false);
        return;
      }

      // Validações básicas
      if (!formData.email || !formData.password) {
        toast.error("Preencha todos os campos obrigatórios!");
        setLoading(false);
        return;
      }

      // Validação adicional para registro
      if (!isLogin) {
        if (!formData.name || !formData.cellphone_number) {
          toast.error("Nome e telefone são obrigatórios para cadastro!");
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          toast.error("As senhas não coincidem!");
          setLoading(false);
          return;
        }
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_EXPRESS;
      const endpoint = isLogin ? 'login' : 'register';
      
      console.log(`Fazendo requisição para: ${baseUrl}/${endpoint}`); // Debug

      const requestBody = isLogin ? 
        { 
          email: formData.email, 
          password: formData.password 
        } :
        { 
          name: formData.name,
          email: formData.email,
          password: formData.password,
          cellphone_number: formData.cellphone_number,
          role: 'user'
        };

      console.log('Request body:', requestBody); // Debug

      const response = await fetch(`${baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('Response:', data); // Debug

      if (response.ok) {
        if (isLogin && data.token) {
          localStorage.setItem('token', data.token);
          toast.success("Login realizado com sucesso!");
          router.push('/home');
        } else if (!isLogin) {
          toast.success("Cadastro realizado com sucesso!");
          setIsLogin(true); // Muda para a tela de login após cadastro
          // Limpa o formulário após registro bem-sucedido
          setFormData({
            email: "",
            password: "",
            name: "",
            cellphone_number: "",
            confirmPassword: ""
          });
        }
      } else {
        const errorMessage = data.error || data.message || "Ocorreu um erro!";
        toast.error(errorMessage);
      }

    } catch (error) {
      console.error('Erro completo:', error); // Debug
      toast.error("Erro ao processar sua solicitação!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botão Voltar */}
      <button
        onClick={() => window.history.back()}
        className="absolute top-4 left-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transform hover:scale-105 transition-all duration-300 z-30 flex items-center gap-2"
        aria-label="Voltar para página anterior"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Voltar</span>
      </button>

      <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-gray-900 relative overflow-hidden p-4">
        {/* Ondas de áudio animadas - Ocultas em mobile */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block" aria-hidden="true">
          <div className="absolute bottom-0 left-0 w-full h-64 flex items-end">
            {[1,2,3,4,5,6,7,8].map((i) => (
              <div
                key={i}
                className="flex-1 mx-0.5"
                style={{
                  transform: `translateX(${i * 50}px)`
                }}
              >
                <div
                  className={`bg-gradient-to-t from-purple-500/30 to-blue-500/30 rounded-t-lg animate-wave-${i}`}
                  style={{
                    height: `${Math.sin(i/2) * 100 + 100}px`,
                    animationDelay: `${i * 0.1}s`
                  }}
                ></div>
              </div>
            ))}
          </div>
        </div>

        {/* Container para o fone e efeitos */}
        <div className={`${isMobile ? 'relative mb-8' : 'absolute left-[15%]'} flex items-center z-10`}>
          <div className="relative transform hover:scale-105 transition-transform duration-300">
            <img
              src="/icons/fone.png" 
              alt="Fone de ouvido decorativo"
              className={`${isMobile ? 'w-32' : 'w-96'} h-auto z-10 relative animate-float`}
            />
          </div>
        </div>

        {/* Container do formulário */}
        <div className="bg-[#010101] p-10 rounded-lg shadow-lg w-full max-w-lg mx-auto md:ml-auto md:mr-20 backdrop-blur-lg bg-opacity-90 hover:shadow-2xl transition-all duration-300 z-20">
          <div className="flex justify-center mb-10 transform hover:scale-110 transition-transform duration-300">
            <img
              src="icons/logo_sem_nome.png"
              alt="Logo Calm Wave"
              className="w-24 h-auto"
            />
          </div>
          
          <h2 className="text-3xl text-white font-bold text-center mb-10 animate-fade-in">
            {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            <div className="relative transform hover:scale-105 transition-all duration-300">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="h-6 w-6 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`pl-12 w-full px-4 py-4 bg-gray-800 border ${
                  formData.email && !validateEmail(formData.email) 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-700 focus:ring-blue-500'
                } rounded-lg text-white focus:outline-none focus:ring-2 transition-colors duration-300`}
                placeholder="seu@email.com"
                required
              />
              {formData.email && !validateEmail(formData.email) && (
                <p className="text-red-500 text-sm mt-1">Por favor, insira um email válido</p>
              )}
            </div>

            {!isLogin && (
              <>
                <div className="relative transform hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-6 w-6 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-12 w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                <div className="relative transform hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiPhone className="h-6 w-6 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="cellphone_number"
                    name="cellphone_number"
                    value={formData.cellphone_number}
                    onChange={handleChange}
                    className="pl-12 w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
                    placeholder="Seu número de telefone"
                    required
                  />
                </div>
              </>
            )}

            <div className="relative transform hover:scale-105 transition-all duration-300">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="h-6 w-6 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="pl-12 w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
                placeholder="Sua senha"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <FiEyeOff className="h-6 w-6 text-gray-400" />
                ) : (
                  <FiEye className="h-6 w-6 text-gray-400" />
                )}
              </button>
            </div>

            {!isLogin && (
              <div className="relative transform hover:scale-105 transition-all duration-300">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-6 w-6 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-12 w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
                  placeholder="Confirme sua senha"
                  required
                  minLength={8}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (formData.email && !validateEmail(formData.email))}
              className={`w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transform hover:scale-105 transition-all duration-300 flex items-center justify-center ${
                loading || (formData.email && !validateEmail(formData.email)) 
                  ? 'opacity-70 cursor-not-allowed' 
                  : ''
              }`}
            >
              {loading ? (
                <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                isLogin ? 'Entrar' : 'Criar conta'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-lg">
              {isLogin ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}
            </p>
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="mt-3 text-blue-500 hover:text-blue-400 font-medium text-lg transition-colors duration-300 focus:outline-none focus:underline"
            >
              {isLogin ? 'Criar conta gratuita' : 'Fazer login'}
            </button>
          </div>
        </div>
      </div>

      {/* Estilos para as animações */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .animate-float {
          animation: float 3s infinite ease-in-out;
        }

        @keyframes wave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(2); }
        }

        .animate-wave-1 { animation: wave 1.2s infinite ease-in-out; }
        .animate-wave-2 { animation: wave 1.4s infinite ease-in-out; }
        .animate-wave-3 { animation: wave 1.6s infinite ease-in-out; }
        .animate-wave-4 { animation: wave 1.8s infinite ease-in-out; }
        .animate-wave-5 { animation: wave 2.0s infinite ease-in-out; }
        .animate-wave-6 { animation: wave 2.2s infinite ease-in-out; }
        .animate-wave-7 { animation: wave 2.4s infinite ease-in-out; }
        .animate-wave-8 { animation: wave 2.6s infinite ease-in-out; }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-float,
          .animate-wave-1,
          .animate-wave-2,
          .animate-wave-3,
          .animate-wave-4,
          .animate-wave-5,
          .animate-wave-6,
          .animate-wave-7,
          .animate-wave-8,
          .animate-fade-in {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}

export default Login;
