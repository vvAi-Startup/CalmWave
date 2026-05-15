export default function Button({ 
  children, 
  variant = "primary", 
  size = "md", 
  onClick,
  className = ""
}) {
  const baseStyles = "rounded-full font-semibold transition-all duration-300 hover:scale-105";
  
  const variants = {
    primary: "bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-xl",
    secondary: "border-2 border-cyan-500 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-slate-800",
    outline: "border-2 border-white text-white hover:bg-white/10",
    white: "bg-white text-cyan-600 hover:shadow-xl"
  };
  
  const sizes = {
    sm: "px-6 py-2 text-sm",
    md: "px-8 py-4 text-base",
    lg: "px-10 py-5 text-lg"
  };

  return (
    <button 
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
