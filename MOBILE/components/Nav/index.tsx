import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { styles } from './styles';
import Logo from '../../assets/logos/logo_calmwave.svg'

export const Nav = () => {
  return (
    <View style={styles.container}>
      <TouchableOpacity>
        <Logo width={40} height={40}/>
      </TouchableOpacity>

      <TouchableOpacity>

      </TouchableOpacity>

      <TouchableOpacity>

      </TouchableOpacity>
    </View>
  );
};
