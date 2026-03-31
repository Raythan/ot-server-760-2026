function onLogin(cid)
local player = Player(cid)
local firstLogin = player:getStorageValue(7895412)
local text = "Welcome to Imperium:\n\nWe welcome you all to Imperium who have come to enjoy the best of what classic Tibia has to offer.\n\nAntibot-Measures: Only macro to make runes, cavebot is prohibited.\n2x Regen\n3x Loot\n2x Magic\n3x Skills\n2x Drop Gold\nPromotion 10k\nDesert Quest Alone\nMulti-Clienting: Max 4 clients allowed.\n\nWith medium rates, non-stackable runes only created by the players themselves, accurate 7.4 formulas,\nand tons more this is guaranteed to bring back all the good memories of the past!.\n\n\nImperium. " -- \n

	if firstLogin ~= 1 then
		player:setStorageValue(7895412, 1)
		player:popupFYI(text)
	end
	return true
end