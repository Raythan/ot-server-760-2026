-- Contas e personagens (base tibia). Password plain: 123 → SHA1 (passwordType = sha1).
-- Login no cliente OT: sempre NÚMERO da conta + senha (não existe login por texto neste TFS).
--   Conta equipa ADM: 2 / 123
--   Raythan→50001, Paulo→50002, Bag→50003, Junior→50004, Rodrigo→50005 / senha 123
-- (campo email = nome lógico só para identificares no phpMyAdmin)

SET NAMES utf8mb4;
SET @ts = UNIX_TIMESTAMP();
SET @pw = '40bd001563085fc35165329ea1ff5c5ecbdbbeef';

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM `player_murders` WHERE `player_id` IN (SELECT `id` FROM `players` WHERE `account_id` IN (2, 50001, 50002, 50003, 50004, 50005));
DELETE FROM `players_online` WHERE `player_id` IN (SELECT `id` FROM `players` WHERE `account_id` IN (2, 50001, 50002, 50003, 50004, 50005));
DELETE FROM `account_viplist` WHERE `account_id` IN (2, 50001, 50002, 50003, 50004, 50005) OR `player_id` IN (SELECT `id` FROM `players` WHERE `account_id` IN (2, 50001, 50002, 50003, 50004, 50005));
DELETE FROM `account_bans` WHERE `account_id` IN (2, 50001, 50002, 50003, 50004, 50005);
DELETE FROM `account_ban_history` WHERE `account_id` IN (2, 50001, 50002, 50003, 50004, 50005);
DELETE FROM `guild_invites` WHERE `player_id` IN (SELECT `id` FROM `players` WHERE `account_id` IN (2, 50001, 50002, 50003, 50004, 50005));
DELETE FROM `guild_membership` WHERE `player_id` IN (SELECT `id` FROM `players` WHERE `account_id` IN (2, 50001, 50002, 50003, 50004, 50005));
DELETE FROM `player_deaths` WHERE `player_id` IN (SELECT `id` FROM `players` WHERE `account_id` IN (2, 50001, 50002, 50003, 50004, 50005));
DELETE FROM `player_depotitems` WHERE `player_id` IN (SELECT `id` FROM `players` WHERE `account_id` IN (2, 50001, 50002, 50003, 50004, 50005));
DELETE FROM `player_items` WHERE `player_id` IN (SELECT `id` FROM `players` WHERE `account_id` IN (2, 50001, 50002, 50003, 50004, 50005));
DELETE FROM `player_storage` WHERE `player_id` IN (SELECT `id` FROM `players` WHERE `account_id` IN (2, 50001, 50002, 50003, 50004, 50005));
DELETE FROM `player_spells` WHERE `player_id` IN (SELECT `id` FROM `players` WHERE `account_id` IN (2, 50001, 50002, 50003, 50004, 50005));
DELETE FROM `player_containers` WHERE `player_id` IN (SELECT `id` FROM `players` WHERE `account_id` IN (2, 50001, 50002, 50003, 50004, 50005));
DELETE FROM `player_namelocks` WHERE `player_id` IN (SELECT `id` FROM `players` WHERE `account_id` IN (2, 50001, 50002, 50003, 50004, 50005));
UPDATE `houses` h INNER JOIN `players` p ON h.`owner` = p.`id` SET h.`owner` = 0 WHERE p.`account_id` IN (2, 50001, 50002, 50003, 50004, 50005);
DELETE FROM `players` WHERE `account_id` IN (2, 50001, 50002, 50003, 50004, 50005);
DELETE FROM `accounts` WHERE `id` IN (2, 50001, 50002, 50003, 50004, 50005);

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO `accounts` (`id`, `password`, `type`, `premdays`, `lastday`, `email`, `key`, `blocked`, `created`, `rlname`, `location`, `country`, `web_lastlogin`, `web_flags`, `email_hash`, `email_new`, `email_new_time`, `email_code`, `email_next`, `premium_points`, `email_verified`, `vote`) VALUES
(2, @pw, 5, 0, 0, 'adm-team', '', 0, @ts, '', '', '', 0, 0, '', '', 0, '', 0, 0, 0, 0),
(50001, @pw, 1, 0, 0, 'raythan', '', 0, @ts, '', '', '', 0, 0, '', '', 0, '', 0, 0, 0, 0),
(50002, @pw, 1, 0, 0, 'paulo', '', 0, @ts, '', '', '', 0, 0, '', '', 0, '', 0, 0, 0, 0),
(50003, @pw, 1, 0, 0, 'bag', '', 0, @ts, '', '', '', 0, 0, '', '', 0, '', 0, 0, 0, 0),
(50004, @pw, 1, 0, 0, 'junior', '', 0, @ts, '', '', '', 0, 0, '', '', 0, '', 0, 0, 0, 0),
(50005, @pw, 1, 0, 0, 'rodrigo', '', 0, @ts, '', '', '', 0, 0, '', '', 0, '', 0, 0, 0, 0);

