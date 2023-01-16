import Discord from 'discord.js';
import roblox = require('noblox.js');
import bodyParser = require('body-parser');

import fs from 'fs/promises';

import config from './config';

import express from 'express';

import { REST } from '@discordjs/rest';
import { InteractionType, Routes } from 'discord-api-types/v10';

import BotClient from './utils/classes/BotClient';
import CommandFile from './utils/interfaces/CommandFile';
import CommandHelpers from './utils/classes/CommandHelpers';
import CommandInstance from './utils/interfaces/CommandInstance';

import checkBans from './utils/events/checkBans';
import checkAudits from './utils/events/checkAuditLog';

const client = new BotClient(config);

const app = express();
app.use(bodyParser.json());

export const commands:CommandInstance[] = [];

app.get("/", async (request, response) => {
    response.status(200).send("OK");
});

app.post("/get-job-id", async (request, response) => {
    if(request.headers["api-key"] !== config.WEB_API_KEY) return response.status(403).send("Invalid API Key");
    // Implement get-job-id logic later
    response.status(200).send("OK");
});

let listener = app.listen(process.env.PORT, () => {
    console.log(`Your app is currently listening on port: ${(listener.address() as any).port}`);
});

async function readCommands(path?: string) {
    if(!path) path = "./commands";
    let files = await fs.readdir(path);
    for(let i = 0; i < files.length; i++) {
        let file = files[i];
        if(file.indexOf(".") === -1) {
            await readCommands(`${path}/${file}`);
        } else {
            file = file.replace(".ts", ".js"); // This is here because when it compiles to JS, it saves to the build directory, and it starts as build/index.js, so it's reading files in build/commands, hence the string change
            let commandFile = require(`${path}/${file}`).default as CommandFile; // .default cause when you call "export default <x>" it adds a default property to it (idk why)
            let command = {
                file: commandFile,
                name: file.split('.')[0],
                slashData: commandFile.slashData,
                commandData: commandFile.commandData
            }
            commands.push(command);
        }
    }
}

async function registerSlashCommands() {
    let slashCommands = [];
    for(let i = 0; i < commands.length; i++) {
        let commandData;
        try {
            commandData = commands[i].slashData.toJSON()
            slashCommands.push(commandData);
        } catch(e) {
            console.log(`Couldn't load slash command data for ${commands[i].name} with error: ${e}`);
        }
    }
    let rest = new REST().setToken(client.config.DISCORD_TOKEN);
    let whitelistedServers = client.config.whitelistedServers;
    try {
        for(let i = 0; i < whitelistedServers.length; i++) {
            let serverID = whitelistedServers[i];
            await rest.put(Routes.applicationGuildCommands(client.user.id, serverID), {body: slashCommands});
        }
    } catch(e) {
        console.error(`There was an error while registering slash commands: ${e}`);
    }
}

async function loginToRoblox(robloxCookie: string) {
    try {
        await roblox.setCookie(robloxCookie);
    } catch {
        console.error("Unable to login to Roblox");
        return;
    }
    console.log(`Logged into the Roblox account - ${(await roblox.getCurrentUser()).UserName}`);
    await checkAudits(client);
    await checkBans(client);
}

client.once('ready', async() => {
    console.log(`Logged into the Discord account - ${client.user.tag}`);
    if(client.application.botPublic) {
        console.warn("BOT IS PUBLIC | SHUTTING DOWN");
        return process.exit();
    }
    await loginToRoblox(client.config.ROBLOX_COOKIE);
    await readCommands();
    await registerSlashCommands();
});

client.on('interactionCreate', async(interaction: Discord.Interaction) => {
    if(interaction.type !== InteractionType.ApplicationCommand) return;
    let command = interaction.commandName.toLowerCase();
    for(let i = 0; i < commands.length; i++) {
        if(commands[i].name === command) {
            await interaction.deferReply();
            let index = config.lockedCommands.findIndex(c => c.toLowerCase() === command);
            if(index !== -1) {
                let embed = client.embedMaker({title: "Locked Command", description: "This command is currently locked", type: "error", author: interaction.user});
                await interaction.editReply({embeds: [embed]});
                return;
            }
            let args = CommandHelpers.loadArguments(interaction);
            if(args["username"]) {
                let usernames = args["username"].replaceAll(" ", "").split(",") as string[];
                if(usernames.length > config.maximumNumberOfUsers) {
                    let embed = client.embedMaker({title: "Maximum Number of Users Exceeded", description: "You've inputted more users than the currently allowed maximum, please lower the amount of users in your command and try again", type: "error", author: interaction.user});
                    await interaction.editReply({embeds: [embed]});
                    return;
                }
            }
            if(!CommandHelpers.checkPermissions(commands[i].file, interaction.member as Discord.GuildMember)) {
                let embed = client.embedMaker({title: "No Permission", description: "You don't have permission to run this command", type: "error", author: interaction.user});
                await interaction.editReply({embeds: [embed]});
                return;
            }
            try {
                await commands[i].file.run(interaction, client, args);
            } catch(e) {
                let embed = client.embedMaker({title: "Error", description: "There was an error while trying to run this command. The error has been logged in the console", type: "error", author: interaction.user});
                await interaction.editReply({embeds: [embed]});
                console.error(e);
            }
        }
    }
});

client.login(client.config.DISCORD_TOKEN);