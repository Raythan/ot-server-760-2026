-- Executar no MySQL do Windows como utilizador com privilégio GRANT (normalmente root).
-- Objetivo: o TFS no WSL liga-se ao host 172.30.32.1; o MySQL vê o cliente como IP WSL (ex.: 172.30.36.x), não como localhost.
--
-- MySQL Workbench: File > Run SQL Script, ou na linha de comandos do Windows:
--   mysql -u root -p < grant-tfs-wsl-access.sql

CREATE USER IF NOT EXISTS 'tfs'@'%' IDENTIFIED BY 'otserver760';
GRANT ALL PRIVILEGES ON tibia.* TO 'tfs'@'%';

-- Se já existir tfs só em localhost, o utilizador acima cobre ligações vindas da rede (WSL).
FLUSH PRIVILEGES;
