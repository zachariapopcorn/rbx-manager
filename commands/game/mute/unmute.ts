import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData, CommandLog, MessagingService, RobloxDatastore } from '../../../utils/classes';
import { config } from '../../../config';

import roblox = require('noblox.js');

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    let database = new RobloxDatastore(client.config.API_KEY);
    let logs: CommandLog[] = [];
    let usernames = args["username"].replaceAll(" ", "").split(",");
    let reasons = args["reason"];
    if(!reasons) { // If nothing for the reason argument was inputted
        reasons = [];
        while(true) {
            reasons.push("No reason provided");
            if(reasons.length === usernames.length) break;
        }
    } else {
        reasons = reasons.split(",");
        if(reasons.length === 1) {
            while(true) {
                reasons.push(reasons[0]);
                if(reasons.length === usernames.length) break;
            }
        } else if(reasons.length !== usernames.length) {
            let embed = client.embedMaker("Argument Error", `You inputted an unequal amount of usernames and reasons, please make sure that these amounts are equal, or, if you wish to apply one reason to multiple people, only put that reason for the reason argument`, "error", interaction.user);
            return await interaction.editReply(embed);
        }
    }
    for(let i = 0; i < usernames.length; i++) {
        let username = usernames[i];
        let reason = reasons[i];
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
            await database.setModerationData(robloxID, {banData: {isBanned: oldData.banData.isBanned, reason: oldData.banData.reason}, muteData: {isMuted: false, reason: ""}});
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
            await client.logAction(`<@${interaction.user.id}> has unbanned **${username}** from the game with the reason of **${reason}**`);
            continue;
        }
    }
    await client.initiateLogEmbedSystem(interaction, logs);
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Unmutes the inputted user(s)")
    .addStringOption(o => o.setName("username").setDescription("The username(s) of the user(s) you wish to unmute").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("The reason(s) of the unmutes(s)").setRequired(false))

export const commandData: CommandData = {
    category: "Mute",
    permissions: config.permissions.game.mute
}