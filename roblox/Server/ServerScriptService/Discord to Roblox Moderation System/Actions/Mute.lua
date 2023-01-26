local module = {}

function convertToDN(username: string)
	local plr = game:GetService("Players"):FindFirstChild(username)
	if(plr) then
		return plr.DisplayName
	end
end

function module:Run(payload: {username: string, reason: string})
	local displayName = convertToDN(payload.username)
	local chatService = require(game:GetService("ServerScriptService"):WaitForChild("ChatServiceRunner"):WaitForChild("ChatService"))
	local channel = chatService:GetChannel("All")
	pcall(function()
		channel:MuteSpeaker(displayName, payload.reason)
	end)
end

return module