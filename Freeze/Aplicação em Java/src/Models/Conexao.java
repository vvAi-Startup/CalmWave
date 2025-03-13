package Models;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import javax.swing.JOptionPane;

public class Conexao {
        
    final private String driver = "com.mysql.jdbc.Driver";
    final private String url= "jdbc:mysql://127.0.0.1/calmwave?useUnicode=true&characterEncoding=utf-8";
    final private String usuario="root";
    final private String senha="";
    private Connection conexao;
    private Statement statement;
    private ResultSet resultset;
    
    public boolean conecta() {  
        boolean result = true;  
  
        try {  
            Class.forName(driver);  
            conexao = DriverManager.getConnection(url,usuario,senha);
            //JOptionPane.showMessageDialog(null,"Conectou com o Banco de Dados");
            
        } catch(ClassNotFoundException Driver){
               JOptionPane.showMessageDialog(null,"Driver não localizado: "+Driver);
               result = false;
        }catch(SQLException Fonte) {
                JOptionPane.showMessageDialog(null,"Erro na conexão com a fonte de dados: "+Fonte);
                result = false;
            }
        return result;  
    }
    
    public void desconecta (){
        boolean result = true;
        try {
            conexao.close();
            //JOptionPane.showMessageDialog(null,"Banco fechado");
        } catch(SQLException fecha) {
            JOptionPane.showMessageDialog(null,"Não foi possível fechar o banco de dados"+ fecha);
            result = false;
        }
    }
    
     public ResultSet RetornarResultset(String sql){
         ResultSet resultSet = null;
         conecta();
         try{
         statement = conexao.createStatement();
         resultSet = statement.executeQuery(sql);
         resultSet.next();
         }catch (Exception e){
         JOptionPane.showMessageDialog(null, "Erro ao retornar resultset"+e.getMessage());
         }
         return resultSet;
 }
    
    
     
    public void executeSQL(String sql){
        conecta();
        try {
            statement = conexao.createStatement();
            statement.execute(sql);
        } catch(SQLException sqle){
            JOptionPane.showMessageDialog(null, "Erro ao executar SQL: " + sqle.getMessage());
        }
    }
    
    public ResultSet executeQuery(String sql){
        ResultSet resultSet = null;
        try {
            statement = conexao.createStatement();
            resultSet = statement.executeQuery(sql);
        } catch (Exception e){
            JOptionPane.showMessageDialog(null, "Erro ao executar query: " + e.getMessage());
        }
        return resultSet;
    }
    
    public PreparedStatement prepareStatement(String sql) {
        try {
            return conexao.prepareStatement(sql);
        } catch (SQLException e) {
            JOptionPane.showMessageDialog(null, "Erro ao preparar statement: " + e.getMessage());
            return null;
        }
    }
    
    public Connection getConexao() {
        return conexao;
    }
}
