/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package Controllers;

import Models.Conexao;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Time;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.LocalTime;
import javax.swing.JOptionPane;

/**
 *
 * @author fatec-dsm2
 */
public class Playlists {
    
    private Conexao conexaoDB = new Conexao();
    
    
    public void cadastrar_playlist(String nome_playlist) {
        String sql = "INSERT INTO playlists (nome_playlist, criacao_playlist) VALUES (?, ?)";
        LocalDateTime dataAtual = LocalDateTime.now();
        try {
            // Estabelecendo a conexão com o banco de dados
            if (conexaoDB.conecta()) {
                // Preparando a consulta SQL
                PreparedStatement preparedStatement = conexaoDB.prepareStatement(sql);
                preparedStatement.setString(1, nome_playlist);
                preparedStatement.setTimestamp(2, Timestamp.valueOf(dataAtual));
                // Executando a consulta SQL para inserir o novo usuário
                int linhasAfetadas = preparedStatement.executeUpdate();
                if (linhasAfetadas > 0) {
                    JOptionPane.showMessageDialog(null, "Playlist cadastrada com sucesso!");
                } else {
                    JOptionPane.showMessageDialog(null, "Falha ao cadastrar Playlist.");
                }
            }
        } catch (SQLException e) {
            // Em caso de exceção, exiba uma mensagem de erro
            JOptionPane.showMessageDialog(null, "Erro ao cadastrar playlist: " + e.getMessage());
        } finally {
            // Certifique-se de desconectar do banco de dados após a execução da consulta
            conexaoDB.desconecta();
        }
    }
    
    
    public void alterardados_playlist(String nome_playlist, int id_playlist) {
        try {
            String sql = "UPDATE playlists SET nome_playlist = ? WHERE id_playlist = ?";

            // Estabelecendo a conexão com o banco de dados
            if (conexaoDB.conecta()) {
                // Preparando a declaração SQL
                PreparedStatement preparedStatement = conexaoDB.prepareStatement(sql);
                preparedStatement.setString(1, nome_playlist);
                preparedStatement.setInt(2, id_playlist);

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
    
    public void excluirplaylist(int id){
        String sql;
        sql= "Delete from playlists where id_playlist ="+id;
        conexaoDB.executeSQL(sql);
        JOptionPane.showMessageDialog(null, "Registro excluido com sucesso...");
    }
    
    public void inserir_musica(String nome_musica, String artista, LocalTime duracao, int ano, int id_playlist) {
        String sql = "INSERT INTO musicas (nome_musica, artista, duracao, ano, playlist) VALUES (?, ?, ?, ?, ?);";

        try {
            // Estabelecendo a conexão com o banco de dados
            if (conexaoDB.conecta()) {
                // Preparando a consulta SQL
                PreparedStatement preparedStatement = conexaoDB.prepareStatement(sql);
                preparedStatement.setString(1, nome_musica);
                preparedStatement.setString(2, artista);
                // Convertendo a duração de LocalTime para Time
                preparedStatement.setTime(3, Time.valueOf(duracao));
                preparedStatement.setInt(4, ano);
                preparedStatement.setInt(5, id_playlist);


                // Executando a consulta SQL para inserir a nova música
                int linhasAfetadas = preparedStatement.executeUpdate();
                if (linhasAfetadas > 0) {
                    JOptionPane.showMessageDialog(null, 
                            "Música cadastrada com sucesso!"+"\n\n"+
                            "Pronto para próximo cadastro!");
                } else {
                    JOptionPane.showMessageDialog(null, "Falha ao cadastrar Música.");
                }
            }
        } catch (SQLException e) {
            // Em caso de exceção, exiba uma mensagem de erro
            JOptionPane.showMessageDialog(null, "Erro ao cadastrar música: " + e.getMessage());
        } finally {
            // Certifique-se de desconectar do banco de dados após a execução da consulta
            conexaoDB.desconecta();
        }
    }

    
    
    
    public ResultSet listarplaylist(){
        ResultSet tabela;
        tabela = null;
        
        String sql = "Select id_playlist, nome_playlist, qtd_musicas, tempo_duracao, criacao_playlist from playlists;";
        tabela= conexaoDB.RetornarResultset(sql);
        return tabela;
    }
    
    
}
