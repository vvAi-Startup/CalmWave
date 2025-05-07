import React from "react";
import { View, TouchableOpacity, Alert } from "react-native";
import { styles } from "./styles";
import Audio from "../../assets/logos/audio.svg";
import Logo from "../../assets/logos/logo_calmwave.svg";
import Config from "../../assets/logos/config.svg";
import { useNavContext } from "@/context/navContext";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

type RootStackParamList = {
  Login: undefined;
  AudioList: undefined;
  Record: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const Nav = () => {
  const { selecionado, setSelecionado } = useNavContext();
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      {/* Botão para a tela de Áudio */}
      <TouchableOpacity
        onPress={() => {
          setSelecionado("audio");
          navigation.navigate("AudioList");
        }}
      >
        <View style={selecionado === "audio" ? styles.selecionado : styles.item}>
          <Audio width={40} height={40} />
        </View>
      </TouchableOpacity>

      {/* Botão para a tela de Gravação */}
      <TouchableOpacity
        onPress={() => {
          setSelecionado("home");
          navigation.navigate("Record");
        }}
      >
        <View style={selecionado === "home" ? styles.selecionadoHome : styles.item}>
          <Logo width={60} height={60} />
        </View>
      </TouchableOpacity>

      {/* Botão para a tela de Configuração (desativado por enquanto) */}
      <TouchableOpacity
        onPress={() => {
          Alert.alert("Indisponível", "A tela de configuração ainda não está implementada.");
        }}
      >
        <View style={styles.item}>
          <Config width={40} height={40} />
        </View>
      </TouchableOpacity>
    </View>
  );
};
