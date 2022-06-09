import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData, CommandLog, RobloxDatastore } from '../../../utils/classes';
import { config } from '../../../config';

import roblox = require('noblox.js');

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any) {
    let database = new RobloxDatastore(client.config.API_KEY);
    let logs: CommandLog[] = [];
    let usernames = args["username"].replaceAll(" ", "").split(",");
    for(let i = 0; i < usernames.length; i++) {
        let username = usernames[i];
        let robloxID;
        try {
            robloxID = await roblox.getIdFromUsername(username);
        } catch {
            logs.push({
                username: username,
                status: "Error",
                message: "The username provided is an invalid Roblox username"
            });
            continue;
        }
        username = await roblox.getUsernameFromId(robloxID);
        try {
            let oldData = await database.getModerationData(robloxID);
            await database.setModerationData(robloxID, {isBanned: true, isMuted: oldData.isMuted});
        } catch(e) {
            logs.push({
                username: username,
                status: "Error",
                message: e
            });
            continue;
        }
        logs.push({
            username: username,
            status: "Success"
        });
        if(config.logging.enabled) {
            await client.logAction(`<@${interaction.user.id}> has banned **${username}** from the game`);
            continue;
        }
    }
    await client.initiateLogEmbedSystem(interaction, logs);
    client.pendingRequest = {
        authorID: interaction.user.id,
        channelID: interaction.channel.id,
        type: "Kick",
        payload: usernames
    }
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bans the inputted user(s) from the game")
    .addStringOption(o => o.setName("username").setDescription("The username(s) of the user(s) you wish to ban").setRequired(true))

export const commandData: CommandData = {
    category: "Ban",
    permissions: config.permissions.game.ban
}