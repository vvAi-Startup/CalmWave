import WaveLogo from './WaveLogo';

export default function Logo({ size = "md", showText = true, variant = "gradient" }) {
  const sizes = {
    sm: { container: "w-10 h-10", text: "text-lg" },
    md: { container: "w-12 h-12", text: "text-2xl" },
    lg: { container: "w-16 h-16", text: "text-3xl" }
  };

  const { container, text } = sizes[size];
  
  // Cores baseadas nas imagens fornecidas
  const colorVariants = {
    gradient: "text-teal-500", // #14b8a6 - cor principal
    cyan: "text-cyan-400",
    yellow: "text-yellow-300",
    dark: "text-slate-800"
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`${container} ${colorVariants[variant]}`}>
        <WaveLogo className="w-full h-full" />
      </div>
      {showText && (
        <span className={`${text} font-bold text-slate-800 text-${colorVariants[variant]}`}>
          Calm Wave
        </span>
      )}
    </div>
  );
}
