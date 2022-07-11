import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

import roblox = require('noblox.js');

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any) {
    let username = args["username"];
    try {
        await roblox.getIdFromUsername(username);
    } catch {
        let embed = client.embedMaker("Invalid Username", "The username that you provided is invalid", "error", interaction.user);
        return await interaction.editReply(embed);
    }
    // add messaging call later
    let embed = client.embedMaker("Success", "You've successfully sent out a request for the user's game's job id. I'll ping you once I get it", "success", interaction.user);
    return await interaction.editReply(embed);
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("getjobid")
    .setDescription("Gets the job ID of the server the inputted user is in")
    .addStringOption(o => o.setName("username").setDescription("The username of the user you wish to get the server job ID of").setRequired(true))

export const commandData: CommandData = {
    category: "JobID",
    permissions: config.permissions.game.jobIDs
}