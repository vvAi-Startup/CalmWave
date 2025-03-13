package Views;

import javafx.application.Application;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ListView;
import javafx.scene.control.Slider;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.HBox;
import javafx.stage.Stage;
import javafx.scene.media.Media;
import javafx.scene.media.MediaPlayer;
import javafx.util.Duration;

import java.io.File;

public class MusicListScreen extends Application {

    private static final String MUSIC_DIRECTORY = "musicas";
    private MediaPlayer currentMediaPlayer;
    private Slider positionSlider;
    private Label positionLabel;

    @Override
    public void start(Stage primaryStage) {
        ListView<String> listView = new ListView<>();
        listView.getItems().addAll(loadMusicFiles());

        Button playButton = new Button("Play");
        Button stopButton = new Button("Stop");

        playButton.setDisable(true);
        stopButton.setDisable(true);

        listView.setOnMouseClicked(e -> {
            playButton.setDisable(false);
            stopButton.setDisable(false);
        });

        playButton.setOnAction(e -> {
            String selectedMusic = listView.getSelectionModel().getSelectedItem();
            if (selectedMusic != null) {
                if (currentMediaPlayer != null) {
                    currentMediaPlayer.stop();
                }

                File musicFile = new File(MUSIC_DIRECTORY + File.separator + selectedMusic);
                Media media = new Media(musicFile.toURI().toString());
                currentMediaPlayer = new MediaPlayer(media);
                
                currentMediaPlayer.currentTimeProperty().addListener((observable, oldValue, newValue) -> {
                    updatePosition();
                });

                currentMediaPlayer.setOnReady(() -> {
                    positionSlider.setMax(currentMediaPlayer.getMedia().getDuration().toSeconds());
                    updatePosition();
                });

                positionSlider.setOnMousePressed(event -> {
                    if (currentMediaPlayer != null) {
                        currentMediaPlayer.pause();
                    }
                });

                positionSlider.setOnMouseReleased(event -> {
                    if (currentMediaPlayer != null) {
                        currentMediaPlayer.seek(Duration.seconds(positionSlider.getValue()));
                        currentMediaPlayer.play();
                    }
                });

                currentMediaPlayer.play();
            }
        });

        stopButton.setOnAction(e -> {
            if (currentMediaPlayer != null) {
                currentMediaPlayer.stop();
            }
        });

        positionSlider = new Slider();
        positionLabel = new Label("00:00 / 00:00");

        HBox controls = new HBox(10, playButton, stopButton);
        HBox positionControls = new HBox(10, positionSlider, positionLabel);
        BorderPane root = new BorderPane();
        root.setCenter(listView);
        root.setBottom(new BorderPane(controls, null, null, positionControls, null));

        Scene scene = new Scene(root, 400, 300);
        primaryStage.setTitle("Lista de Músicas");
        primaryStage.setScene(scene);
        primaryStage.show();
    }

    private String[] loadMusicFiles() {
        File musicDirectory = new File(MUSIC_DIRECTORY);
        if (musicDirectory.exists() && musicDirectory.isDirectory()) {
            return musicDirectory.list((dir, name) -> name.toLowerCase().endsWith(".mp3"));
        }
        return new String[0];
    }

    private void updatePosition() {
        if (currentMediaPlayer != null) {
            Duration currentTime = currentMediaPlayer.getCurrentTime();
            Duration totalTime = currentMediaPlayer.getMedia().getDuration();
            positionSlider.setValue(currentTime.toSeconds());

            String currentTimeFormatted = formatTime(currentTime);
            String totalTimeFormatted = formatTime(totalTime);
            positionLabel.setText(currentTimeFormatted + " / " + totalTimeFormatted);
        }
    }

    private String formatTime(Duration duration) {
        int minutes = (int) duration.toMinutes();
        int seconds = (int) duration.toSeconds() % 60;
        return String.format("%02d:%02d", minutes, seconds);
    }

    public static void main(String[] args) {
        launch(args);
    }
}