-- group_id 3 = god. Nomes sem [ ] (compatível com nomes no jogo).
INSERT INTO `players` (`id`, `name`, `group_id`, `account_id`, `level`, `vocation`, `health`, `healthmax`, `experience`, `lookbody`, `lookfeet`, `lookhead`, `looklegs`, `looktype`, `lookaddons`, `lookmount`, `ridingmount`, `maglevel`, `mana`, `manamax`, `manaspent`, `soul`, `town_id`, `posx`, `posy`, `posz`, `conditions`, `cap`, `sex`, `lastlogin`, `lastip`, `save`, `skull`, `skulltime`, `lastlogout`, `blessings`, `onlinetime`, `deletion`, `balance`, `offlinetraining_time`, `offlinetraining_skill`, `skill_fist`, `skill_fist_tries`, `skill_club`, `skill_club_tries`, `skill_sword`, `skill_sword_tries`, `skill_axe`, `skill_axe_tries`, `skill_dist`, `skill_dist_tries`, `skill_shielding`, `skill_shielding_tries`, `skill_fishing`, `skill_fishing_tries`, `deleted`, `created`, `hidden`, `comment`) VALUES
(190001, 'Adm Raythan', 3, 2, 8, 1, 185, 185, 4200, 0, 0, 0, 0, 130, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(190002, 'Adm Paulo', 3, 2, 8, 1, 185, 185, 4200, 0, 0, 0, 0, 130, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(190003, 'Adm Bag', 3, 2, 8, 1, 185, 185, 4200, 0, 0, 0, 0, 130, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(190004, 'Adm Junior', 3, 2, 8, 1, 185, 185, 4200, 0, 0, 0, 0, 130, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(190005, 'Adm Rodrigo', 3, 2, 8, 1, 185, 185, 4200, 0, 0, 0, 0, 130, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(190006, 'Adm Leonardo', 3, 2, 8, 1, 185, 185, 4200, 0, 0, 0, 0, 130, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, '');

-- Conta 50001 Raythan: sorc, druid, pala, knight (voc 1–4)
INSERT INTO `players` (`id`, `name`, `group_id`, `account_id`, `level`, `vocation`, `health`, `healthmax`, `experience`, `lookbody`, `lookfeet`, `lookhead`, `looklegs`, `looktype`, `lookaddons`, `lookmount`, `ridingmount`, `maglevel`, `mana`, `manamax`, `manaspent`, `soul`, `town_id`, `posx`, `posy`, `posz`, `conditions`, `cap`, `sex`, `lastlogin`, `lastip`, `save`, `skull`, `skulltime`, `lastlogout`, `blessings`, `onlinetime`, `deletion`, `balance`, `offlinetraining_time`, `offlinetraining_skill`, `skill_fist`, `skill_fist_tries`, `skill_club`, `skill_club_tries`, `skill_sword`, `skill_sword_tries`, `skill_axe`, `skill_axe_tries`, `skill_dist`, `skill_dist_tries`, `skill_shielding`, `skill_shielding_tries`, `skill_fishing`, `skill_fishing_tries`, `deleted`, `created`, `hidden`, `comment`) VALUES
(191001, 'Raythan Sorcerer', 1, 50001, 8, 1, 185, 185, 4200, 0, 0, 0, 0, 130, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(191002, 'Raythan Druid', 1, 50001, 8, 2, 185, 185, 4200, 0, 0, 0, 0, 130, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(191003, 'Raythan Paladin', 1, 50001, 8, 3, 185, 185, 4200, 0, 0, 0, 0, 129, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(191004, 'Raythan Knight', 1, 50001, 8, 4, 185, 185, 4200, 0, 0, 0, 0, 131, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, '');

INSERT INTO `players` (`id`, `name`, `group_id`, `account_id`, `level`, `vocation`, `health`, `healthmax`, `experience`, `lookbody`, `lookfeet`, `lookhead`, `looklegs`, `looktype`, `lookaddons`, `lookmount`, `ridingmount`, `maglevel`, `mana`, `manamax`, `manaspent`, `soul`, `town_id`, `posx`, `posy`, `posz`, `conditions`, `cap`, `sex`, `lastlogin`, `lastip`, `save`, `skull`, `skulltime`, `lastlogout`, `blessings`, `onlinetime`, `deletion`, `balance`, `offlinetraining_time`, `offlinetraining_skill`, `skill_fist`, `skill_fist_tries`, `skill_club`, `skill_club_tries`, `skill_sword`, `skill_sword_tries`, `skill_axe`, `skill_axe_tries`, `skill_dist`, `skill_dist_tries`, `skill_shielding`, `skill_shielding_tries`, `skill_fishing`, `skill_fishing_tries`, `deleted`, `created`, `hidden`, `comment`) VALUES
(192001, 'Paulo Sorcerer', 1, 50002, 8, 1, 185, 185, 4200, 0, 0, 0, 0, 130, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(192002, 'Paulo Druid', 1, 50002, 8, 2, 185, 185, 4200, 0, 0, 0, 0, 130, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(192003, 'Paulo Paladin', 1, 50002, 8, 3, 185, 185, 4200, 0, 0, 0, 0, 129, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(192004, 'Paulo Knight', 1, 50002, 8, 4, 185, 185, 4200, 0, 0, 0, 0, 131, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, '');

INSERT INTO `players` (`id`, `name`, `group_id`, `account_id`, `level`, `vocation`, `health`, `healthmax`, `experience`, `lookbody`, `lookfeet`, `lookhead`, `looklegs`, `looktype`, `lookaddons`, `lookmount`, `ridingmount`, `maglevel`, `mana`, `manamax`, `manaspent`, `soul`, `town_id`, `posx`, `posy`, `posz`, `conditions`, `cap`, `sex`, `lastlogin`, `lastip`, `save`, `skull`, `skulltime`, `lastlogout`, `blessings`, `onlinetime`, `deletion`, `balance`, `offlinetraining_time`, `offlinetraining_skill`, `skill_fist`, `skill_fist_tries`, `skill_club`, `skill_club_tries`, `skill_sword`, `skill_sword_tries`, `skill_axe`, `skill_axe_tries`, `skill_dist`, `skill_dist_tries`, `skill_shielding`, `skill_shielding_tries`, `skill_fishing`, `skill_fishing_tries`, `deleted`, `created`, `hidden`, `comment`) VALUES
(193001, 'Bag Sorcerer', 1, 50003, 8, 1, 185, 185, 4200, 0, 0, 0, 0, 130, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(193002, 'Bag Druid', 1, 50003, 8, 2, 185, 185, 4200, 0, 0, 0, 0, 130, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(193003, 'Bag Paladin', 1, 50003, 8, 3, 185, 185, 4200, 0, 0, 0, 0, 129, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(193004, 'Bag Knight', 1, 50003, 8, 4, 185, 185, 4200, 0, 0, 0, 0, 131, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, '');

INSERT INTO `players` (`id`, `name`, `group_id`, `account_id`, `level`, `vocation`, `health`, `healthmax`, `experience`, `lookbody`, `lookfeet`, `lookhead`, `looklegs`, `looktype`, `lookaddons`, `lookmount`, `ridingmount`, `maglevel`, `mana`, `manamax`, `manaspent`, `soul`, `town_id`, `posx`, `posy`, `posz`, `conditions`, `cap`, `sex`, `lastlogin`, `lastip`, `save`, `skull`, `skulltime`, `lastlogout`, `blessings`, `onlinetime`, `deletion`, `balance`, `offlinetraining_time`, `offlinetraining_skill`, `skill_fist`, `skill_fist_tries`, `skill_club`, `skill_club_tries`, `skill_sword`, `skill_sword_tries`, `skill_axe`, `skill_axe_tries`, `skill_dist`, `skill_dist_tries`, `skill_shielding`, `skill_shielding_tries`, `skill_fishing`, `skill_fishing_tries`, `deleted`, `created`, `hidden`, `comment`) VALUES
(194001, 'Junior Sorcerer', 1, 50004, 8, 1, 185, 185, 4200, 0, 0, 0, 0, 130, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(194002, 'Junior Druid', 1, 50004, 8, 2, 185, 185, 4200, 0, 0, 0, 0, 130, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(194003, 'Junior Paladin', 1, 50004, 8, 3, 185, 185, 4200, 0, 0, 0, 0, 129, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(194004, 'Junior Knight', 1, 50004, 8, 4, 185, 185, 4200, 0, 0, 0, 0, 131, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, '');

INSERT INTO `players` (`id`, `name`, `group_id`, `account_id`, `level`, `vocation`, `health`, `healthmax`, `experience`, `lookbody`, `lookfeet`, `lookhead`, `looklegs`, `looktype`, `lookaddons`, `lookmount`, `ridingmount`, `maglevel`, `mana`, `manamax`, `manaspent`, `soul`, `town_id`, `posx`, `posy`, `posz`, `conditions`, `cap`, `sex`, `lastlogin`, `lastip`, `save`, `skull`, `skulltime`, `lastlogout`, `blessings`, `onlinetime`, `deletion`, `balance`, `offlinetraining_time`, `offlinetraining_skill`, `skill_fist`, `skill_fist_tries`, `skill_club`, `skill_club_tries`, `skill_sword`, `skill_sword_tries`, `skill_axe`, `skill_axe_tries`, `skill_dist`, `skill_dist_tries`, `skill_shielding`, `skill_shielding_tries`, `skill_fishing`, `skill_fishing_tries`, `deleted`, `created`, `hidden`, `comment`) VALUES
(195001, 'Rodrigo Sorcerer', 1, 50005, 8, 1, 185, 185, 4200, 0, 0, 0, 0, 130, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(195002, 'Rodrigo Druid', 1, 50005, 8, 2, 185, 185, 4200, 0, 0, 0, 0, 130, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(195003, 'Rodrigo Paladin', 1, 50005, 8, 3, 185, 185, 4200, 0, 0, 0, 0, 129, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(195004, 'Rodrigo Knight', 1, 50005, 8, 4, 185, 185, 4200, 0, 0, 0, 0, 131, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, '');

SELECT 'OK: conta 2 (ADM x6), contas 50001-50005 (4 vocs), senha 123 (SHA1).' AS status;
