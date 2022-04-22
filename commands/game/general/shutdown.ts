import Discord from 'discord.js';
import Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("shutdown")
    .setDescription("Shutdowns all servers or shuts down a specific server")
    .addStringOption(o => o.setName("type").setDescription("The type of shutdown to preform").setRequired(true))
    .addStringOption(o => o.setName("jobID").setDescription("The job ID of the server you wish to shutdown (only if you choose so)").setRequired(false))

export const commandData: CommandData = {
    category: "General Game",
    permissions: config.permissions.game.shutdown
}