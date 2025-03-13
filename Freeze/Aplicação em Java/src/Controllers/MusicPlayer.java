package Controllers;

import Views.MusicListScreen;
import javafx.application.Application;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.layout.VBox;
import javafx.stage.FileChooser;
import javafx.stage.Stage;
import javafx.scene.media.Media;
import javafx.scene.media.MediaPlayer;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class MusicPlayer extends Application {

    private static final String MUSIC_DIRECTORY = "musicas";
    private MediaPlayer mediaPlayer;

    @Override
    public void start(Stage primaryStage) {
        Button addMusicButton = new Button("Adicionar Música");
        Button listMusicButton = new Button("Listar Músicas");

        addMusicButton.setOnAction(e -> {
            FileChooser fileChooser = new FileChooser();
            fileChooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("MP3 files", "*.mp3"));
            File selectedFile = fileChooser.showOpenDialog(primaryStage);

            if (selectedFile != null) {
                saveMusic(selectedFile); // Salvando a música selecionada
            }
        });

        listMusicButton.setOnAction(e -> {
            MusicListScreen musicListScreen = new MusicListScreen();
            musicListScreen.start(new Stage());
        });

        VBox root = new VBox(addMusicButton, listMusicButton);
        Scene scene = new Scene(root, 300, 200);

        primaryStage.setTitle("Music Player");
        primaryStage.setScene(scene);
        primaryStage.show();
    }

    private void saveMusic(File musicFile) {
        try {
            Path musicDirectoryPath = Paths.get(MUSIC_DIRECTORY);
            if (!Files.exists(musicDirectoryPath)) {
                Files.createDirectory(musicDirectoryPath);
            }

            Path destination = Paths.get(MUSIC_DIRECTORY, musicFile.getName());
            Files.copy(musicFile.toPath(), destination);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static void main(String[] args) {
        launch(args);
    }
}
