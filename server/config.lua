-- Projeto anterior (referência): C:\GitHub\ot-server-860-2026

worldType = "pvp"
protectionLevel = 20
pzLocked = 15000
removeChargesFromRunes = true
timeToDecreaseFrags = 6 * 60 * 60 * 1000
stairJumpExhaustion = 400
experienceByKillingPlayers = false
expFromPlayersLevelRange = 75
hotkeyAimbotEnabled = true

banLength = 2 * 24 * 60 * 60
whiteSkullTime = 6 * 60 * 1000
redSkullTime = 3 * 24 * 60 * 60
killsDayRedSkull = 5
killsWeekRedSkull = 7
killsMonthRedSkull = 15
killsDayBanishment = 7
killsWeekBanishment = 15
killsMonthBanishment = 30

-- IP público anunciado ao cliente (login / status). Deve ser o mesmo que os jogadores usam (OCI / frp).
ip = "144.33.23.83"
securityKey = "jzlf9hnXJI"
bindOnlyGlobalAddress = false
loginProtocolPort = 7171
gameProtocolPort = 7172
statusProtocolPort = 7171
maxPlayers = 2000
motd = "Welcome to Tenebra OT"
onePlayerOnlinePerAccount = false
allowClones = false
serverName = "Tenebra OT"
statusTimeout = 5000
replaceKickOnLogin = true
maxPacketsPerSecond = 50
autoStackCumulatives = true --Dúvida
uhTrap = true
moneyRate = 1 --Dúvida

-- Custom Configs
blockLogin = false --Dúvida
blockLoginText = "Hold on a few :F" --Dúvida

deathLosePercent = -2 --Dúvida

houseRentPeriod = "weekly"
onlyInvitedCanMoveHouseItems = true

timeBetweenActions = 200
timeBetweenExActions = 1000

mapName = "map"
mapAuthor = "Tenebra"

-- MySQL no Windows (WSL → host): igual ao projeto anterior C:\GitHub\ot-server-860-2026 — utilizador root.
-- Host: em WSL2 use o IP do nameserver (ex.: grep nameserver /etc/resolv.conf). Senha do root: se não for vazia, preencher mysqlPass.
mysqlHost = "172.30.32.1"
mysqlUser = "root"
mysqlPass = ""
mysqlDatabase = "tibia"
mysqlPort = 3306
mysqlSock = ""
passwordType = "sha1"

allowChangeOutfit = true
freePremium = true
kickIdlePlayerAfterMinutes = 15
maxMessageBuffer = 0
showMonsterLoot = true
queryPlayerContainers = true
emoteSpells = false --Dúvida, da para colocar por parâmetro?

teleportNewbies = true --Dúvida
newbieTownId = 11 --Dúvida
newbieLevelThreshold = 5 --Dúvida

rateExp = 1
rateSkill = 1
rateLoot = 1
rateMagic = 1
rateSpawn = 0  --Dúvida

-- Critical hits
-- NOTE: criticalChance and extraPercent are percentages, not absolute values.
-- extraPercent is the extra percentage of the damage to be added.
criticalChance = 10  --Dúvida
criticalExtra = 10  --Dúvida

deSpawnRange = 0  --Dúvida
deSpawnRadius = 0  --Dúvida

warnUnsafeScripts = true
convertUnsafeScripts = true

defaultPriority = "high"
startupDatabaseOptimization = true

ownerName = "Tenebra"
ownerEmail = "raythan7@gmail.com"
url = ""
location = "Sao Paulo"