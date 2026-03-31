dofile('data/lib/events/firestorm_event.lua')
local daysOpen = {}         
for k, v in pairs(configFireStormEvent.days) do
    table.insert(daysOpen, k)
end
function onThink(interval, lastExecution)
if isInArray(daysOpen, os.date('%A')) then
    if isInArray(configFireStormEvent.days[os.date('%A')], os.date('%X', os.time())) then
        if Game.getStorageValue(configFireStormEvent.storages.joining) ~= 1 then
            doStartCountingFireStormEvent(0)
            for _, player in ipairs(Game.getPlayers()) do
                 if player:getStorageValue(configFireStormEvent.storages.player) > 0 then
                    player:setStorageValue(configFireStormEvent.storages.player, -1)
                    player:teleportTo(player:getTown():getTemplePosition())
                end
            end
            Game.setStorageValue(configFireStormEvent.storages.joining, 1)
            addEvent(doStartFireStormEvent, configFireStormEvent.delayTime * 60 * 1000)
        end
    end
end
return true
end