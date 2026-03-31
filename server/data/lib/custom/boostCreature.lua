if not boostCreature then boostCreature = {} end

BoostedCreature = {
	monsters = {"rotworm", "necromancer", "troll", "cyclops drone", "cyclops smith", "frost dragon", "ancient scarab", "crystal spider", "cyclops", "giant spider", "behemoth", "scarab", "dwarf guard", "minotaur", "minotaur guard", "dragon", "vampire", "mummy", "hydra", "dragon Lord"},
	db = false,
	exp = {100, 100},
	loot = {30, 50},
	position = Position(32369, 32244, 7),
	messages = {
		prefix = "[Boosted Creature] ",
		escolhida = "The chosen creature was %s. Upon killing you receive +%d of experience and +%d of loot.",
	},
}

function BoostedCreature:start()
	local rand = math.random
	local monsterRand = BoostedCreature.monsters[rand(#BoostedCreature.monsters)]
	local expRand = rand(BoostedCreature.exp[1], BoostedCreature.exp[2])
	local lootRand = rand(BoostedCreature.loot[1], BoostedCreature.loot[2])
	table.insert(boostCreature, {name = monsterRand:lower(), exp = expRand, loot = lootRand})
	local monster = Game.createMonster(boostCreature[1].name, BoostedCreature.position, false, true)
	monster:setDirection(SOUTH)
end