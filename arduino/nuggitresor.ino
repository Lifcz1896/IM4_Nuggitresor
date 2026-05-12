// nuggitresor.ino
// ESP32 + PN532 (I2C)
//
// Benötigte Libraries (Arduino Library Manager):
//   - Adafruit PN532
//   - Adafruit BusIO (Abhängigkeit von Adafruit PN532)
//
// PN532 Verkabelung (I2C-Modus):
//   PN532 VCC  → 3.3V
//   PN532 GND  → GND
//   PN532 SDA  → GPIO 21
//   PN532 SCL  → GPIO 22
//   PN532 IRQ  → GPIO 4   (optional, für schnellere Erkennung)
//   PN532 RSTO → GPIO 5   (optional, für Reset)
//
// Wichtig: I2C-Modus am PN532-Modul aktivieren (Lötbrücken SEL0=0, SEL1=1)

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_PN532.h>

// ============================================================
// Konfiguration — hier anpassen
// ============================================================
const char* WIFI_SSID    = "DEIN_WLAN_NAME";
const char* WIFI_PASS    = "DEIN_WLAN_PASSWORT";
const char* API_URL      = "https://deine-domain.ch/api/load.php";
const char* DEVICE_TOKEN = "DEIN_DEVICE_TOKEN";

// PN532 Pins
#define PN532_IRQ   4
#define PN532_RESET 5
#define I2C_SDA     21
#define I2C_SCL     22

// Heartbeat-Intervall (ms) — alle 2 Sekunden "in" senden
#define SIGNAL_INTERVAL_MS 2000
// ============================================================

Adafruit_PN532 nfc(PN532_IRQ, PN532_RESET);

bool nuggiInSafe = false;
unsigned long lastSignalMs = 0;

// ------------------------------------------------------------

void connectWifi() {
    Serial.printf("WiFi verbinden mit %s", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.printf("\nVerbunden — IP: %s\n", WiFi.localIP().toString().c_str());
}

void sendStatus(const char* status) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[HTTP] Kein WiFi — überspringe");
        return;
    }

    HTTPClient http;
    http.begin(API_URL);
    http.addHeader("Content-Type", "application/json");

    String body = "{\"token\":\"";
    body += DEVICE_TOKEN;
    body += "\",\"status\":\"";
    body += status;
    body += "\"}";

    int code = http.POST(body);
    if (code > 0) {
        Serial.printf("[HTTP] status=%s → %d: %s\n", status, code, http.getString().c_str());
    } else {
        Serial.printf("[HTTP] Fehler: %s\n", HTTPClient::errorToString(code).c_str());
    }
    http.end();
}

// ------------------------------------------------------------

void setup() {
    Serial.begin(115200);
    delay(500);
    Serial.println("\n=== Nuggitresor startet ===");

    connectWifi();

    // PN532 initialisieren
    Wire.begin(I2C_SDA, I2C_SCL);
    nfc.begin();

    uint32_t versiondata = nfc.getFirmwareVersion();
    if (!versiondata) {
        Serial.println("FEHLER: PN532 nicht gefunden! Verkabelung prüfen.");
        while (true) delay(1000);
    }
    Serial.printf("PN532 bereit — Chip: PN5%02X, Firmware: %d.%d\n",
        (versiondata >> 24) & 0xFF,
        (versiondata >> 16) & 0xFF,
        (versiondata >> 8)  & 0xFF);

    nfc.SAMConfig();
    Serial.println("Warte auf Nuggi...\n");
}

void loop() {
    // WiFi wiederverbinden falls nötig
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi getrennt — versuche erneut...");
        connectWifi();
    }

    uint8_t uid[7];
    uint8_t uidLen;

    // NFC-Tag lesen, 300ms Timeout (non-blocking)
    bool detected = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLen, 300);

    if (detected) {
        if (!nuggiInSafe) {
            // Nuggi gerade reingelegt → sofort erstes "in" senden
            nuggiInSafe = true;
            lastSignalMs = 0;
            Serial.println("Nuggi erkannt!");
        }

        // Alle 2s Heartbeat senden
        if (millis() - lastSignalMs >= SIGNAL_INTERVAL_MS) {
            sendStatus("in");
            lastSignalMs = millis();
        }
    } else {
        if (nuggiInSafe) {
            // Nuggi rausgenommen → einmalig "out" senden
            nuggiInSafe = false;
            Serial.println("Nuggi rausgenommen!");
            sendStatus("out");
        }
    }
}
