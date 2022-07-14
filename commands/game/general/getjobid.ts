import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData, MessagingService } from '../../../utils/classes';
import { config } from '../../../config';

import roblox = require('noblox.js');

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any) {
    let messaging = new MessagingService(client.config.ROBLOX_API_KEY);
    let username = args["username"];
    let rbxID;
    try {
        rbxID = await roblox.getIdFromUsername(username);
    } catch {
        let embed = client.embedMaker("Invalid Username", "The username that you provided is invalid", "error", interaction.user);
        return await interaction.editReply(embed);
    }
    username = await roblox.getUsernameFromId(rbxID);
    let embed = client.embedMaker("Awaiting...", "Because this function requires a message from the Roblox game, you'll have to wait for it to get your response. This message will be edited with the job id if found, and it'll stay the same if it wasn't found", "info", interaction.user);
    let msg = await interaction.editReply(embed);
    try {
        await messaging.sendMessage("GetJobID", {
            msgID: msg.id,
            username: username
        });
    } catch(e) {
        let embed = client.embedMaker("Error", `There was an error while trying to send out the request to the Roblox game server for the user's job id: ${e}`, "error", interaction.user);
        return await interaction.editReply(embed);
    }
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("getjobid")
    .setDescription("Gets the job ID of the server the inputted user is in")
    .addStringOption(o => o.setName("username").setDescription("The username of the user you wish to get the server job ID of").setRequired(true))

export const commandData: CommandData = {
    category: "JobID",
    permissions: config.permissions.game.jobIDs
}