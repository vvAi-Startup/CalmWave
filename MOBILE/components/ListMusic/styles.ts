import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#6C757D', 
    borderRadius: 8, 
    marginVertical: 8, 
  },
  title: {
    flex: 1,
    fontSize: 26,
    color: '#fff', 
    fontFamily: 'BigShoulders-Regular', // Fonte personalizada

    
  },
  button: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    
  },
});

export default styles;