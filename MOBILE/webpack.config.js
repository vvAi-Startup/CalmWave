const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Configuração para resolver o erro de publicPath
  config.output.publicPath = '/';
  
  return config;
}; 