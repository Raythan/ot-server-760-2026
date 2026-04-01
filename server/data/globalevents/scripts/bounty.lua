-- Usa a mesma tabela que `data/lib/custom/bountyhunter.lua` (`bounty_hunter_system`).
-- Uma única query com JOIN evita "Commands out of sync" por queries aninhadas sem result.free.
function onThink(interval)
    local q = [[
        SELECT p.`name` AS `pname`, b.`prize`, b.`currencyType`
        FROM `bounty_hunter_system` b
        INNER JOIN `players` p ON p.`id` = b.`target_id`
        WHERE b.`killed` = 0
        ORDER BY b.`prize` DESC
        LIMIT 3
    ]]
    local res = db.storeQuery(q)
    local output = "MOST WANTED:\n"
    if res ~= false then
        local number = 1
        repeat
            local playerName = result.getDataString(res, "pname")
            local prize = result.getDataInt(res, "prize")
            local currency = result.getDataString(res, "currencyType")
            output = output .. "\n" .. number .. ". " .. playerName .. " - " .. prize .. " " .. currency
            number = number + 1
        until not result.next(res)
        result.free(res)
    else
        output = output .. "\n(no active bounties)"
    end
    Game.broadcastMessage(output)
    return true
end