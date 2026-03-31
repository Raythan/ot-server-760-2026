function onThink(interval)

    local player = db.storeQuery("SELECT `sp_id`, `prize` FROM `bounty_hunters` WHERE `killed` = '0' ORDER BY `prize` DESC LIMIT 3;")
    local output = "MOST WANTED:\n"
    if(player ~= false) then
        local number = 1
                while (true) do
                    local name = result.getDataString(player, "sp_id")
                    local prize = result.getDataInt(player, "prize")
                    local playerName = db.storeQuery("SELECT `name` FROM `players` WHERE `players`.`id` = "..name..";")
                    local playerName1 = result.getDataString(playerName, "name")
                    output = output.. "\n"..number..". "..playerName1.." - "..prize.."k"
                    number = number + 1
                    if not(result.next(player)) then
                        break
                    end
                end
                result.free(player)
    end
    Game.broadcastMessage(output)

return true
end