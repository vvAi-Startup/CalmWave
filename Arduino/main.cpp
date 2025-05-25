const int BUTTON_PIN = 8;
const int RED_LED_PIN = 7;
const int YELLOW_LED_PIN = 5;
const int GREEN_LED_PIN = 6;

bool isRecording = false;
bool isSending = false;

unsigned long lastBlinkMillis = 0;
bool currentLedBlinkState = false;

bool lastButtonState = false;
unsigned long lastDebounceTime = 0;
const unsigned long DEBOUNCE_DELAY = 50;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP); // usando pull-up interno
  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(YELLOW_LED_PIN, OUTPUT);
  pinMode(GREEN_LED_PIN, OUTPUT);

  Serial.begin(9600);
  delay(100);
  Serial.println("ARDUINO: Sistema CalmWave iniciado. V2.0");
  Serial.println("ARDUINO: Aguardando START/STOP do botao ou Python.");

  setAllLedsOff();
  digitalWrite(RED_LED_PIN, HIGH);
}

void loop() {
  handleButtonPress();
  handleSerialCommands();
  updateLedState();
  delay(5);
}

void handleButtonPress() {
  bool reading = !digitalRead(BUTTON_PIN); // invertido por pull-up

  if (reading != lastButtonState) {
    lastDebounceTime = millis();
  }

  if ((millis() - lastDebounceTime) > DEBOUNCE_DELAY) {
    if (reading != lastButtonState && reading == true) {
      if (!isRecording && !isSending) {
        isRecording = true;
        isSending = false;
        Serial.println("START");
        Serial.println("ARDUINO: Iniciando gravacao via botao.");
      } else if (isRecording) {
        isRecording = false;
        isSending = false;
        Serial.println("STOP");
        Serial.println("ARDUINO: Parando gravacao via botao.");
      }
    }

    lastButtonState = reading;
  }
}

void handleSerialCommands() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();

    if (command == "SENDING") {
      isSending = true;
      isRecording = false;
      Serial.println("ARDUINO: Recebido 'SENDING' do Python. Transicao para modo de envio.");
    } else if (command == "SENT_COMPLETE") {
      isSending = false;
      Serial.println("ARDUINO: Recebido 'SENT_COMPLETE' do Python. Transicao para modo inativo.");
    }
  }
}

void updateLedState() {
  if (isSending) {
    blinkLed(GREEN_LED_PIN, 150);
  } else if (isRecording) {
    blinkLed(YELLOW_LED_PIN, 500);
  } else {
    setAllLedsOff();
    digitalWrite(RED_LED_PIN, HIGH);
  }
}

void setAllLedsOff() {
  digitalWrite(RED_LED_PIN, LOW);
  digitalWrite(YELLOW_LED_PIN, LOW);
  digitalWrite(GREEN_LED_PIN, LOW);
}

void blinkLed(int ledPin, int intervalMillis) {
  setAllLedsOff();

  if (millis() - lastBlinkMillis >= intervalMillis) {
    lastBlinkMillis = millis();
    currentLedBlinkState = !currentLedBlinkState;
    digitalWrite(ledPin, currentLedBlinkState ? HIGH : LOW);
  }
}
a