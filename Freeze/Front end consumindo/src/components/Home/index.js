import Head from "next/head";
import "./Home.module.css";
import ScrollButton from "@/components/ScrollButton";
import FooterBar from "@/components/Footer";
import CarouselRD from "@/components/RuidosCarousel";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLoginClick = () => {
    if (isClient) {
      router.push("/Login");
    }
  };

  const technologies = [
    "react",
    "express", 
    "node",
    "js",
    "flask",
    "machine",
    "tensor", 
    "python",
    "arduino",
    "rasp",
    "kotlin",
    "spring",
    "java",
    "mongo"
  ];

  const extendedTechnologies = [...technologies, ...technologies, ...technologies, ...technologies];

  return (
    <>
      <Head>
        <title>Calm Wave</title>
        <meta name="description" content="Aplicação web do Calm Wave" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="bg-gray-900 text-white min-h-screen flex flex-col overflow-hidden">
        {/* Navbar */}
        <nav className="flex flex-col md:flex-row items-center justify-between px-4 py-2 bg-[#010101] z-10">
          <div className="flex justify-center items-center mb-4 md:mb-0">
            <img
              src="icons/logo_sem_nome.png"
              alt="Logo"
              className="w-12 md:w-14 h-auto"
            />
          </div>
          <ul className="flex flex-wrap justify-center space-x-3 md:space-x-6 mb-4 md:mb-0">
            <li>
              <a href="#why" className="hover:text-gray-300 text-sm md:text-base">
                Calm Wave
              </a>
            </li>
            <li>
              <a href="#solutions" className="hover:text-gray-300 text-sm md:text-base">
                Soluções
              </a>
            </li>
            <li>
              <a href="#frequencies" className="hover:text-gray-300 text-sm md:text-base">
                Frequências
              </a>
            </li>
            <li>
              <a href="#contact" className="hover:text-gray-300 text-sm md:text-base">
                Contato
              </a>
            </li>
          </ul>
          <button
            onClick={handleLoginClick}
            className="bg-transparent border border-white rounded-xl px-3 py-1 hover:bg-purple-600 hover:text-black text-sm md:text-base"
          >
            Entrar
          </button>
        </nav>

        <div className="flex flex-col" id="main">
          {/* Hero */}
          <div
            className="relative flex flex-col bg-[#464646] pt-10 md:pt-20 bg-cover justify-between h-auto"
            style={{
              backgroundImage: `url('/fundo.png') no-repeat center center fixed`,
              backgroundSize: "cover",
            }}
          >
            <div className="absolute inset-0 overflow-hidden pr-4">
              <h1 className="h-full text-[15rem] md:text-[25rem] font-bold font-shoulders opacity-10 whitespace-nowrap absolute -top-20 -left-45">
                lm Wa
              </h1>
            </div>

            <div className="absolute inset-0 bg-[#2C2C2C] bg-opacity-70"></div>

            {/* Conteúdo principal: Texto à esquerda e imagem do fone */}
            <div className="relative flex flex-col max-h-screen z-10">
              <div className="relative flex flex-col md:flex-row justify-between">
                {/* Texto à esquerda */}
                <div className="w-full px-4 md:pl-[50px] text-center md:text-left mb-8 md:mb-0">
                  <h1 className="text-3xl md:text-5xl font-shoulders text-white">
                    Easier life with <p>Calm Waves</p>
                  </h1>
                  <span className="mt-4 text-xs md:text-sm text-white block">
                    O fone de ouvido com inteligência artificial
                    <p> voltado para as crianças dentro do Transtorno</p>
                    <p> de Processamento Auditivo Central (TPAC) </p>
                    <p>no ambiente pedagógico</p>
                  </span>
                  <a
                    href="#calmwave"
                    className="mt-6 inline-block px-4 md:px-6 py-2 md:py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-500 transition text-sm md:text-base"
                  >
                    Sobre nós
                  </a>
                </div>

                {/* Imagem do fone à direita - mantendo posicionamento original no desktop */}
                <div className="hidden md:block absolute right-0 top-0 h-full">
                  <img
                    src="/icons/fone.png"
                    alt="Fone de ouvido"
                    className="h-auto w-[50%] ml-auto"
                  />
                </div>
                {/* Versão mobile do fone */}
                <div className="md:hidden w-full flex justify-center">
                  <img
                    src="/icons/fone.png"
                    alt="Fone de ouvido"
                    className="h-auto w-[80%]"
                  />
                </div>
              </div>

              {/* Info Section */}
              <div className="opacity-80 mt-10 md:mt-20 h-auto md:h-[140px] px-4 md:px-0">
                <section
                  id="calmwave"
                  className="p-1 h-full bg-[#2C2C2C] mb-4"
                >
                  <div className="w-full md:w-[65%] mx-auto text-center flex flex-col md:flex-row justify-between bg-[#ffffff44] rounded-xl opacity-80 p-4">
                    <div className="p-3 w-full">
                      <h3 className="text-xl text-center md:text-left font-league-gothic font-bold text-teal-300 mb-2 md:mb-0">
                        Calm Wave
                      </h3>
                      <p className="text-white w-full md:w-[300px] font-league-gothic text-center md:text-left text-sm md:text-md mt-2 md:mt-0">
                        Promovendo a inclusão de forma
                        <br />
                        relaxante através da tecnologia.
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <p className="text-white w-full md:w-[450px] font-league-gothic text-xs md:text-sm text-center md:text-left">
                        Este projeto está sendo desenvolvido pela startup vvAi©️
                        <br /> criada por estudantes da graduação em
                        Desenvolvimento de Software e <br />
                        Multiplataforma da Fatec Registro.
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              {/* Footer com tecnologias */}
              <footer className="bg-[#010101] py-4 md:py-6 z-10">
                <div className="w-full overflow-hidden">
                  <div className="flex justify-center items-center gap-0 animate-[scroll_40s_linear_infinite] hover:pause">
                    {extendedTechnologies.map((tech, index) => (
                      <img
                        key={index}
                        src={`/icons/techs/${tech}.svg`}
                        alt={tech.charAt(0).toUpperCase() + tech.slice(1)}
                        className="h-6 md:h-8 object-contain mx-3 md:mx-5"
                      />
                    ))}
                    {extendedTechnologies.map((tech, index) => (
                      <img
                        key={`duplicate-${index}`}
                        src={`/icons/techs/${tech}.svg`}
                        alt={tech.charAt(0).toUpperCase() + tech.slice(1)}
                        className="h-6 md:h-8 object-contain mx-3 md:mx-5"
                      />
                    ))}
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </div>

        {/* Por Que? */}
        <section
          id="why"
          className="relative h-auto md:h-100 bg-[#111111] flex justify-center text-white z-10 px-4 md:px-0"
        >
          <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row items-start mt-10 justify-between z-10 mb-20">
            {/* Coluna da Esquerda */}
            <div className="w-full md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center md:text-left">
                Por que
                <span className="text-3xl md:text-4xl font-bold text-teal-300">
                  {" "}
                  Calm Wave?
                </span>
              </h2>
              <div className="flex justify-center flex-col gap-y-5">
                <p className="text-base md:text-lg text-center md:text-left">
                  O Transtorno de Processamento Auditivo Central (TPAC), também
                  conhecido como Distúrbio de Processamento Auditivo (DPA), é um
                  distúrbio no qual o cérebro tem dificuldades em processar as
                  informações auditivas, apesar da audição periférica estar
                  normal.
                </p>

                <p className="text-base md:text-lg leading-relaxed text-center md:text-left">
                  Isso significa que, a pessoa pode ter uma audição normal, mas
                  apresenta dificuldades em compreender e interpretar os sons
                  que ouve, principalmente em ambientes ruidosos ou quando há
                  mais de uma fonte sonora.
                </p>
              </div>
            </div>

            {/* Coluna da Direita */}
            <div className="w-full md:w-1/2 text-2xl md:text-3xl font-bold space-y-4 md:space-y-2 flex flex-col items-center">
              <div className="w-full md:w-[80%] pt-4 text-center md:text-right">
                <span className="text-base md:text-lg">
                  CERCA DE 2 A 3% DAS CRIANÇAS EM IDADE ESCOLAR APRESENTAM O
                  TRANSTORNO
                </span>
              </div>
              <div className="border-t-2 border-gray-400 w-full md:w-[80%] pt-4 text-center md:text-right">
                <span className="text-base md:text-lg">
                  MAIS DE 90% POSSUEM HIPERSENSIBILIDADE AUDITIVA
                </span>
              </div>
              <div className="border-t-2 border-b-2 border-gray-400 w-full md:w-[80%] pt-4 text-center md:text-right pb-1">
                <span className="px-4 py-3 rounded-md text-base md:text-lg">
                  <span>PRINCIPAL BARREIRA NO</span>
                  <span className="text-teal-300"> APRENDIZADO</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section
          id="solutions"
          className="relative h-auto md:h-90 bg-[#111111] flex items-center justify-center text-center px-4 md:px-0"
          style={{
            backgroundImage: `url('/icons/solucoes/fundo.svg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="relative max-w-5xl mx-auto z-10 mt-0 mb-10">
            <h2 className="text-xl md:text-2xl text-teal-300 font-league-gothic">
              SOLUÇÕES
            </h2>
            <p className="text-3xl md:text-5xl mt-4 font-shoulders">RECURSOS PODEROSOS</p>
            <p className="text-3xl md:text-5xl mt-4 font-shoulders">SÓ PARA VOCÊ</p>

            {/* Cards */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div>
                <div
                  style={{
                    backgroundImage: "url('/fundo_card.png')",
                    backgroundSize: "contain",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                  className="bg-gray-700 p-4 md:p-6 rounded-lg shadow-lg transition-transform transform hover:scale-105"
                >
                  <img
                    src="/icons/solucoes/iphone15.svg"
                    alt="Descrição do Card 1"
                    className="w-full h-32 md:h-40 object-cover rounded-t-lg"
                  />
                </div>
                <h3 className="mt-4 text-lg md:text-xl font-semibold">Aplicação Mobile</h3>
              </div>
              {/* Card 2 */}
              <div>
                <div
                  style={{
                    backgroundImage: "url('/fundo_card.png')",
                    backgroundSize: "contain",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                  className="bg-gray-700 p-4 md:p-6 rounded-lg shadow-lg transition-transform transform hover:scale-105"
                >
                  <img
                    src="/icons/solucoes/soundwave.svg"
                    alt="Descrição do Card 2"
                    className="w-full h-32 md:h-40 object-contain rounded-t-lg"
                  />
                </div>
                <h3 className="mt-4 text-lg md:text-xl font-semibold">
                  Cancelamento de Ruído
                </h3>
              </div>

              {/* Card 3 */}
              <div>
                <div
                  style={{
                    backgroundImage: "url('/fundo_card.png')",
                    backgroundSize: "contain",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                  className="bg-gray-700 p-4 md:p-6 rounded-lg shadow-lg transition-transform transform hover:scale-105"
                >
                  <img
                    src="/icons/solucoes/macstudio.svg"
                    alt="Descrição do Card 3"
                    className="w-full h-32 md:h-40 object-cover rounded-t-lg"
                  />
                </div>
                <h3 className="mt-4 text-lg md:text-xl font-semibold">
                  Inteligência artificial
                </h3>
              </div>
            </div>
            {/* Descrição geral */}
            <p className="mt-10 text-base md:text-lg font-montserrat px-4 md:px-0">
              No final, se espera que nossa tecnologia melhore a qualidade de
              vida e o bem-estar emocional das crianças com TPAC, além de
              contribuir para a promoção da educação inclusiva, facilitando a
              participação e o sucesso acadêmico de todas as crianças,
              independentemente de suas necessidades sensoriais ou cognitivas.
            </p>
          </div>
        </section>

        {/* Frequências */}
        <section id="frequencies">
          <div
            className="bg-[#111111] h-full py-10 md:py-20 flex flex-col gap-6 md:gap-10 relative"
            style={{
              backgroundImage: "url('/blur.png')",
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <h2
              className="text-[50px] md:text-[110px] w-full font-gothic text-custom_cinza text-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-90"
              style={{ textShadow: "2px 2px 15px rgba(0, 128, 128, 0.7)" }}
            >
              RUÍDOS CALMANTES
            </h2>

            <CarouselRD />
          </div>
        </section>

        {/* Contato */}
        <FooterBar />
        <ScrollButton />
      </div>
    </>
  );
}
