import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { styles } from './styles';
import { api } from '../../services/api';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export function Register() {
  const navigation = useNavigation<NavigationProp>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/register', {
        name,
        email,
        password
      });

      if (response.data.token) {
        Alert.alert('Sucesso', 'Usuário criado com sucesso!');
        navigation.navigate('Login');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar o usuário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar Conta</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity 
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Criando conta...' : 'Criar Conta'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.linkButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.linkText}>
          Já tem uma conta? Faça login
        </Text>
      </TouchableOpacity>
    </View>
  );
} 