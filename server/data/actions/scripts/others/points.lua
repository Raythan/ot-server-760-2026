local addpoints = 10 -- amount of points to add
function onUse(player, item, fromPosition, target, toPosition, isHotkey)
if isPlayer(player) and item:remove() then
db.query("UPDATE `accounts` SET `premium_points` = `premium_points` + "..addpoints.." WHERE `id` = '" ..getAccountNumberByPlayerName(player:getName()).. "';")
doPlayerSendTextMessage(player, MESSAGE_EVENT_ADVANCE, ""..addpoints.." premium points have been added to your account.")
player:getPosition():sendMagicEffect(13)
return true
end
end