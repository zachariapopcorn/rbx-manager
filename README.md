# RbxManager | Simple Roblox Group and Game Management Bot
## Introduction
Hello Roblox Community! I'm here today releasing a project that I thought could be pretty helpful to yall. It's a roblox group and game management tool designed to be as simple as possible. This is a combination of my [ranking bot](https://devforum.roblox.com/t/roblox-group-managerranking-bot/934111) and my [moderation bot](https://devforum.roblox.com/t/discord-to-roblox-moderation-bot/989798) all updated into one package

(This post is under a different account as @zachariapopcorn got unfairly terminated)

This tool has almost all of the features from these two projects, but I didn't implement features that are either now blocked by a captcha or unrealistic to have in an automated environment

# Showcase
As this bot has multiple things to showcase, I'm going to showcase a bit of the main things
Command Logs - https://i.imgur.com/JUeaXoc.png
Ranking Logs - https://i.imgur.com/hCObICu.png
Example Command Output: https://i.imgur.com/95uSCXd.png
Showcase Video: ![8mb.video-W1h-Y5HhK6S7|video](upload://c8SEnG6IGniag04tu5E3WjGzMLZ.mp4)

# Setup
This bot has two components, a Node.js part and a Lua part. Please follow the steps carefully in order to set the bot up successfully

# Step 1
Install Node.js on your system. For Windows, go to [here](https://nodejs.org/en/) and select the LTS version. For Linux, assuming GUI-less server, one way you can install Node.js is using [nvm](https://github.com/nvm-sh/nvm)

# Step 2
Go to the [Github repository](https://github.com/zachariapopcorn/rbx-manager) and download the code by clicking Code > Download ZIP and then extracting the zip. For Linux, assuming you have Git installed, run ``git clone https://github.com/zachariapopcorn/rbx-manager``

# Step 3
Once you have the unextracted folder, open it, it's contents should look like [this](https://i.imgur.com/30bzkeA.png)

# Step 4
Rename ``ENV_FORMAT.txt`` to ``.env`` and then open it in your favorite text editor

# Step 5
Configure the env file. All of these values are very sensitive information, so don't leak them!

# Step 5.1
The value, ``DISCORD_TOKEN``, is your bot's Discord token. To get it, go to the https://discord.com/developers and clicking "New Application" and name it whatever you want. After that, click on the Bot tab and click "Add Bot" and accept that a bot's creation is irreversible. Once you created a bot, click on "Reset Token" and then click "Copy". While you're still here, go to the the "Public Bot" toggle and make sure it's disabled. Back in the .env file, copy the token value that you copied after the equal sign

# Step 5.2
The value, ``ROBLOX_USERNAME``, is your bot's Roblox username. This is used to generate new cookies using the login command

# Step 5.3
The value, ``ROBLOX_PASSWORD``, is your bot's Roblox password. This is used to generate new cookies using the login command

# Step 5.4
The value, ``ROBLOX_COOKIE``, is you bot's Roblox cookie. To get it, log in to your bot's Roblox account in an incognito window, open inspect element, click on Storage, then on Cookies, expand it, and click roblox.com. You will see multiple cookies that the site uses, what you need is the cookie labelled ``.ROBLOSECURITY``

**The above instruction was tested with Firefox, for Chrome based browsers, look up how to get a site's cookies**

Once you found the ``.ROBLOSECURITY`` cookie, copy it and paste it after the equal sign in the .env file

# Step 5.5
The value, ``ROBLOX_API_KEY`` , is your API key for the Open cloud endpoints. To get it, go to [your API keys](https://create.roblox.com/credentials) and click "Create API Key". Once you do so, name it whatever you want and give it the Datastore and Messaging Service API systems and add your desired experience to it and for the scopes, give Datastore [these scopes](https://i.imgur.com/5w8Qw2I.png) and Messaging Service the Publish scope. Once done, go to section 3: Security, and input the IP address of the machine you want to host the bot on.

If you want to allow all requests regardless of IP address, type ``0.0.0.0`` and ``0.0.0.0/0`` (very insecure)

After that, click "SAVE & GENERATE KEY", and then click "COPY KEY TO CLIPBOARD". Paste the API key after the equal sign in the .env file

# Step 5.6
The value, ``ROVER_API_KEY``, is your API key for Rover, the verification provider that this bot uses. To get it, go to [the Rover website](https://rover.link/) and login with your Discord account. Once you do that, click on "Manage Servers" and click on the server(s) that you bot is going to be in, and then click "Developer API". Once you're here, type a name for your API key and click "Create" and then click "Copy" on the prompt that came up. Paste what you copied after the equal sign in the .env file

# Step 5.7
The value, ``WEB_API_KEY``, is your API key for the bot's API. This can be anything that you want, just type it after the equal sign

# Step 6
Now that you're done configuring the .env file, close it, and open the ``config.ts`` file with your favorite text editor.

# Step 6.1
The value, ``groupId``, is the group ID of the group you want the bot to manage. To get it, go to your group page and it is the numbers after ``/groups/`` 
![image|304x39](upload://g4xudwRW9kFU2FATi9VQISvUENd.png)

# Step 6.2
The value, ``permissions``, is an object with certain permission nodes. These take a string of Discord role IDs

# Step 6.3
The value, ``logging``, is an object with logging properties. To enable/disable it, toggle the enable values, and to set the logging channel, set it to a channel ID

# Step 6.4
The value, ``embedColors``, is an object setting the colors of different types of embeds. You don't need to change these values, but if you want to, [here are the valid options](https://discord.js.org/#/docs/discord.js/main/typedef/ColorResolvable)

# Step 6.5
The value, ``defaultCooldown``, is the default command cooldown in milliseconds. The default is 5000 milliseconds (5 seconds)

# Step 6.6
The value, ``cooldownOverrides``, are exceptions to the default cooldown set in step 6.6. The takes properties of ``commandName: new_cooldown``. For example, if I wanted to set the cooldown of the exile command to 20 seconds (20000 milliseconds), the value would be `cooldownOverrides: {"exile": 20000}`

# Step 6.7
The value, ``suspensionRank``, is the rank ID of the suspended rank in your group. This is the rank that people get set to when suspended

# Step 6.8
The value, ``universes``, is an array value representing the universes that you want to link. These must be in the format ``universeID: number, universeDisplayName: string`` To get a universe ID, go to [your creations page](https://create.roblox.com/creations), click the "..." on the games you want to configure, and click "Copy Universe ID" and set it in the config. For the ``universeDisplayName`` value, that can be anything you want, but I recommend setting it to your universe's name

# Step 6.9
The value, ``datastoreName``, is the name of the datastore to use. You don't need to configure this

**If you change this value, you MUST change it's value in the Roblox files in step 11**

# Step 6.10
The value, ``verificationChecks``, is the toggle for verification checks on the group commands. This by default is enabled, but if you want to disable it, set this to false

# Step 6.11
The value, ``collectorTime``, is how long collectors wait before being terminated in milliseconds. The default is 2 minutes, but you can change this if you want

# Step 6.12
The value, ``maximumNumberOfUsers``, indicates how many users you can execute a bulk action on. The default is 5, but you can change this if you want

# Step 6.13
The value, ``lockedRanks``, "locks" the ranks inputted, meaning that you can't promote/demote/setrank to those ranks. This accepts rank names and ids

# Step 6.14
The value, ``lockedCommands``, locks commands, meaning that no one can use them. Simply type a command name and it will lock it. Casing does not matter

# Step 6.15
The value, ``whitelistedServers``, are the server IDs that the bot registers commands for. Put your server IDs in here

# Step 7
Now that you've configured your bot, go back to your bot's Discord develop page and copy it's client ID. After doing so, paste the following link into your browser: ``https://discord.com/oauth2/authorize?client_id=CLIENT_ID_HERE&permissions=8&scope=applications.commands%20bot`` and replace CLIENT_ID_HERE with your bot's client ID

# Step 8
Once you've added the bot into your server, go back to your bot file and open a command line terminal. In here, type ``npm install`` and then once that completes, run ``npm run winStart`` if on Windows or ``npm run linuxStart`` if on Linux. If you've done everything successfully, the bot should boot up with no errors

Now that you're done with the Node.js portion, it's time to move onto your Roblox portion

# Step 9
In your bot files, there should be a directory called ``roblox``. In it, there's a file called ``RobloxFiles.rbxm``. Open your game and insert the file into your game

# Step 10
You will see 3 folders named "Discord to Roblox Moderation System". Move these to the according services
```
StarterPlayer.StarterPlayerScripts - Folder with the local script called AnnouncementParser
ServerScriptService - Folder with the modulescript called Config
ReplicatedStorage - Folder with the remote called Announcement
```

# Step 11
Open the Config file that should be in ``game.ServerScriptService["Discord to Roblox Moderation System"]`` and configure it to your needs
**The only configuration variables that are required for you to change is the ``SERVER`` and ``WEB_API_KEY`` fields, with the exception of the ``moderations`` field if you modified the `` ``datastoreName`` value in Step 6.6**

You are now done with setting up this system! Was that hard?
