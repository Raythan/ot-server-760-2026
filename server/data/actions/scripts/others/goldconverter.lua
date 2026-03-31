local goldCoin = 3031
local platCoin = 3035
local crysCoin = 3043

function onUse(player, item, fromPosition, target, toPosition, isHotkey)
    local goldCount, goldRemoved = player:getItemCount(goldCoin), 0
    local platCount, platRemoved = player:getItemCount(platCoin), 0
    
    goldCount = math.floor(goldCount/100)
    while goldCount > 0 do
        goldCount = goldCount - 1
        goldRemoved = goldRemoved + 1
        platCount = platCount + 1
    end
    
    platCount = math.floor(platCount/100)
    while platCount > 0 do
        platCount = platCount - 1
        platRemoved = platRemoved + 1
    end
    
    if goldRemoved > 0 then
        player:removeItem(goldCoin, goldRemoved * 100)
        player:addItem(platCoin, goldRemoved)
    end
    
    if platRemoved > 0 then
        player:removeItem(platCoin, platRemoved * 100)
        player:addItem(crysCoin, platRemoved)
    end
    
    local text = "No stacks of coins needed to be converted."
    if goldRemoved > 0 or platRemoved > 0 then
        text = (goldRemoved == 0 and "" or " Converted " .. goldRemoved .. " stack" .. (goldRemoved > 0 and "s" or "") .. " of gold coins.")
        text = (platRemoved == 0 and "" or " Converted " .. platRemoved .. " stack" .. (platRemoved > 0 and "s" or "") .. " of platinum coins.")
        fromPosition:sendMagicEffect(CONST_ME_MAGIC_GREEN)
    end
    player:sendTextMessage(MESSAGE_INFO_DESCR, text)
    return true
end