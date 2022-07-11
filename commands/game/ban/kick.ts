import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData, CommandLog, MessagingService } from '../../../utils/classes';
import { config } from '../../../config';

import roblox = require('noblox.js');

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any) {
    let logs: CommandLog[] = [];
    let messaging = new MessagingService(client.config.API_KEY);
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
            await messaging.sendMessage("Kick", {username: username});
        } catch(e) {
            
        }
        logs.push({
            username: username,
            status: "Success"
        });
        if(config.logging.enabled) {
            await client.logAction(`<@${interaction.user.id}> has kicked **${username}** from the game with the reason of **${reason}**`);
            continue;
        }
    }
    await client.initiateLogEmbedSystem(interaction, logs);
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kicks user(s) from the game")
    .addStringOption(o => o.setName("username").setDescription("The username(s) of the user(s) you wish to kick").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("The reason(s) of the kicks(s)").setRequired(false))

export const commandData: CommandData = {
    category: "Ban",
    permissions: config.permissions.game.kick
}