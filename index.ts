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

const client = new BotClient();
client.config = config;
client.pendingRequest = {
    authorID: "",
    channelID: "",
    type: "",
    payload: null
}

const app = express();
app.use(bodyParser.json());

export const commands = [];
export const interactions = [];

app.get('/', async (request, response) => {
    response.sendStatus(200);
});

app.get('/get-request', async (request, response) => {
    response.status(200).send(client.pendingRequest);
});

app.post('/finalize-request', async (request, response) => {
    response.status(200);
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
    let rest = new REST({version: "9"}).setToken(config.token);
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
    let auditLogListener = roblox.onAuditLog(config.groupId);
    auditLogListener.on('data', async(data) => {
        if(config.logging.enabled === false) return;
        if(data.actionType === "Post Status") return;
        if(data.actor.user.username === (await roblox.getCurrentUser()).UserName) return;
        let embedDescription = "";
        embedDescription += `**Actor**: ${data.actor.user.username}\n`;
        embedDescription += `**Action**: ${data.actionType}\n`;
        embedDescription += `**Date**: ${data.created}\n`;
        let embed = client.embedMaker("New Audit Log", embedDescription, "info");
        let channel = await client.channels.fetch(config.logging.auditLogChannel) as Discord.TextChannel;
        if(!channel) return;
        try {
            await channel.send(embed);
        } catch(e) {
            console.error(`There was an error while trying to send the audit data to the Discord logging channel: ${e}`);
        }
    });
    auditLogListener.on('error', async(e) => {
        console.error(`There was an error while trying to fetch the audit data: ${e.message}`);
    });
    let shoutListener = roblox.onShout(config.groupId);
    shoutListener.on('data', async(data) => {
        if(config.logging.enabled === false) return;
        if(data.poster.username === (await roblox.getCurrentUser()).UserName) return;
        let embedDescription = "";
        embedDescription += `**Poster**: ${data.poster.username}\n`;
        embedDescription += `**Body**: ${data.body}\n`;
        embedDescription += `**Created**: ${data.created}\n`;
        let embed = client.embedMaker("New Shout", embedDescription, "info");
        let channel = await client.channels.fetch(config.logging.shoutLogChannel) as Discord.TextChannel;
        if(!channel) return;
        try {
            await channel.send(embed);
        } catch(e) {
            console.error(`There was an error while trying to send the shout data to the Discord logging channel: ${e}`);
        }
    });
    shoutListener.on('error', async(e) => {
        console.error(`There was an error while trying to fetch the shout data: ${e.message}`);
    });

}

client.on('ready', async() => {
    console.log(`Logged into the Discord account - ${client.user.tag}`);
    if(client.application.botPublic) {
        console.warn("BOT IS PUBLIC | SHUTTING DOWN");
        return process.exit();
    }
    await loginToRoblox(config.cookie);
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

client.login(config.token);