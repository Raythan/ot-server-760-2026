function onLogin(cid)
	local player = Player(cid)
	local firstLogin = player:getStorageValue(7895412)

	local text =
		"Welcome to Tenebra:\n\n" ..
		"Classic real tibia version from old times. With some custom hunts and stuffs\n\n" ..
		-- "Antibot-Measures:\n" ..
		-- "- Only macro to make runes, cavebot is prohibited.\n" ..
		-- "- 2x Regen\n" ..
		-- "- 3x Loot\n" ..
		-- "- 2x Magic\n" ..
		-- "- 3x Skills\n" ..
		-- "- 2x Drop Gold\n" ..
		"- Promotion 10k\n" ..
		"- Desert Quest Alone\n" ..
		-- "- Multi-Clienting: Max 4 clients allowed.\n\n" ..
		"With medium rates, non-stackable runes only created by the players themselves,\n" ..
		"accurate 7.4 formulas, and tons more this is guaranteed to bring back\n" ..
		"all the good memories of the past!\n\n" ..
		"Tenebra."

	if firstLogin ~= 1 then
		player:setStorageValue(7895412, 1)
		player:popupFYI(text)
	end
	return true
end