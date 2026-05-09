
import leoImg from '../assets/teams/leo.jpeg';
import brunoImg from '../assets/teams/bruno.jpeg';
import danielImg from '../assets/teams/daniel.jpeg';
import joaoImg from '../assets/teams/joao.jpeg';
import marceloImg from '../assets/teams/marcelo.jpeg';

// 1. Array de Dados (O padrão profissional)
// Separamos os dados do HTML para ficar fácil de você trocar as fotos e nomes depois.
const teamMembers = [
  {
    id: 1,
    name: "Leonardo Wicher L. Ferreira",
    role: "Gestão e Desenvolvimento BackEnd",
    image: leoImg,
  },
  {
    id: 2,
    name: "Bruno Lopes de Souza",
    role: "Desenvolvimento e Análise de Dados",
    image: brunoImg,
  },
  {
    id: 3,
    name: "Daniel Augusto Mandira",
    role: "Desenvolvimento Mobile",
    image: danielImg,
  },
  {
    id: 4,
    name: "João Pedro F. Cordeiro",
    role: "Desenvolvimento FrontEnd",
    image: joaoImg,
  },
  {
    id: 5,
    name: "Marcelo Augusto A. da Cruz",
    role: "Esgenheiro de Dados e Machine Learning",
    image: marceloImg,
  }
];

export default function Team() {
  return (
    <section id="nossa-equipe" className="relative w-full py-24 bg-vvai-bg overflow-hidden">
      
      {/* Elementos de Decoração de Fundo (Glow sutil) */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-vvai-purple/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-vvai-highlight/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-12 relative z-10">
        
        {/* Cabeçalho da Seção */}
        <div className="text-center mb-16">
          <h2 className="font-azonix text-3xl md:text-4xl font-extrabold text-vvai-blue-dark leading-tight mb-4">
            Mentes por trás da <span className="text-vvai-highlight">vvAi</span>
          </h2>
          <p className="text-vvai-text/70 max-w-2xl mx-auto text-sm md:text-base">
            Uma equipe multidisciplinar unida pela paixão de transformar o caos dos dados 
            em soluções elegantes, éticas e de alto impacto.
          </p>
        </div>

        {/* O Layout Grid/Flex: 
          Usamos flex-wrap e justify-center. Como os cards têm largura fixa (w-72), 
          o navegador coloca 3 na primeira linha e empurra os 2 últimos para o centro da linha de baixo!
        */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-12">
          
          {teamMembers.map((member) => (
            // A classe 'group' no pai é o segredo para ativar efeitos nos filhos ao passar o mouse
            <div key={member.id} className="group relative w-full sm:w-72 flex flex-col items-center">
              
              {/* O Container da Foto */}
              <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden mb-6 shadow-lg border border-vvai-text/5 bg-[#0a0a0f]">
                
                {/* Overlay Neon (Invisível por padrão, aparece no hover) */}
                <div className="absolute inset-0 bg-gradient-to-t from-vvai-purple/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none"></div>
                
                {/* A Foto (Opacidade reduzida por padrão, revela com zoom no hover) */}
                <img 
                  src={member.image} 
                  alt={`Foto de ${member.name}`}
                  className="w-full h-full object-cover opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-in-out"
                />

                {/* Ícones Sociais Flutuantes (Sobem no hover) */}
                <div className="absolute bottom-4 left-0 w-full flex justify-center gap-4 translate-y-12 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out z-20">
                  <a href="#" className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-vvai-highlight transition-colors border border-white/20">
                    <span className="text-xs font-bold">IN</span> {/* Placeholder para ícone do LinkedIn */}
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-vvai-purple transition-colors border border-white/20">
                    <span className="text-xs font-bold">GH</span> {/* Placeholder para ícone do GitHub */}
                  </a>
                </div>
              </div>

              {/* Textos (Nome e Cargo) */}
              <div className="text-center transform group-hover:-translate-y-2 transition-transform duration-500">
                <h3 className="font-bold text-lg text-vvai-text tracking-wide">{member.name}</h3>
                <p className="text-sm font-medium text-vvai-highlight uppercase tracking-wider mt-1">{member.role}</p>
              </div>

            </div>
          ))}

        </div>
      </div>
    </section>
  );
}