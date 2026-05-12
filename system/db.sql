-- db.sql
-- Vollständige Datenbankstruktur Nuggitresor

-- ============================================================
-- TABELLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`        INT NOT NULL AUTO_INCREMENT,
  `email`     VARCHAR(100) NOT NULL,
  `password`  VARCHAR(255) NOT NULL,
  `firstname` VARCHAR(100) DEFAULT NULL,
  `lastname`  VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY (`email`)
);

-- ============================================================
-- TABELLE: tresors
-- Jeder Tresor gehört einem User und hat ein Tagesziel
-- active_from / active_until: Zeitfenster, in dem getrackt wird
-- ============================================================
CREATE TABLE IF NOT EXISTS `tresors` (
  `id`           INT NOT NULL AUTO_INCREMENT,
  `user_id`      INT NOT NULL,
  `name`         VARCHAR(100) NOT NULL,
  `emoji`        VARCHAR(10) DEFAULT '📫',
  `goal_minutes` INT NOT NULL DEFAULT 240,
  `active_from`  TIME DEFAULT '05:00:00',
  `active_until` TIME DEFAULT '20:00:00',
  `created_at`   DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- ALTER für bestehende tresors-Tabelle (nur ausführen wenn Tabelle schon existiert):
-- ALTER TABLE `tresors` ADD COLUMN `active_from` TIME DEFAULT '05:00:00';
-- ALTER TABLE `tresors` ADD COLUMN `active_until` TIME DEFAULT '20:00:00';

-- ============================================================
-- TABELLE: devices
-- Verknüpft einen ESP32 mit einem Tresor.
-- device_token: geheimer Schlüssel, den der ESP32 bei jedem
--               API-Aufruf mitsendet (Authentifizierung).
-- last_signal_at: Timestamp des letzten NFC-Signals vom ESP32.
-- nuggi_in_safe: aktueller Status (true = Nuggi liegt drin).
-- ============================================================
CREATE TABLE IF NOT EXISTS `devices` (
  `id`             INT NOT NULL AUTO_INCREMENT,
  `tresor_id`      INT NOT NULL,
  `device_token`   VARCHAR(64) NOT NULL,
  `last_signal_at` DATETIME DEFAULT NULL,
  `nuggi_in_safe`  TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`     DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY (`device_token`),
  FOREIGN KEY (`tresor_id`) REFERENCES `tresors`(`id`) ON DELETE CASCADE
);

-- ============================================================
-- TABELLE: nuggi_sessions
-- Eine Session = eine zusammenhängende Nuggi-Einlege-Phase.
-- Wird der Nuggi rausgenommen und wieder reingelegt, entsteht
-- eine neue Session. Die Summe aller Sessions ergibt den
-- Tagesfortschritt.
-- status: 'running' = läuft gerade, 'finished' = abgeschlossen
-- ============================================================
CREATE TABLE IF NOT EXISTS `nuggi_sessions` (
  `id`               INT NOT NULL AUTO_INCREMENT,
  `tresor_id`        INT NOT NULL,
  `start_time`       DATETIME NOT NULL,
  `end_time`         DATETIME DEFAULT NULL,
  `duration_minutes` INT DEFAULT NULL,
  `date`             DATE NOT NULL,
  `status`           ENUM('running','finished') NOT NULL DEFAULT 'running',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`tresor_id`) REFERENCES `tresors`(`id`) ON DELETE CASCADE
);

-- ALTER für bestehende nuggi_sessions-Tabelle (nur ausführen wenn Tabelle schon existiert):
-- ALTER TABLE `nuggi_sessions` ADD COLUMN `duration_minutes` INT DEFAULT NULL;
-- ALTER TABLE `nuggi_sessions` ADD COLUMN `date` DATE NOT NULL DEFAULT (CURDATE());
-- ALTER TABLE `nuggi_sessions` ADD COLUMN `status` ENUM('running','finished') NOT NULL DEFAULT 'running';

-- ============================================================
-- TABELLE: daily_progress
-- Tägliche Zusammenfassung pro Tresor.
-- Wird bei jedem Session-Ende aktualisiert.
-- goal_minutes: Snapshot des Ziels an diesem Tag (falls es
--               später geändert wird, bleibt der Vergleich korrekt).
-- ============================================================
CREATE TABLE IF NOT EXISTS `daily_progress` (
  `id`                INT NOT NULL AUTO_INCREMENT,
  `tresor_id`         INT NOT NULL,
  `date`              DATE NOT NULL,
  `started_at`        DATETIME NOT NULL,
  `goal_minutes`      INT NOT NULL,
  `completed_minutes` INT NOT NULL DEFAULT 0,
  `percentage`        INT NOT NULL DEFAULT 0,
  `goal_reached`      TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tresor_date` (`tresor_id`, `date`),
  FOREIGN KEY (`tresor_id`) REFERENCES `tresors`(`id`) ON DELETE CASCADE
);
