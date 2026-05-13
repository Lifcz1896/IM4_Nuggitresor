# Nuggi-Tresor

![Static Badge](https://img.shields.io/badge/Sprache-PHP-%23f7df1e)
![Static Badge](https://img.shields.io/badge/Kurs-MMP_IM4-blue)

> Der Nuggi-Tresor ist eine smarte Box, die trackt, wie lange ein Kleinkind ohne seinen Nuggi auskommt. Ein ESP32 erkennt per NFC, ob der Nuggi im Tresor liegt, und sendet den Status an eine Web-App. Eltern sehen den Tagesfortschritt in Echtzeit und können ein Tagesziel setzen.

---

## WebApp

### Reproduzierbarkeit

#### 1. Repository klonen

```bash
git clone https://github.com/Lifcz1896/IM4_Nuggitresor.git
```

#### 2. Datenbank anlegen

- Neue MySQL-Datenbank beim Hoster erstellen
- Die Datei `system/db.sql` importieren — sie legt alle nötigen Tabellen an

#### 3. Konfiguration

- `system/config.php.blank` kopieren und in `system/config.php` umbenennen
- Datenbankverbindungsdaten eintragen

#### 4. Dateien hochladen

- FTP-Verbindung mit dem SFTP-Plugin in VS Code herstellen
- Alle Dateien auf den Webserver hochladen

#### 5. Device registrieren

- In der Datenbank-Tabelle `devices` einen Eintrag anlegen
- Den `device_token` aus dem Arduino-Code eintragen und mit dem entsprechenden Tresor verknüpfen

#### Live-Version

[https://im4.andrikummer.ch](https://im4.andrikummer.ch)

---

### ScreenFlow

| Seite | Beschreibung |
|---|---|
| Login / Register | Einstieg und Kontoerstellung |
| Dashboard | Tag starten, Nuggi-Status und Fortschritt live sehen |
| Tresor-Detail | Sessions des Tages einsehen, Tagesziel anpassen |
| Statistiken | Historische Auswertung nach Wochen |
| Profil | Account-Einstellungen, Abmelden |

---

### Projektstruktur

```
IM4_Nuggitresor/
├── *.html          # Alle Seiten der Web-App
├── css/            # Stylesheet
├── js/             # JavaScript pro Seite
├── api/            # PHP-API-Endpunkte
├── system/         # Datenbankkonfiguration und SQL-Schema
└── arduino/        # ESP32-Firmware
```

---

### Datenschnittstelle zu PC (ESP32)

Der ESP32 kommuniziert mit der Web-App über `api/load.php`. Er sendet alle 2 Sekunden seinen Status (`in` oder `out`) zusammen mit einem Device-Token. Der Server prüft den Token, aktualisiert die Datenbank und gibt den aktuellen Tagesfortschritt in Prozent zurück. Der ESP32 nutzt diesen Wert, um den LED-Ring zu aktualisieren.

Die Datenbank speichert pro Tag eine Zusammenfassung (Tagesziel, absolvierte Minuten, Prozent), die aus einzelnen Nuggi-Sessions berechnet wird.

---

## Gemeinsam

### Bericht zum Umsetzungsprozess

Das Projekt wurde in zwei Teile aufgeteilt: Physical Computing und Web-App. Die Schnittstelle zwischen beiden — also wie ESP32 und Server kommunizieren — wurde früh gemeinsam definiert, damit beide Seiten unabhängig voneinander entwickelt werden konnten.

Die Web-App wurde iterativ aufgebaut: Zuerst nur Login und eine einfache Statusanzeige, dann die Session-Logik für die Zeiterfassung, danach die Statistiken und zuletzt kleinere Anpassungen wie das Live-Update des Tagesziels auf der LED.

Die grösste Herausforderung war die Zeitberechnung: Laufende Sessions müssen live in den Fortschritt einberechnet werden. Auch das Zusammenspiel zwischen Zieländerung auf der Website und der LED-Anzeige am Gerät brauchte mehrere Anpassungen.

---

### Video-Dokumentation

> Link zum Video: _[wird ergänzt]_

---

### Lernfortschritt

Durch das Projekt habe ich gelernt, wie man eine REST-API mit PHP aufbaut und mit einem Frontend verbindet. Neu war für mich die token-basierte Authentifizierung für Hardware-Geräte und das Arbeiten mit zeitbasierter Datenbanklogik. Ein wichtiges Learning war, das Datenbankschema früh sorgfältig zu planen — nachträgliche Änderungen auf einem Live-System sind aufwändig. Ausserdem habe ich gemerkt, wie entscheidend eine klar definierte Schnittstelle zwischen Hardware und Web ist, damit beide Seiten unabhängig entwickelt werden können.
