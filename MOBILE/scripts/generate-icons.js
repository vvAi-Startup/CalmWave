const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceLogo = path.join(__dirname, '../assets/logos/logo_calmwave.svg');
const outputDir = path.join(__dirname, '../assets/logos');

// Garantir que o diretório existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Função para gerar ícones
async function generateIcons() {
  try {
    // Ícone principal
    await sharp(sourceLogo)
      .resize(1024, 1024)
      .toFile(path.join(outputDir, 'icon.png'));

    // Ícone adaptativo para Android
    await sharp(sourceLogo)
      .resize(1024, 1024)
      .toFile(path.join(outputDir, 'adaptive-icon.png'));

    // Favicon para web
    await sharp(sourceLogo)
      .resize(32, 32)
      .toFile(path.join(outputDir, 'favicon.png'));

    // Splash screen
    await sharp(sourceLogo)
      .resize(2048, 2048)
      .toFile(path.join(outputDir, 'splash.png'));

    console.log('Ícones gerados com sucesso!');
  } catch (error) {
    console.error('Erro ao gerar ícones:', error);
  }
}

generateIcons(); 