import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#fff',
  },
  title: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default styles;
