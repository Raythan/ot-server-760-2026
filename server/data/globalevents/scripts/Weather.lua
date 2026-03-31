function onThink(interval, lastExecution)
 local players = Game.getPlayers()
 if #players == 0 then
 return true
 end
 
 local player
 for i = 1, #players do
 player = players[i]
 player:sendWeatherEffect(weatherConfig.groundEffect, weatherConfig.fallEffect, weatherConfig.thunderEffect)
 end
 return true
end