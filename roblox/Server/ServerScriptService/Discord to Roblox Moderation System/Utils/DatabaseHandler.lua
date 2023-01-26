local DatastoreService = game:GetService("DataStoreService")
local config = require(script.Parent.Parent.Config)
local database = DatastoreService:GetDataStore(config.DATASTORE_NAME)

type ModerationData = {
	banData: {
		isBanned: boolean,
		reason: string
	},
	muteData: {
		isMuted: boolean,
		reason: string
	}
}

local module = {}

function module:GetModerationInformation(userID: number) : ModerationData
	local modData: ModerationData = nil
	local s,e = pcall(function()
		modData = database:GetAsync(tostring(userID) .. "-moderationData")
	end)
	if e then return nil end
	if(modData == nil) then
		modData = {
			banData = {
				isBanned = false,
				reason = ""
			},
			muteData = {
				isMuted = false,
				reason = ""
			}
		}
	end
	return modData
end

return module