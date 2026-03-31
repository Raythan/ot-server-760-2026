-- Projeto anterior (referência): C:\GitHub\ot-server-860-2026

worldType = "pvp"
protectionLevel = 1
pzLocked = 60000
removeChargesFromRunes = true
timeToDecreaseFrags = 6 * 60 * 60 * 1000
stairJumpExhaustion = 0
experienceByKillingPlayers = false
expFromPlayersLevelRange = 75
hotkeyAimbotEnabled = true

banLength = 3 * 24 * 60 * 60
whiteSkullTime = 15 * 60 * 1000
redSkullTime = 3 * 24 * 60 * 60
killsDayRedSkull = 3
killsWeekRedSkull = 5
killsMonthRedSkull = 10
killsDayBanishment = 6
killsWeekBanishment = 10
killsMonthBanishment = 20

-- IP público anunciado ao cliente (login / status). Deve ser o mesmo que os jogadores usam (OCI / frp).
ip = "144.33.23.83"
securityKey = "jzlf9hnXJI"
bindOnlyGlobalAddress = false
loginProtocolPort = 7171
gameProtocolPort = 7172
statusProtocolPort = 7171
maxPlayers = 2000
motd = "Welcome to Game-Retro: Added mount system, runes x2, djinns free in Thais, more information visit website"
onePlayerOnlinePerAccount = true
allowClones = false
serverName = "Game-Retro"
statusTimeout = 5000
replaceKickOnLogin = true
maxPacketsPerSecond = 50
autoStackCumulatives = true
uhTrap = true
moneyRate = 2

-- Custom Configs
blockLogin = false
blockLoginText = "Server launch: COMING SOON."

deathLosePercent = -1

houseRentPeriod = "monthly"
onlyInvitedCanMoveHouseItems = true

timeBetweenActions = 200
timeBetweenExActions = 1000

mapName = "map"
mapAuthor = "Tibia"

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
emoteSpells = false

teleportNewbies = true
newbieTownId = 11
newbieLevelThreshold = 5


rateExp = 999
rateSkill = 100
rateLoot = 5
rateMagic = 100
rateSpawn = 0

-- Critical hits
-- NOTE: criticalChance and extraPercent are percentages, not absolute values.
-- extraPercent is the extra percentage of the damage to be added.
criticalChance = 10
criticalExtra = 10

deSpawnRange = 0
deSpawnRadius = 0

warnUnsafeScripts = true
convertUnsafeScripts = true

defaultPriority = "high"
startupDatabaseOptimization = true

ownerName = "Game-Retro"
ownerEmail = "imperium.retro@gmail.com"
url = "https://imperium-retro.com"
location = "Sao Paulo"