// Componente de onda SVG inspirado no logo
import Image from 'next/image';
export default function WaveLogo({ className = "" }) {
  return (
    <Image
      src='/logo.png'
      alt="Wave Logo"
      width={100}
      height={100}
      className={`w-full h-auto ${className}`}
    />
  );
}
