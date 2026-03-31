local mountIds = {7, 8, 9}

function onThink(interval)
	local players = Game.getPlayers()
	if #players == 0 then
		return true
	end

	local player, outfit
	for i = 1, #players do
		player = players[i]
		if player:getStorageValue(11555) < 1 or player:getStorageValue(11555) >= os.time() then
			break
		end

		outfit = player:getOutfit()
		if isInArray(mountIds, outfit.lookMount) then
			outfit.lookMount = nil
			player:setOutfit(outfit)
		end

		for m = 1, #mountIds do
			player:removeMount(mountIds[m])
		end

		player:setStorageValue(11555, -1)
		player:sendTextMessage(MESSAGE_EVENT_ADVANCE, 'Your contract with your horse expired and it returned back to the horse station.')
	end
	return true
end