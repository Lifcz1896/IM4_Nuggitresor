-- db.sql
-- Create the database and the users table

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `firstname` VARCHAR(100) DEFAULT NULL,
  `lastname` VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY (`email`)
);

-- Run this if the table already exists:
-- ALTER TABLE `users` ADD COLUMN `firstname` VARCHAR(100) DEFAULT NULL;
-- ALTER TABLE `users` ADD COLUMN `lastname` VARCHAR(100) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `tresors` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `emoji` VARCHAR(10) DEFAULT '📫',
  `goal_minutes` INT NOT NULL DEFAULT 240,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Run if table already exists:
-- ALTER TABLE `tresors` ADD COLUMN `emoji` VARCHAR(10) DEFAULT '📫';
-- ALTER TABLE `tresors` ADD COLUMN `goal_minutes` INT NOT NULL DEFAULT 240;

CREATE TABLE IF NOT EXISTS `day_starts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `start_time` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_date` (`user_id`, `date`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `nuggi_sessions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tresor_id` INT NOT NULL,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`tresor_id`) REFERENCES `tresors`(`id`) ON DELETE CASCADE
);
