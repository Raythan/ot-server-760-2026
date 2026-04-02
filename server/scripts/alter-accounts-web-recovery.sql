-- Webapp: redefinição de senha (e-mail / chaves) — executar na base do jogo (ex.: tibia).
-- Compatível com MariaDB/MySQL. Executar uma vez após backup.

ALTER TABLE `accounts`
  ADD COLUMN `web_pwreset_token_hash` CHAR(64) NOT NULL DEFAULT '' AFTER `vote`,
  ADD COLUMN `web_pwreset_expires` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `web_pwreset_token_hash`,
  ADD COLUMN `web_pwreset_via_recovery_slot` TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER `web_pwreset_expires`,
  ADD COLUMN `web_recovery_keys_initialized` TINYINT(1) NOT NULL DEFAULT 0 AFTER `web_pwreset_via_recovery_slot`,
  ADD COLUMN `web_recovery_key_1` CHAR(64) NOT NULL DEFAULT '' AFTER `web_recovery_keys_initialized`,
  ADD COLUMN `web_recovery_key_2` CHAR(64) NOT NULL DEFAULT '' AFTER `web_recovery_key_1`,
  ADD COLUMN `web_recovery_key_3` CHAR(64) NOT NULL DEFAULT '' AFTER `web_recovery_key_2`,
  ADD COLUMN `web_recovery_key_4` CHAR(64) NOT NULL DEFAULT '' AFTER `web_recovery_key_3`,
  ADD COLUMN `web_recovery_key_5` CHAR(64) NOT NULL DEFAULT '' AFTER `web_recovery_key_4`;
