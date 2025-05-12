import { StyleSheet} from "react-native";

export const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '8%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#2C2C2C',
        position: 'absolute',
        bottom: 0,
        alignItems: 'center'
    },
    item: {
        flex: 1, 
        justifyContent: 'center',
        alignItems: 'center'
    },
    selecionado: {
        backgroundColor: '#111111',
        borderRadius: 50,
        padding: 20,
        height: '100%',
        marginBottom: 50
    },
    selecionadoHome: {
        backgroundColor: '#111111',
        borderRadius: 50,
        padding: 10,
        height: '100%',
        marginBottom: 50
    }, 
})