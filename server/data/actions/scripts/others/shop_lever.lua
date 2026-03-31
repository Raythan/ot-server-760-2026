local config = {
	--[actionid] = {backpack_id = ID OF BACKPACK, potion_id = ID OF POTION, cost = COST OF BP WITH POTIONS
	[5001] = {backpack_id = 2870, potion_id = 3147, cost = 200}, -- Blank Rune
	[5002] = {backpack_id = 5119, potion_id = 5125, cost = 1100}, -- Mana FLuid
	[5003] = {backpack_id = 2870, potion_id = 3147, cost = 200}, -- Blank Rune
	[5004] = {backpack_id = 5119, potion_id = 5125, cost = 1100}, -- Mana Fluid
	[5005] = {backpack_id = 2870, potion_id = 3147, cost = 200}, -- Blank Rune
	[5006] = {backpack_id = 5119, potion_id = 5125, cost = 1100}, -- Mana Fluid
	[5007] = {backpack_id = 2870, potion_id = 3147, cost = 200}, -- Blank Rune
	[5008] = {backpack_id = 5119, potion_id = 5125, cost = 1100}, -- Mana Fluid
	[5009] = {backpack_id = 2870, potion_id = 3147, cost = 200}, -- Blank Rune
	[5010] = {backpack_id = 5119, potion_id = 5125, cost = 1100}, -- Mana Fluid
	[5011] = {backpack_id = 2870, potion_id = 3147, cost = 200}, -- Blank Rune
	[5012] = {backpack_id = 5119, potion_id = 5125, cost = 1100}, -- Mana Fluid
	[5013] = {backpack_id = 2870, potion_id = 3147, cost = 200}, -- Blank Rune
	[5014] = {backpack_id = 5119, potion_id = 5125, cost = 1100} -- Mana Fluid
}
function onUse(cid, item, fromPosition, itemEx, toPosition)
	local container = 0
	if(item.itemid == 2772) then    
		if(doPlayerRemoveMoney(cid, config[item.actionid].cost) == TRUE) then
			doTransformItem(item.uid, item.itemid+1)
			container = doPlayerAddItem(cid, config[item.actionid].backpack_id, 1)
			for i = 1, 20 do
				doAddContainerItem(container, config[item.actionid].potion_id)
			end
		else
			doPlayerSendCancel(cid, "Sorry, you don't have enough money.")
		end
	elseif(item.itemid == 2773) then
		doTransformItem(item.uid, item.itemid-1)
	end
	return TRUE
end