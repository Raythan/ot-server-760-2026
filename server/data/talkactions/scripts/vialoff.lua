local baseStorage = 50000
local vials = {2874}

function removePlayerVials(cid)
    local player = Player(cid)
    if not player then
        return
    end
  
    if player:getStorageValue(baseStorage) < 1 then
        return player:returnVials()
    end

    for k,v in pairs(vials) do
        local count = player:getItemCount(v, FLUID_NONE)
        if count > 0 then
            player:setStorageValue(v, math.max(player:getStorageValue(v), 0) + count)
            player:removeItem(v, count, FLUID_NONE)
        end
    end
    addEvent(removePlayerVials, 100, player:getId())
end

function Player:returnVials()
    for k,v in pairs(vials) do
        local count = self:getStorageValue(v)
        if count > 0 then
            self:setStorageValue(v, 0)
            self:addItem(0, false)
        end
    end
end

function onSay(player, words, param, channel)
    if player:getStorageValue(baseStorage) < 1 then
        player:setStorageValue(baseStorage, 1)
        removePlayerVials(player:getId())
		player:getPosition():sendMagicEffect(CONST_ME_MAGIC_RED)
		player:sendTextMessage(MESSAGE_STATUS_WARNING, "You're OFF the empty vials!!")
    else
        player:setStorageValue(baseStorage, 0)
    player:getPosition():sendMagicEffect(CONST_ME_MAGIC_GREEN)
	player:sendTextMessage(MESSAGE_INFO_DESCR, "You're ON the empty vials!!")		
    end
    return false
end