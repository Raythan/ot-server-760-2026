function onThink(interval)
    local effects = {
    {position = Position(32444, 32232, 7), text = "Rent Horse", say = true, color = math.random(1,255)},
	{position = Position(32365, 32239, 7), text = "Training Room", say = true, color = math.random(1,255)},
    {position = Position(32369, 32244, 7), text = "Boosted Creature\n ", effect = 30, say = true, color = math.random(1,255)},
    {position = Position(32369, 32244, 7), text = "+" .. boostCreature[1].exp .."% EXP", say = true, color = math.random(1,255)},
    --{position = Position(32369, 32244, 7), text = "+" .. boostCreature[1].loot .."% Loot", say = true, color = math.random(1,255)},
}

    for i = 1, #effects do
        local settings = effects[i]
        local spectators = Game.getSpectators(settings.position, false, true, 7, 7, 5, 5)
        if #spectators > 0 then
            if settings.text then
                for i = 1, #spectators do
                    if settings.say then
                        spectators[i]:say(settings.text, TALKTYPE_MONSTER_SAY, false, spectators[i], settings.position)
                    else
                        Game.sendAnimatedText(settings.text, settings.position, settings.color)
                    end
                end
            end
            if settings.effect then
                settings.position:sendMagicEffect(settings.effect)
            end
        end
    end
   return true
end
