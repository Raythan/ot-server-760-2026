function onSay(player, words, param)
    local message = "[Boost Creature]\n\n Every day a monster is chosen to have experience added. \n\nChosen creature: ".. firstToUpper(boostCreature[1].name) .."\n Exp: +".. boostCreature[1].exp .."%"
    player:popupFYI(message)
    return false
end