function onLogin(player)
	if player:getLastLoginSaved() <= 0 or player:getStorageValue(30017) == 1 then
		player:setStorageValue(30017, 0) -- reset storage for first items
		
		-- Items
		--if player:getSex() == PLAYERSEX_FEMALE then
			--player:addItem(3361, 1, true, -1, CONST_SLOT_ARMOR)
		--else
			--player:addItem(3361, 1, true, -1, CONST_SLOT_ARMOR)
		--end
		--player:addItem(2920, 1, true, -1, CONST_SLOT_AMMO)
		--player:addItem(3336, 1, true, -1, CONST_SLOT_LEFT)
		--player:addItem(3412, 1, true, -1, CONST_SLOT_RIGHT)
		--player:addItem(3559, 1, true, -1, CONST_SLOT_LEGS)
		--player:addItem(3552, 1, true, -1, CONST_SLOT_FEET)
		--player:addItem(3355, 1, true, -1, CONST_SLOT_HEAD)

		local container = Game.createItem(2853, 1)
		container:addItem(3725, 100) -- brown mushroom
		container:addItem(3412, 1) -- wooden shield
		container:addItem(3270, 1) -- club
		container:addItem(3561, 1) -- jacket
		container:addItem(3035, 10) -- platinum coin
		
		player:addItemEx(container, true, CONST_SLOT_BACKPACK)
	
		-- Load Default Outfit.
		if player:getSex() == PLAYERSEX_FEMALE then
			player:setOutfit({lookType = 136, lookHead = 78, lookBody = 68, lookLegs = 58, lookFeet = 95})
		else
			player:setOutfit({lookType = 128, lookHead = 78, lookBody = 68, lookLegs = 58, lookFeet = 95})
		end
		
		local town = Town("Rookgaard")
		local spawnPos = Position(32104, 32192, 6)
		player:teleportTo(spawnPos)
		player:setTown(town)
		player:setDirection(DIRECTION_SOUTH)
		spawnPos:sendMagicEffect(CONST_ME_TELEPORT)
	end
	return true
end