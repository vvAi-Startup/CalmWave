import React, { useState, useEffect } from "react";
import { TouchableOpacity, View, Text, Image, Alert } from "react-native";
import { Input } from "../../components/Input";
import { styles } from "./styles";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { API_BASE_URL } from "../../src/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

type RootStackParamList = {
  Login: undefined;
  AudioList: undefined;
  Record: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NavigationProp>();

  const handleLogin = async () => {
    if (!email || !senha) {
      alert("Preencha todos os campos.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password: senha,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        try {
          await AsyncStorage.setItem("@CalmWave:token", data.token);
          console.log("Token salvo:", data.token); // Verificação após salvar
          alert("Login realizado com sucesso.");
          navigation.navigate("Record");
        } catch (error) {
          console.error("Erro ao salvar token:", error);
          alert("Erro ao salvar o token de autenticação."); // Alerta específico para erro ao salvar
        }
      } else if (response.status === 401) {
        alert("Credenciais inválidas.");
      } else {
        alert(data.message || "Erro ao realizar login.");
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      alert("Ocorreu um erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/wavetop.png')} style={styles.imageTop} />
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>Bem-vindo!</Text>
      </View>
      <Input
        label="Login"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <Input
        label="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.buttonlogin} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Carregando..." : "Entrar"}</Text>
        </TouchableOpacity>
        <Text style={styles.ouText}>OU</Text>
        <TouchableOpacity style={styles.buttonGoogle}>
          <Image
            source={require("../../assets/logos/google.png")}
            style={styles.imageGoogle}
          />
          <Text style={styles.googleText}>Entrar com o Google</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.cadButtonContainer}>
        <TouchableOpacity style={styles.cadButton}>
          <Text style={styles.cadButtonText}>Não tem uma conta? Cadastre-se</Text>
        </TouchableOpacity>
      </View>
      <Image source={require('../../assets/images/wavebot.png')} style={styles.imageBot} />
    </View>
  );
}

