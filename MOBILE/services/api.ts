
import axios, { AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const baseURL = 'http://localhost:5000';

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use(async (config: AxiosRequestConfig) => {
  const token = await AsyncStorage.getItem('@CalmWave:token');
  
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export const setAuthToken = async (token: string) => {
  await AsyncStorage.setItem('@CalmWave:token', token);
};

export const removeAuthToken = async () => {
  await AsyncStorage.removeItem('@CalmWave:token');
}; 
