-- Coluna na base TFS: `onlinetime` (sem underscore), ver database.sql / iologindata.cpp
function Player.getOnlineTime(self)
    local resultId = db.storeQuery(string.format('SELECT `onlinetime` FROM `players` WHERE `id` = %d', self:getGuid()))
    if not resultId then
        return 0
    end

    local value = result.getNumber(resultId, "onlinetime")
    result.free(resultId)
    return value
end

function Player.addOnlineTime(self, amount)
    db.query(string.format("UPDATE `players` SET `onlinetime` = `onlinetime` + %d WHERE `id` = %d", amount, self:getGuid()))
end