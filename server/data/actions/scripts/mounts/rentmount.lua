function onUse(player, item, fromPosition, target, toPosition, isHotkey)
if player:getStorageValue(11555) >= os.time() then
         player:sendTextMessage(MESSAGE_EVENT_ADVANCE, 'You already rented a mount! expire '..os.date ("%d %B %Y %X ",player:getStorageValue(11555)))
        return true
    end
local mountId = {7, 8, 9}
local money = 500
    if player:removeMoney(money) then
        player:addMount(mountId[math.random(#mountId)])
        player:setStorageValue(11555, os.time() + 86400)
        player:sendTextMessage(MESSAGE_INFO_DESCR, "You received rented mount.")
        player:getPosition():sendMagicEffect(13)   
    else     
        player:sendTextMessage(MESSAGE_INFO_DESCR, "You dont have enough money.")
    end
return true
end