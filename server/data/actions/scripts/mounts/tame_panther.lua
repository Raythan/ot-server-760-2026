local tameConfig = {
    [5218] = {
        tameMonster = "Midnight Panther", --Needs to be all lowercase
        mountId = 5,
        chances = {
            [1] = {name = "sucess", chance = 20, sendText = "You have successfully tamed a midnight panther!!"}, --20%
            [2] = {name = "runAway", chance = 10, sendText = "The midnight panther ran away.."}, --10%
            [3] = {name = "itemBreak", chance = 10, sendText = "You broke the leather whip.."}, --10%
            [4] = {name = "growl", sendText = "Groarrrrrrrr...."} --This will trigger if non of the above gets triggered, doesnt need chance value.
        }
    }
}

function onUse(player, item, fromPosition, itemEx, toPosition, isHotkey)
    local tameItem = tameConfig[item.itemid]

    if tameItem then
        if player:hasMount(tameItem.mountId) then
            return false
        end    
        if itemEx:getName():lower() == tameItem.tameMonster:lower() then
            for i=1,4 do
                if tameItem.chances[i].name == "growl" then
                    itemEx:say(tameItem.chances[i].sendText, TALKTYPE_MONSTER_SAY)
                    return true
                end
                if math.random(1,100) <= tameItem.chances[i].chance then    
                    if tameItem.chances[i].name == "itemBreak" then
                        player:getPosition():sendMagicEffect(3)
                        item:remove()
                    elseif tameItem.chances[i].name == "runAway" then
                        itemEx:getPosition():sendMagicEffect(3)
                        itemEx:remove()
                    elseif tameItem.chances[i].name == "sucess" then
                        itemEx:getPosition():sendMagicEffect(3)
                        item:remove()
                        player:getPosition():sendMagicEffect(15)        
                        player:addMount(tameItem.mountId)
                    end
                    player:say(tameItem.chances[i].sendText, TALKTYPE_MONSTER_SAY)
                    return true
                end
            end
        end
    end
    return false
end