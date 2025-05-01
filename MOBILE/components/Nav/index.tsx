import React from "react";
import { View, TouchableOpacity } from "react-native";
import { styles } from "./styles";
import Audio from "../../assets/logos/audio.svg";
import Logo from "../../assets/logos/logo_calmwave.svg";
import Config from "../../assets/logos/config.svg";
import { useNavContext } from "@/context/navContext";

export const Nav = () => {
  const { selecionado, setSelecionado } = useNavContext();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setSelecionado("audio")}>
        <View style={selecionado === "audio" ? styles.selecionado : styles.item}>
          <Audio width={40} height={40} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setSelecionado("home")}>
        <View style={selecionado === "home" ? styles.selecionado : styles.item}>
          <Logo width={60} height={60} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setSelecionado("config")}>
        <View style={selecionado === "config" ? styles.selecionado : styles.item}>
          <Config width={40} height={40} />
        </View>
      </TouchableOpacity>
    </View>
  );
};
