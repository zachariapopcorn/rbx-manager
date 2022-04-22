import Discord from 'discord.js';
import Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("getjobid")
    .setDescription("Gets the job ID of the server the inputted user is in")
    .addStringOption(o => o.setName("username").setDescription("The username of the user you wish to get the server job ID of").setRequired(true))

export const commandData: CommandData = {
    category: "JobID",
    permissions: config.permissions.game.jobIDs
}