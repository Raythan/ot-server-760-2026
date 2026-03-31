-- Conta 123, senha plain: ray → SHA1 (config passwordType = sha1)
SET @ts = UNIX_TIMESTAMP();

DELETE FROM players WHERE account_id = 123;

INSERT INTO accounts (
  id, password, type, premdays, lastday, email, `key`, blocked, created,
  rlname, location, country, web_lastlogin, web_flags, email_hash, email_new,
  email_new_time, email_code, email_next, premium_points, email_verified, vote
) VALUES (
  123, '7f525154e857f3d57a641a83dddc584f42addc6a', 1, 0, 0, '', '', 0, @ts,
  '', '', '', 0, 0, '', '', 0, '', 0, 0, 0, 0
) ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  blocked = 0,
  `key` = '';

-- Admin (god): AdminRay | + uma vocação cada (Rook, Sorc já no admin como sorc, Druid, Pala, Knight)
-- 5 chars: god sorc + druid + pala + knight + rook
INSERT INTO players (
  id, name, group_id, account_id, level, vocation, health, healthmax, experience,
  lookbody, lookfeet, lookhead, looklegs, looktype, lookaddons, lookmount, ridingmount,
  maglevel, mana, manamax, manaspent, soul, town_id, posx, posy, posz, conditions,
  cap, sex, lastlogin, lastip, save, skull, skulltime, lastlogout, blessings,
  onlinetime, deletion, balance, offlinetraining_time, offlinetraining_skill,
  skill_fist, skill_fist_tries, skill_club, skill_club_tries, skill_sword, skill_sword_tries,
  skill_axe, skill_axe_tries, skill_dist, skill_dist_tries, skill_shielding, skill_shielding_tries,
  skill_fishing, skill_fishing_tries, deleted, created, hidden, comment
) VALUES
(50001, 'AdminRay', 3, 123, 8, 1, 185, 185, 4200, 0, 0, 0, 0, 130, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(50002, 'DruidRay', 1, 123, 8, 2, 185, 185, 4200, 0, 0, 0, 0, 130, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(50003, 'PalaRay', 1, 123, 8, 3, 185, 185, 4200, 0, 0, 0, 0, 129, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(50004, 'KnightRay', 1, 123, 8, 4, 185, 185, 4200, 0, 0, 0, 0, 131, 0, 0, 0, 0, 35, 35, 0, 100, 1, 32369, 32241, 7, '', 470, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, ''),
(50005, 'RookRay', 1, 123, 1, 0, 150, 150, 0, 118, 114, 38, 57, 130, 0, 0, 0, 0, 0, 0, 0, 100, 1, 32369, 32241, 7, '', 400, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 43200, -1, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 0, @ts, 0, '');
