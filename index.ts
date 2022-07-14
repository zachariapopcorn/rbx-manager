import Discord from 'discord.js';
import roblox = require('noblox.js');
import bodyParser = require('body-parser');

import fs from 'fs/promises';

import { config } from './config';

import express from 'express';

import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { BotClient, CommandFile, CommandHelpers } from './utils/classes';
import { checkBans } from './utils/checkbans';
import { checkAudits } from './utils/checkAuditLog';

const client = new BotClient();
client.config = config;

const app = express();
app.use(bodyParser.json());

export const commands = [];
export const interactions = [];

app.get('/', async (request, response) => {
    response.sendStatus(200);
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
            file = file.replace(".ts", ".js");
            let commandFile = require(`${path}/${file}`) as CommandFile;
            let command = {
                file: commandFile,
                name: file.split('.')[0],
                slashData: commandFile.slashData,
                commandData: commandFile.commandData || []
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
            commandData = await commands[i].slashData.toJSON();
            slashCommands.push(commandData);
        } catch(e) {
            console.log(`Couldn't load slash command data for ${commands[i].name} with error: ${e}`);
        }
    }
    let rest = new REST({version: "9"}).setToken(config.DISCORD_TOKEN);
    try {
        for(let i = 0; i < config.whitelistedServers.length; i++) {
            let serverID = config.whitelistedServers[i];
            await rest.put(Routes.applicationGuildCommands(client.user.id, serverID),{body: slashCommands});
        }
    } catch(e) {
        console.error(`There was an error while registering slash commands: ${e}`);
    }
}

export async function loginToRoblox(robloxCookie: string) {
    try {
        await roblox.setCookie(robloxCookie);
    } catch {
        console.error("Unable to login to Roblox");
        return;
    }
    console.log(`Logged into the Roblox account - ${(await roblox.getCurrentUser()).UserName}`);
    await checkAudits(client);
}

client.on('ready', async() => {
    console.log(`Logged into the Discord account - ${client.user.tag}`);
    if(client.application.botPublic) {
        console.warn("BOT IS PUBLIC | SHUTTING DOWN");
        return process.exit();
    }
    await loginToRoblox(config.ROBLOX_COOKIE);
    await checkBans();
    await readCommands();
    await registerSlashCommands();
});

client.on('interactionCreate', async(interaction) => {
    if(!interaction.isCommand()) return;
    let command = interaction.commandName.toLowerCase();
    for(let i = 0; i < commands.length; i++) {
        if(commands[i].name === command) {
            await interaction.deferReply();
            let args = CommandHelpers.loadArguments(interaction);
            if(!CommandHelpers.checkPermissions(commands[i], interaction.member as Discord.GuildMember)) {
                let embed = client.embedMaker("No Permission", "You don't have permission to run this command", "error", interaction.user);
                await interaction.editReply(embed);
                return;
            }
            try {
                await commands[i].file.run(interaction, client, args);
            } catch(e) {
                let embed = client.embedMaker("Error", "There was an error while trying to run this command. The error has been logged in the console", "error", interaction.user);
                await interaction.editReply(embed);
                console.error(e);
            }
        }
    }
});

client.login(config.DISCORD_TOKEN);