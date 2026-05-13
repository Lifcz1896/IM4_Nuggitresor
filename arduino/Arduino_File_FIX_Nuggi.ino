/******************************************************************
 * Nuggi-Tresor: NFC erkennt Nuggi + sendet Status an load.php
 *
 * Sendet an load.php:
 *   { "token": "DEIN_DEVICE_TOKEN", "status": "in" }
 *   { "token": "DEIN_DEVICE_TOKEN", "status": "out" }
 *
 * PN532 I2C:
 * SDA -> ESP32-C6 GPIO 5
 * SCL -> ESP32-C6 GPIO 6
 * VCC -> 3.3V
 * GND -> GND
 ******************************************************************/

#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <Arduino_JSON.h>
#include <Adafruit_PN532.h>
#include <Adafruit_NeoPixel.h>

// ========================== WLAN / SERVER ==========================

const char* ssid = "tinkergarden";
const char* pass = "strenggeheim";

const char* serverURL = "https://im4.andrikummer.ch/api/load.php";

// Muss in der Datenbank in devices.device_token existieren
const char* DEVICE_TOKEN = "nfnENGqDe9d7*DN60JOz8wq&uk#uW!pL";

// ========================== NFC PINS ==========================

#define SDA_PIN 5
#define SCL_PIN 6

#define PN532_IRQ   2
#define PN532_RESET 3

Adafruit_PN532 nfc(PN532_IRQ, PN532_RESET, &Wire);

// ========================== LED RING ==========================

#define LED_RING_PIN   4   // GPIO Pin für LED Ring Data → anpassen
#define LED_RING_COUNT 12  // Anzahl LEDs im Ring → anpassen

Adafruit_NeoPixel ring(LED_RING_COUNT, LED_RING_PIN, NEO_GRB + NEO_KHZ800);

// ========================== TIMING ==========================

// Wenn Nuggi drin ist: alle 2 Sekunden "in" senden
unsigned long inSendInterval = 2000;

// Nach so viel Zeit ohne Tag gilt Nuggi als rausgenommen
unsigned long tagTimeout = 3000;

unsigned long lastInSendTime = 0;
unsigned long lastTagSeenTime = 0;

// Status merken
bool nuggiCurrentlyInside = false;
bool lastSentOut = false;

// Letzter bekannter Fortschritt vom Server (0–100)
int g_percentage = 0;

// Built-in RGB LED
int led = LED_BUILTIN;

// ========================== SETUP ==========================

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(led, OUTPUT);

  ring.begin();
  ring.setBrightness(80);
  ring.show(); // alle LEDs aus

  Serial.println("Starte Nuggi-Tresor...");

  connectWiFi();

  Wire.begin(SDA_PIN, SCL_PIN);

  nfc.begin();

  uint32_t versiondata = nfc.getFirmwareVersion();

  if (!versiondata) {
    Serial.println("Kein PN532 gefunden. Verkabelung prüfen.");
    while (1) {
      delay(1000);
    }
  }

  Serial.print("PN532 gefunden. Firmware: ");
  Serial.print((versiondata >> 16) & 0xFF, DEC);
  Serial.print(".");
  Serial.println((versiondata >> 8) & 0xFF, DEC);

  nfc.SAMConfig();

  Serial.println("Warte auf Nuggi / NFC-Tag...");
}

// ========================== LOOP ==========================

void loop() {
  if (!isWiFiConnected()) {
    return;
  }

  bool tagDetected = readNfcTag();

  if (tagDetected) {
    lastTagSeenTime = millis();

    // Nuggi wurde neu reingelegt
    if (!nuggiCurrentlyInside) {
      nuggiCurrentlyInside = true;
      lastSentOut = false;

      Serial.println("Nuggi erkannt: STATUS IN");
      sendStatus("in");

      lastInSendTime = millis();
      rgbLedWrite(led, 0, 0, 255); // blau: erkannt
      delay(300);
    }

    // Solange Nuggi drin ist, alle 2 Sekunden "in" senden
    if (millis() - lastInSendTime >= inSendInterval) {
      sendStatus("in");
      lastInSendTime = millis();
    }
  }

  // Wenn vorher Nuggi drin war, jetzt aber länger kein Tag erkannt wurde
  if (nuggiCurrentlyInside && millis() - lastTagSeenTime > tagTimeout) {
    nuggiCurrentlyInside = false;

    if (!lastSentOut) {
      Serial.println("Nuggi entfernt: STATUS OUT");
      sendStatus("out");
      lastSentOut = true;

      rgbLedWrite(led, 255, 0, 0);
      delay(300);
    }
  }

  // LED Ring mit aktuellem Fortschritt aktualisieren
  updateLedRing(g_percentage);

  delay(200);
}

// ========================== LED RING ==========================

void updateLedRing(int percentage) {
  int ledsOn = (int)round((float)LED_RING_COUNT * percentage / 100.0);
  for (int i = 0; i < LED_RING_COUNT; i++) {
    if (i < ledsOn) {
      ring.setPixelColor(i, ring.Color(0, 200, 0)); // grün = Fortschritt
    } else {
      ring.setPixelColor(i, 0); // aus
    }
  }
  ring.show();
}

// ========================== NFC LESEN ==========================

bool readNfcTag() {
  uint8_t uid[7];
  uint8_t uidLength;

  bool success = nfc.readPassiveTargetID(
    PN532_MIFARE_ISO14443A,
    uid,
    &uidLength,
    100
  );

  if (success) {
    Serial.print("Tag erkannt, UID: ");

    for (uint8_t i = 0; i < uidLength; i++) {
      if (uid[i] < 0x10) Serial.print("0");
      Serial.print(uid[i], HEX);
      Serial.print(" ");
    }

    Serial.println();

    return true;
  }

  return false;
}

// ========================== DATEN SENDEN ==========================

void sendStatus(String status) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Kein WLAN. Senden nicht möglich.");
    return;
  }

  JSONVar dataObject;
  dataObject["token"] = DEVICE_TOKEN;
  dataObject["status"] = status;

  String jsonString = JSON.stringify(dataObject);

  Serial.println("Sende an Server:");
  Serial.println(jsonString);

  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");

  int httpResponseCode = http.POST(jsonString);

  if (httpResponseCode > 0) {
    String response = http.getString();

    Serial.print("HTTP Response Code: ");
    Serial.println(httpResponseCode);
    Serial.print("Antwort Server: ");
    Serial.println(response);

    // Fortschritt aus Server-Antwort lesen und speichern
    JSONVar obj = JSON.parse(response);
    if (JSON.typeof(obj) == "object" && obj.hasOwnProperty("percentage")) {
      g_percentage = (int)obj["percentage"];
      Serial.print("Aktueller Fortschritt: ");
      Serial.print(g_percentage);
      Serial.println("%");
    }
  } else {
    Serial.print("Fehler beim Senden: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}

// ========================== WLAN ==========================

void connectWiFi() {
  Serial.print("Verbinde mit WLAN: ");
  Serial.println(ssid);

  WiFi.begin(ssid, pass);

  int attempts = 0;

  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("WLAN verbunden.");
    Serial.print("IP-Adresse: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("WLAN Verbindung fehlgeschlagen.");
  }
}

bool isWiFiConnected() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WLAN verloren. Reconnect...");
    connectWiFi();
    return false;
  }

  return true;
}
