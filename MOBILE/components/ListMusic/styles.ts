import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#391C73',
    backgroundColor: '#111111',
    borderRadius: 10,
    marginVertical: 5,
  },
  title: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'BigShoulders-Regular',
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    marginLeft: 10,
  },
  menuButton: {
    marginLeft: 10,
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#111111',
    borderRadius: 10,
    padding: 10,
    width: '80%',
    maxWidth: 300,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#391C73',
  },
  menuText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'BigShoulders-Regular',
    marginLeft: 10,
  },
});