/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package Views;

import Controllers.Usuarios;

/**
 *
 * @author fatec-dsm2
 */
public class FCreateUser extends javax.swing.JFrame {

    /**
     * Creates new form FCreateUser
     */
    public FCreateUser() {
        initComponents();
    }
    
    Usuarios usu = new Usuarios();
    
    public String user;

    /**
     * This method is called from within the constructor to initialize the form.
     * WARNING: Do NOT modify this code. The content of this method is always
     * regenerated by the Form Editor.
     */
    @SuppressWarnings("unchecked")
    // <editor-fold defaultstate="collapsed" desc="Generated Code">//GEN-BEGIN:initComponents
    private void initComponents() {

        Imagem_Fundo = new javax.swing.JPanel();
        Conteudo = new javax.swing.JPanel();
        jLabel3 = new javax.swing.JLabel();
        txt_nomeuser = new javax.swing.JTextField();
        txt_senha = new javax.swing.JTextField();
        jLabel4 = new javax.swing.JLabel();
        btn_voltar = new javax.swing.JLabel();
        btn_listar = new javax.swing.JLabel();
        btn_registrar = new javax.swing.JLabel();
        txt_nome = new javax.swing.JTextField();
        jLabel5 = new javax.swing.JLabel();
        txt_email = new javax.swing.JTextField();
        jLabel7 = new javax.swing.JLabel();
        txt_telefone = new javax.swing.JTextField();
        jLabel8 = new javax.swing.JLabel();
        jLabel1 = new javax.swing.JLabel();
        img_fundo = new javax.swing.JLabel();

        setDefaultCloseOperation(javax.swing.WindowConstants.EXIT_ON_CLOSE);

        Conteudo.setBackground(new java.awt.Color(250, 250, 250));
        Conteudo.setForeground(new java.awt.Color(250, 250, 250));

        jLabel3.setFont(new java.awt.Font("Dialog", 1, 24)); // NOI18N
        jLabel3.setForeground(new java.awt.Color(21, 21, 21));
        jLabel3.setText("Nome de Usuário:");

        txt_nomeuser.setBackground(new java.awt.Color(12, 69, 72));
        txt_nomeuser.setFont(new java.awt.Font("Dialog", 0, 18)); // NOI18N
        txt_nomeuser.setForeground(new java.awt.Color(255, 255, 255));
        txt_nomeuser.setCursor(new java.awt.Cursor(java.awt.Cursor.TEXT_CURSOR));
        txt_nomeuser.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                txt_nomeuserActionPerformed(evt);
            }
        });

        txt_senha.setBackground(new java.awt.Color(12, 69, 72));
        txt_senha.setFont(new java.awt.Font("Dialog", 0, 18)); // NOI18N
        txt_senha.setForeground(new java.awt.Color(255, 255, 255));
        txt_senha.setCursor(new java.awt.Cursor(java.awt.Cursor.TEXT_CURSOR));
        txt_senha.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                txt_senhaActionPerformed(evt);
            }
        });

        jLabel4.setFont(new java.awt.Font("Dialog", 1, 24)); // NOI18N
        jLabel4.setForeground(new java.awt.Color(21, 21, 21));
        jLabel4.setText("Senha:");

        btn_voltar.setIcon(new javax.swing.ImageIcon(getClass().getResource("/Imgs/cadusu/btn_voltar.png"))); // NOI18N
        btn_voltar.addMouseListener(new java.awt.event.MouseAdapter() {
            public void mouseClicked(java.awt.event.MouseEvent evt) {
                btn_voltarMouseClicked(evt);
            }
        });

        btn_listar.setIcon(new javax.swing.ImageIcon(getClass().getResource("/Imgs/btn_listar.png"))); // NOI18N
        btn_listar.addMouseListener(new java.awt.event.MouseAdapter() {
            public void mouseClicked(java.awt.event.MouseEvent evt) {
                btn_listarMouseClicked(evt);
            }
        });

        btn_registrar.setIcon(new javax.swing.ImageIcon(getClass().getResource("/Imgs/cadusu/btn_registrar.png"))); // NOI18N
        btn_registrar.addMouseListener(new java.awt.event.MouseAdapter() {
            public void mouseClicked(java.awt.event.MouseEvent evt) {
                btn_registrarMouseClicked(evt);
            }
        });

        txt_nome.setBackground(new java.awt.Color(12, 69, 72));
        txt_nome.setFont(new java.awt.Font("Dialog", 0, 18)); // NOI18N
        txt_nome.setForeground(new java.awt.Color(255, 255, 255));
        txt_nome.setCursor(new java.awt.Cursor(java.awt.Cursor.TEXT_CURSOR));
        txt_nome.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                txt_nomeActionPerformed(evt);
            }
        });

        jLabel5.setFont(new java.awt.Font("Dialog", 1, 24)); // NOI18N
        jLabel5.setForeground(new java.awt.Color(21, 21, 21));
        jLabel5.setText("Nome Completo:");

        txt_email.setBackground(new java.awt.Color(12, 69, 72));
        txt_email.setFont(new java.awt.Font("Dialog", 0, 18)); // NOI18N
        txt_email.setForeground(new java.awt.Color(255, 255, 255));
        txt_email.setCursor(new java.awt.Cursor(java.awt.Cursor.TEXT_CURSOR));
        txt_email.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                txt_emailActionPerformed(evt);
            }
        });

        jLabel7.setFont(new java.awt.Font("Dialog", 1, 24)); // NOI18N
        jLabel7.setForeground(new java.awt.Color(21, 21, 21));
        jLabel7.setText("E-mail:");

        txt_telefone.setBackground(new java.awt.Color(12, 69, 72));
        txt_telefone.setFont(new java.awt.Font("Dialog", 0, 18)); // NOI18N
        txt_telefone.setForeground(new java.awt.Color(255, 255, 255));
        txt_telefone.setCursor(new java.awt.Cursor(java.awt.Cursor.TEXT_CURSOR));
        txt_telefone.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                txt_telefoneActionPerformed(evt);
            }
        });

        jLabel8.setFont(new java.awt.Font("Dialog", 1, 24)); // NOI18N
        jLabel8.setForeground(new java.awt.Color(21, 21, 21));
        jLabel8.setText("Telefone:");

        jLabel1.setFont(new java.awt.Font("Dialog", 1, 36)); // NOI18N
        jLabel1.setForeground(new java.awt.Color(15, 15, 15));
        jLabel1.setText("Cadastrar Usuários");

        javax.swing.GroupLayout ConteudoLayout = new javax.swing.GroupLayout(Conteudo);
        Conteudo.setLayout(ConteudoLayout);
        ConteudoLayout.setHorizontalGroup(
            ConteudoLayout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(ConteudoLayout.createSequentialGroup()
                .addGap(86, 86, 86)
                .addGroup(ConteudoLayout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addGroup(ConteudoLayout.createSequentialGroup()
                        .addGroup(ConteudoLayout.createParallelGroup(javax.swing.GroupLayout.Alignment.TRAILING, false)
                            .addComponent(txt_email, javax.swing.GroupLayout.Alignment.LEADING)
                            .addComponent(jLabel3, javax.swing.GroupLayout.Alignment.LEADING)
                            .addComponent(jLabel7, javax.swing.GroupLayout.Alignment.LEADING)
                            .addComponent(jLabel5, javax.swing.GroupLayout.Alignment.LEADING)
                            .addComponent(jLabel8, javax.swing.GroupLayout.Alignment.LEADING)
                            .addComponent(jLabel4, javax.swing.GroupLayout.Alignment.LEADING)
                            .addGroup(javax.swing.GroupLayout.Alignment.LEADING, ConteudoLayout.createSequentialGroup()
                                .addComponent(btn_registrar)
                                .addGap(39, 39, 39)
                                .addComponent(btn_listar))
                            .addComponent(txt_telefone, javax.swing.GroupLayout.Alignment.LEADING)
                            .addComponent(txt_nome)
                            .addComponent(txt_senha, javax.swing.GroupLayout.Alignment.LEADING)
                            .addComponent(txt_nomeuser, javax.swing.GroupLayout.Alignment.LEADING))
                        .addGap(0, 0, Short.MAX_VALUE))
                    .addGroup(ConteudoLayout.createSequentialGroup()
                        .addGap(50, 50, 50)
                        .addComponent(jLabel1)
                        .addGap(57, 57, 57)
                        .addComponent(btn_voltar)
                        .addContainerGap(71, Short.MAX_VALUE))))
        );
        ConteudoLayout.setVerticalGroup(
            ConteudoLayout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, ConteudoLayout.createSequentialGroup()
                .addGroup(ConteudoLayout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addGroup(ConteudoLayout.createSequentialGroup()
                        .addContainerGap()
                        .addComponent(btn_voltar))
                    .addGroup(ConteudoLayout.createSequentialGroup()
                        .addGap(24, 24, 24)
                        .addComponent(jLabel1)))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                .addComponent(jLabel3)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(txt_nomeuser, javax.swing.GroupLayout.PREFERRED_SIZE, 60, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(jLabel4)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(txt_senha, javax.swing.GroupLayout.PREFERRED_SIZE, 60, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.UNRELATED)
                .addComponent(jLabel5)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(txt_nome, javax.swing.GroupLayout.PREFERRED_SIZE, 60, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(jLabel7)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(txt_email, javax.swing.GroupLayout.PREFERRED_SIZE, 60, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addGap(18, 18, 18)
                .addComponent(jLabel8)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(txt_telefone, javax.swing.GroupLayout.PREFERRED_SIZE, 60, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addGap(27, 27, 27)
                .addGroup(ConteudoLayout.createParallelGroup(javax.swing.GroupLayout.Alignment.TRAILING)
                    .addComponent(btn_listar)
                    .addComponent(btn_registrar))
                .addGap(49, 49, 49))
        );

        img_fundo.setIcon(new javax.swing.ImageIcon(getClass().getResource("/Imgs/cadusu/img_cadusu.png"))); // NOI18N

        javax.swing.GroupLayout Imagem_FundoLayout = new javax.swing.GroupLayout(Imagem_Fundo);
        Imagem_Fundo.setLayout(Imagem_FundoLayout);
        Imagem_FundoLayout.setHorizontalGroup(
            Imagem_FundoLayout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(Imagem_FundoLayout.createSequentialGroup()
                .addComponent(img_fundo)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                .addComponent(Conteudo, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addGap(41, 41, 41))
        );
        Imagem_FundoLayout.setVerticalGroup(
            Imagem_FundoLayout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addComponent(Conteudo, javax.swing.GroupLayout.Alignment.TRAILING, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
            .addComponent(img_fundo, javax.swing.GroupLayout.Alignment.TRAILING, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
        );

        javax.swing.GroupLayout layout = new javax.swing.GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addComponent(Imagem_Fundo, javax.swing.GroupLayout.PREFERRED_SIZE, 1097, javax.swing.GroupLayout.PREFERRED_SIZE)
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addComponent(Imagem_Fundo, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
        );

        pack();
        setLocationRelativeTo(null);
    }// </editor-fold>//GEN-END:initComponents

    private void txt_nomeuserActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_txt_nomeuserActionPerformed
        // TODO add your handling code here:
    }//GEN-LAST:event_txt_nomeuserActionPerformed

    private void txt_senhaActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_txt_senhaActionPerformed
        // TODO add your handling code here:
    }//GEN-LAST:event_txt_senhaActionPerformed

    private void btn_voltarMouseClicked(java.awt.event.MouseEvent evt) {//GEN-FIRST:event_btn_voltarMouseClicked
        // TODO add your handling code here:
        FMenu menu = new FMenu();
        menu.lbl_nome.setText(user);
        menu.setVisible(true);
        this.dispose();
    }//GEN-LAST:event_btn_voltarMouseClicked

    private void btn_listarMouseClicked(java.awt.event.MouseEvent evt) {//GEN-FIRST:event_btn_listarMouseClicked
        // TODO add your handling code here:
        FListarUsuarios listar = new FListarUsuarios();
        
        listar.user = user;
        listar.setVisible(true);
        this.dispose();
    }//GEN-LAST:event_btn_listarMouseClicked

    private void btn_registrarMouseClicked(java.awt.event.MouseEvent evt) {//GEN-FIRST:event_btn_registrarMouseClicked
        // TODO add your handling code here:
        
        usu.cadastrar_user(txt_nomeuser.getText(), txt_nome.getText(), Integer.parseInt(txt_telefone.getText()), txt_email.getText(), txt_senha.getText());
        txt_nomeuser.setText("");
        txt_telefone.setText("");
        txt_email.setText("");
        txt_senha.setText("");
    }//GEN-LAST:event_btn_registrarMouseClicked

    private void txt_nomeActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_txt_nomeActionPerformed
        // TODO add your handling code here:
    }//GEN-LAST:event_txt_nomeActionPerformed

    private void txt_emailActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_txt_emailActionPerformed
        // TODO add your handling code here:
    }//GEN-LAST:event_txt_emailActionPerformed

    private void txt_telefoneActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_txt_telefoneActionPerformed
        // TODO add your handling code here:
    }//GEN-LAST:event_txt_telefoneActionPerformed

    /**
     * @param args the command line arguments
     */
    public static void main(String args[]) {
        /* Set the Nimbus look and feel */
        //<editor-fold defaultstate="collapsed" desc=" Look and feel setting code (optional) ">
        /* If Nimbus (introduced in Java SE 6) is not available, stay with the default look and feel.
         * For details see http://download.oracle.com/javase/tutorial/uiswing/lookandfeel/plaf.html 
         */
        try {
            for (javax.swing.UIManager.LookAndFeelInfo info : javax.swing.UIManager.getInstalledLookAndFeels()) {
                if ("Nimbus".equals(info.getName())) {
                    javax.swing.UIManager.setLookAndFeel(info.getClassName());
                    break;
                }
            }
        } catch (ClassNotFoundException ex) {
            java.util.logging.Logger.getLogger(FCreateUser.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (InstantiationException ex) {
            java.util.logging.Logger.getLogger(FCreateUser.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (IllegalAccessException ex) {
            java.util.logging.Logger.getLogger(FCreateUser.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (javax.swing.UnsupportedLookAndFeelException ex) {
            java.util.logging.Logger.getLogger(FCreateUser.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        }
        //</editor-fold>

        /* Create and display the form */
        java.awt.EventQueue.invokeLater(new Runnable() {
            public void run() {
                new FCreateUser().setVisible(true);
            }
        });
    }

    // Variables declaration - do not modify//GEN-BEGIN:variables
    private javax.swing.JPanel Conteudo;
    private javax.swing.JPanel Imagem_Fundo;
    private javax.swing.JLabel btn_listar;
    private javax.swing.JLabel btn_registrar;
    private javax.swing.JLabel btn_voltar;
    private javax.swing.JLabel img_fundo;
    private javax.swing.JLabel jLabel1;
    private javax.swing.JLabel jLabel3;
    private javax.swing.JLabel jLabel4;
    private javax.swing.JLabel jLabel5;
    private javax.swing.JLabel jLabel7;
    private javax.swing.JLabel jLabel8;
    private javax.swing.JTextField txt_email;
    private javax.swing.JTextField txt_nome;
    private javax.swing.JTextField txt_nomeuser;
    private javax.swing.JTextField txt_senha;
    private javax.swing.JTextField txt_telefone;
    // End of variables declaration//GEN-END:variables
}
