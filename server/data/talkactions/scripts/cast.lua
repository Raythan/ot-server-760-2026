local storage = 17754 -- exp storage

function dump(o)
   if type(o) == 'table' then
      local s = '{ '
      for k,v in pairs(o) do
         if type(k) ~= 'number' then k = '"'..k..'"' end
         s = s .. '['..k..'] = ' .. dump(v) .. ','
      end
      return s .. '} '
   else
      return tostring(o)
   end
end

function sendHelp(player) 
    player:sendCastChannelMessage('', 'Commands:\n!cast on <password>\n!cast off\n!cast list\n!cast help\n!cast mute/unmute <spectator_name>\n!cast ban/unban <spectator_name>\n!cast kick <spectator_name>\n!cast desc <description>', 12)
end

function findIP(spectators, name)
	for k, v in pairs(spectators) do
		if k:lower() == name:lower() then
			return v
		end
	end
	return nil
end

function removeKey(t, k_to_remove)
  local new = {}
  for k, v in pairs(t) do
	if k:lower() ~= k_to_remove:lower() then
		new[k] = v
	end
  end
  return new
end

function onSay(player, words, param)
    local data = player:getSpectators()
	if param == "" or param == nil then
		if data['broadcast'] == true then
			sendHelp(player)
		else
			player:sendTextMessage(22, "Use !cast on to start cast")
		end
		return false
	end
	local split = param:split(" ")
	local action = split[1]:lower()
	table.remove(split, 1)
	local target = table.concat(split, " ")
	if action == "on" then
		data['broadcast'] = true
		player:setStorageValue(storage, 1)
		player:sendTextMessage(MESSAGE_INFO_DESCR, "You have started casting your gameplay.")
		data['password'] = target
		player:setSpectators(data)
		sendHelp(player)
		return false
	elseif data['broadcast'] ~= true and data['broadcast'] ~= 1 then
		player:sendTextMessage(22, "Use !cast on to start cast")
		return false
	elseif action == "off" then
		data['broadcast'] = false
		player:setStorageValue(storage, 0)
		player:sendTextMessage(MESSAGE_INFO_DESCR, "You have stopped casting your gameplay.")
		player:setSpectators(data)
		return false
	elseif action == "desc" or action == "description" then
		data['description'] = target
		player:sendCastChannelMessage('', 'New cast description: ' .. data['description'], 12)		
		player:setSpectators(data)
		return false
	elseif action == "list" then
		local spectators_list = ""
		for k, v in pairs(data['spectators']) do
			spectators_list = spectators_list .. k .. ", "
		end
		player:sendCastChannelMessage('', 'Spectators: ' .. spectators_list, 12)		
		return false
	elseif action == "kick" then
		local ip = findIP(data['spectators'], target)
		if ip == nil then
			player:sendCastChannelMessage('', 'There is no spectator: ' .. target, 12)		
		else
			player:sendCastChannelMessage('', 'Spectator ' .. target .. ' has been kicked', 12)		
			data['kicks'][target] = ip
		end
		player:setSpectators(data)
		return false
	elseif action == "mute" then
		local ip = findIP(data['spectators'], target)
		if ip == nil then
			player:sendCastChannelMessage('', 'There is no spectator: ' .. target, 12)		
		else
			player:sendCastChannelMessage('', 'Spectator ' .. target .. ' has been muted', 12)		
			data['mutes'][target] = ip
		end
		player:setSpectators(data)
		return false
	elseif action == "ban" then
		local ip = findIP(data['spectators'], target)
		if ip == nil then
			player:sendCastChannelMessage('', 'There is no spectator: ' .. target, 12)		
		else
			player:sendCastChannelMessage('', 'Spectator ' .. target .. ' has been banned', 12)		
			data['bans'][target] = ip
		end
		player:setSpectators(data)
		return false
	elseif action == "unmute" then
		local ip = findIP(data['mutes'], target)
		if ip == nil then
			player:sendCastChannelMessage('', 'There is no spectator: ' .. target, 12)		
		else
			player:sendCastChannelMessage('', 'Spectator ' .. target .. ' has been unmuted', 12)		
			data['mutes'] = removeKey(data['mutes'], target)
		end
		player:setSpectators(data)
		return false
	elseif action == "unban" then
		local ip = findIP(data['bans'], target)
		if ip == nil then
			player:sendCastChannelMessage('', 'There is no spectator: ' .. target, 12)		
		else
			player:sendCastChannelMessage('', 'Spectator ' .. target .. ' has been unbanned', 12)		
			data['bans'] = removeKey(data['bans'], target)
		end
		player:setSpectators(data)
		return false
	else
		sendHelp(player)	
	end
end