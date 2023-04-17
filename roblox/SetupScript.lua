local httpService = game:GetService("HttpService")
local scriptEditor = game:GetService("ScriptEditorService")

local SERVER_FILES_URL = "https://api.github.com/repos/zachariapopcorn/rbx-manager/contents/roblox/Server/ServerScriptService/Discord%20to%20Roblox%20Moderation%20System?ref=master"
local CLIENT_FILES_URL = "https://api.github.com/repos/zachariapopcorn/rbx-manager/contents/roblox/Client/StarterPlayer/StarterPlayerScripts/Discord%20to%20Roblox%20Moderation%20System?ref=master"

local folderName = "Discord to Roblox Moderation System"

function parseURL(url: string, folder: Folder, isServer: boolean)
	local res = httpService:JSONDecode(httpService:GetAsync(url))
	for _,file in pairs(res) do
		if(string.find(file.name, ".lua")) then
			local scriptInstance;
			if(isServer) then
				if(file.name == "Main.lua") then
					scriptInstance = Instance.new("Script", folder)
				else
					scriptInstance = Instance.new("ModuleScript", folder)
				end
			else
				scriptInstance = Instance.new("LocalScript", folder)
			end
			scriptInstance.Name = file.name:gsub(".lua", "")
			scriptEditor:OpenScriptDocumentAsync(scriptInstance)
			local script = scriptEditor:FindScriptDocument(scriptInstance)
			script:EditTextAsync(httpService:GetAsync(file.download_url), 1, 1, 1, 1)
			script:CloseAsync()
		else
			Instance.new("Folder", folder).Name = file.name
			parseURL(file.url, folder[file.name], isServer)
		end
	end
end

pcall(function()
	game:GetService("ReplicatedStorage")[folderName]:Destroy()
	game:GetService("ServerScriptService")[folderName]:Destroy()
	game:GetService("StarterPlayer").StarterPlayerScripts[folderName]:Destroy()
end)

local replicatedStorageFolder = Instance.new("Folder", game:GetService("ReplicatedStorage"))
replicatedStorageFolder.Name = folderName
Instance.new("RemoteEvent", replicatedStorageFolder).Name = "Announcement"
Instance.new("RemoteEvent", replicatedStorageFolder).Name = "SendMutes"

local model = game:GetService("InsertService"):LoadAsset(13157806758)
model.Parent = replicatedStorageFolder
model["Announcement GUI"].Parent = replicatedStorageFolder
model:Destroy()

local serverFolder = Instance.new("Folder", game:GetService("ServerScriptService"))
serverFolder.Name = folderName
parseURL(SERVER_FILES_URL, serverFolder, true)

local clientFolder = Instance.new("Folder", game:GetService("StarterPlayer").StarterPlayerScripts)
clientFolder.Name = folderName
parseURL(CLIENT_FILES_URL, clientFolder, false)
