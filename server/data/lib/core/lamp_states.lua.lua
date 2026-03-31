wallLamps = {}
lampTransformIds, reverseLampTransformIds = { -- used for direct access to flip ids
    [2907] = 2908
}, {}

for k, v in pairs(lampTransformIds) do
    reverseLampTransformIds[v] = k
end

function table.size(t)
    local size = 0
    for k, v in pairs(t) do
        size = size + 1
    end
    return size
end

function serialize(s)
    local isTable = type(s) == 'table'
    local ret = {(isTable and "{" or nil)}
    local function doSerialize(s)
        if isTable then
            local size = table.size(s)
            local index = 0
            for k, v in pairs(s) do
                index = index + 1
                local key = (type(k) == 'string') and '"'..k..'"' or k
                local val = (type(v) == 'string') and '"'..v..'"' or v
                local comma = ((index < size) and ', ' or '')
                if type(v) == 'table' then
                    ret[#ret+1] = ('[%s] = {'):format(key)
                    doSerialize(v)
                    ret[#ret+1] = ('}%s'):format(comma)
                else
                    ret[#ret+1] = ('[%s] = %s%s'):format(key, val, comma)
                end
            end
        else
            ret[#ret+1] = s
        end
    end
    doSerialize(s)
    return (table.concat(ret) .. (isTable and "}" or ""))
end

function unserialize(str)
    local f = loadstring("return ".. str)
    return f and f() or nil
end

function serializePos(pos)
    return string.format('Position(%d, %d, %d)', pos.x, pos.y, pos.z)
end

function unserializePos(s)
    return Position(s:match("Position%((%d+), (%d+), (%d+)%)"))
end

function dumpLampStates()
    local file = io.open('lamp_states.lua', 'w')
    if file then
        file:write(serialize(wallLamps))
    end
end

function loadLampStates()
    local file = io.open('lamp_states.lua')
    wallLamps = unserialize(file:read('*a'))
    for serializedPos, state in pairs(wallLamps) do
        local flippedState = lampTransformIds[state] or reverseLampTransformIds[state]
        Tile(unserializePos(serializedPos)):getItemById(state):transform(flippedState)
    end
end

loadLampStates()
