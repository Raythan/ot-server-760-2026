dofile('data/lib/events/firestorm_event.lua')
function onStartup()
    Game.setStorageValue(configFireStormEvent.storages.main, -1)
    Game.setStorageValue(configFireStormEvent.storages.joining, -1)
return true
end