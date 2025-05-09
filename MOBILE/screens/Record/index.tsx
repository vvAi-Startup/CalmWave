useEffect(() => {
  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('@CalmWave:token');
      console.log("Token recuperado em RecordScreen:", token); // Verificação no RecordScreen
      // Se o token for nulo ou indefinido, force o usuário a fazer login novamente
      if (!token) {
        Alert.alert(
          'Sessão Expirada',
          'Sua sessão expirou. Por favor, faça login novamente.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Redirecione o usuário para a tela de login (assumindo que você tenha acesso à navegação aqui)
                // Se você estiver usando o react-navigation, pode usar algo como:
                // navigation.navigate('Login');
              },
            },
          ],
          { cancelable: false },
        );
      }
    } catch (error) {
      console.error("Erro ao recuperar token em RecordScreen:", error);
    }
  };
  checkToken();
}, []);
