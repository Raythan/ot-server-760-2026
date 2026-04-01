-- Remove tabelas legadas de sites PHP (MyAAC, Znote AAC / loja em `z_*`) —
-- não são usadas pelo TFS nem pela webapp Node deste repositório.
-- Executar na base já existente se ainda tiver estas tabelas de instalações antigas.
-- Uso: mysql -u USER -p DATABASE < server/database-drop-myaac.sql

SET FOREIGN_KEY_CHECKS = 0;

-- MyAAC
DROP TABLE IF EXISTS `myaac_account_actions`;
DROP TABLE IF EXISTS `myaac_admin_menu`;
DROP TABLE IF EXISTS `myaac_bugtracker`;
DROP TABLE IF EXISTS `myaac_changelog`;
DROP TABLE IF EXISTS `myaac_config`;
DROP TABLE IF EXISTS `myaac_faq`;
DROP TABLE IF EXISTS `myaac_forum`;
DROP TABLE IF EXISTS `myaac_forum_boards`;
DROP TABLE IF EXISTS `myaac_gallery`;
DROP TABLE IF EXISTS `myaac_menu`;
DROP TABLE IF EXISTS `myaac_monsters`;
DROP TABLE IF EXISTS `myaac_news`;
DROP TABLE IF EXISTS `myaac_news_categories`;
DROP TABLE IF EXISTS `myaac_notepad`;
DROP TABLE IF EXISTS `myaac_pages`;
DROP TABLE IF EXISTS `myaac_spells`;
DROP TABLE IF EXISTS `myaac_videos`;
DROP TABLE IF EXISTS `myaac_visitors`;
DROP TABLE IF EXISTS `myaac_weapons`;

-- Znote AAC / comunicação e loja no site (prefixo z_)
DROP TABLE IF EXISTS `z_shop_history`;
DROP TABLE IF EXISTS `z_shop_offer`;
DROP TABLE IF EXISTS `z_shop_categories`;
DROP TABLE IF EXISTS `z_polls_answers`;
DROP TABLE IF EXISTS `z_polls`;
DROP TABLE IF EXISTS `z_ots_comunication`;

SET FOREIGN_KEY_CHECKS = 1;
