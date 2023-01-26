local module = {}

function module:Run(payload: {msgID: string, channelID: string, username: string})
	local config = require(script.Parent.Parent.Config)
	if(game:GetService("Players"):FindFirstChild(payload.username)) then
		local s,e = pcall(function()
			game:GetService("HttpService"):RequestAsync({
				Url = config.SERVER .. "/get-job-id",
				Method = "POST",
				Headers = {
					["Content-Type"] = "application/json",
					["api-key"] = config.WEB_API_KEY
				},
				Body = game:GetService("HttpService"):JSONEncode({channelID = payload.channelID, msgID = payload.msgID, jobID = game.JobId})
			})
		end)
		if(e) then
			warn("Get Job ID command returned an error: " .. e)
		end
	end
end

return module