package Controllers;

import Models.Conexao;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import javax.swing.JOptionPane;

public class Usuarios {

    private Conexao conexaoDB = new Conexao();
    private String email, senha, nome_completo, nome_usuario;
    private int id_usuario, tipo_dev;

    public Usuarios() {
    }

    public Usuarios(String email, String senha, String nome_completo, String nome_usuario, int id_usuario, int tipo_dev) {
        this.email = email;
        this.senha = senha;
        this.nome_completo = nome_completo;
        this.nome_usuario = nome_usuario;
        this.id_usuario = id_usuario;
        this.tipo_dev = tipo_dev;
    }

    public Conexao getConexaoDB() {
        return conexaoDB;
    }

    public void setConexaoDB(Conexao conexaoDB) {
        this.conexaoDB = conexaoDB;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }

    public String getNome_completo() {
        return nome_completo;
    }

    public void setNome_completo(String nome_completo) {
        this.nome_completo = nome_completo;
    }

    public String getNome_usuario() {
        return nome_usuario;
    }

    public void setNome_usuario(String nome_usuario) {
        this.nome_usuario = nome_usuario;
    }

    public int getId_usuario() {
        return id_usuario;
    }

    public void setId_usuario(int id_usuario) {
        this.id_usuario = id_usuario;
    }

    public int getTipo_dev() {
        return tipo_dev;
    }

    public void setTipo_dev(int tipo_dev) {
        this.tipo_dev = tipo_dev;
    }

    public int verificarLogin(String email, String senha) {

        int idUsuario = -1; // Valor padrão para indicar que nenhum usuário foi encontrado

        // Construindo a consulta SQL parametrizada para verificar o login
        String sql = "SELECT * FROM desenvolvedores WHERE email = ? AND senha = ?";

        try {
            // Estabelecendo a conexão com o banco de dados
            if (conexaoDB.conecta()) {
                // Preparando a consulta SQL
                PreparedStatement preparedStatement = conexaoDB.prepareStatement(sql);
                preparedStatement.setString(1, email);
                preparedStatement.setString(2, senha);

                // Executando a consulta SQL
                ResultSet resultado = preparedStatement.executeQuery();

                // Verificando se há algum resultado retornado pela consulta
                // Verificando se há algum resultado retornado pela consulta
                if (resultado.next()) {
                    idUsuario = resultado.getInt("id_dev");
                    setId_usuario(resultado.getInt("id_dev"));
                    setNome_usuario(resultado.getString("nome_usuario"));
                    setNome_completo(resultado.getString("nome_completo"));
                    setTipo_dev(resultado.getInt("tipo_dev")); // Configurar o valor de tipo_dev aqui
                    setEmail(resultado.getString("email"));
                    setSenha(resultado.getString("senha"));
                }

            }
        } catch (SQLException e) {
            // Em caso de exceção, exiba uma mensagem de erro
            JOptionPane.showMessageDialog(null, "Erro ao verificar o login: " + e.getMessage());
        } finally {
            // Certifique-se de desconectar do banco de dados após a execução da consulta
            conexaoDB.desconecta();
        }

        return idUsuario; // Retorna o ID do usuário (ou -1 se não houver usuário encontrado)
    }
    
    public ResultSet listarusuarios(){
        ResultSet tabela;
        tabela = null;
        
        String sql = "Select id_dev, nome_usuario, senha, nome_completo, email, telefone from desenvolvedores;";
        tabela= conexaoDB.RetornarResultset(sql);
        return tabela;
    }

    public void cadastrar_user(String nome_user, String nome_completo, int telefone, String email, String senha) {
        String sql = "INSERT INTO desenvolvedores (nome_usuario, nome_completo, telefone, email, senha) VALUES (?, ?, ?, ?, ?)";

        try {
            // Estabelecendo a conexão com o banco de dados
            if (conexaoDB.conecta()) {
                // Preparando a consulta SQL
                PreparedStatement preparedStatement = conexaoDB.prepareStatement(sql);
                preparedStatement.setString(1, nome_user);
                preparedStatement.setString(2, nome_completo);
                preparedStatement.setInt(3, telefone);
                preparedStatement.setString(4, email);
                preparedStatement.setString(5, senha);

                // Executando a consulta SQL para inserir o novo usuário
                int linhasAfetadas = preparedStatement.executeUpdate();
                if (linhasAfetadas > 0) {
                    JOptionPane.showMessageDialog(null, "Usuário cadastrado com sucesso!");
                } else {
                    JOptionPane.showMessageDialog(null, "Falha ao cadastrar usuário.");
                }
            }
        } catch (SQLException e) {
            // Em caso de exceção, exiba uma mensagem de erro
            JOptionPane.showMessageDialog(null, "Erro ao cadastrar usuário: " + e.getMessage());
        } finally {
            // Certifique-se de desconectar do banco de dados após a execução da consulta
            conexaoDB.desconecta();
        }
    }

    public void alterardados(String nome_user, String nome_completo, String telefone, String email, String senha, int id) {
        try {
            JOptionPane.showMessageDialog(null, "ID do usuário antes da alteração: " + id);

            // Construindo a consulta SQL parametrizada para atualizar os dados do usuário
            String sql = "UPDATE desenvolvedores SET nome_usuario = ?, nome_completo = ?, telefone = ?, email = ?, senha = ? WHERE id_dev = ?";

            // Estabelecendo a conexão com o banco de dados
            if (conexaoDB.conecta()) {
                // Preparando a declaração SQL
                PreparedStatement preparedStatement = conexaoDB.prepareStatement(sql);
                preparedStatement.setString(1, nome_user);
                preparedStatement.setString(2, nome_completo);
                preparedStatement.setString(3, telefone);
                preparedStatement.setString(4, email);
                preparedStatement.setString(5, senha);
                preparedStatement.setInt(6, id); // Usando o id_dev passado como parâmetro

                // Executando a atualização
                int rowsAffected = preparedStatement.executeUpdate();

                // Verificando se a atualização foi bem-sucedida
                if (rowsAffected > 0) {
                    JOptionPane.showMessageDialog(null, "Dados alterados com sucesso!");
                } else {
                    JOptionPane.showMessageDialog(null, "Não foi possível alterar os dados. Por favor, tente novamente.");
                }
            }
        } catch (SQLException e) {
            // Em caso de exceção, exiba uma mensagem de erro
            e.printStackTrace();
            JOptionPane.showMessageDialog(null, "Erro ao alterar dados: " + e.getMessage());
        } finally {
            // Certifique-se de desconectar do banco de dados após a execução da consulta
            conexaoDB.desconecta();
        }
    }
    
    
    public void excluirusuario(int id){
        String sql;
        sql= "Delete from desenvolvedores where id_dev ="+id;
        conexaoDB.executeSQL(sql);
        JOptionPane.showMessageDialog(null, "Registro excluido com sucesso...");
    }

}
