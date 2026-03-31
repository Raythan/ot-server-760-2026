local config = {
    storageTime = 28230, -- storage time online
    timeMax = (20000), -- 1 hour
    pointsPerTime = 1, -- 1 point per hour
	checkDuplicateIps = true,
    itemPoint = 5130 -- item per hour
}
	
function onThink(interval)
    local players = Game.getPlayers()
    if #players == 0 then
        return true
    end

    local checkIp = {}
    for _, player in pairs(players) do
        local ip = player:getIp()
        if ip ~= 0 and (not config.checkDuplicateIps or not checkIp[ip]) then
            checkIp[ip] = true
            local time = player:getStorageValue(config.storageTime)
            if (time < 0) then time = 0 end
            if (time >= config.timeMax) then
                player:setStorageValue(config.storage, 0)
                local item = player:addItem(config.itemPoint, config.pointsPerTime)
                if item then
                    player:sendTextMessage(MESSAGE_STATUS_CONSOLE_BLUE, string.format("You have received %d %s for being online for an hour.", config.pointsPerTime, item:getName()))
                end
                return true
            end
            player:setStorageValue(config.storageTime, (time + interval))
        end
    end
    return true
end