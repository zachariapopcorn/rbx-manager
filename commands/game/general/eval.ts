import Discord from 'discord.js';
import Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("eval")
    .setDescription("Runs serverside code on either all servers or a specific one")
    .addStringOption(o => o.setName("type").setDescription("The type of execution to preform").setRequired(true))
    .addStringOption(o => o.setName("jobID").setDescription("The job ID of the server you wish to run the code in (only if you choose so)").setRequired(false))

export const commandData: CommandData = {
    category: "General Game",
    permissions: config.permissions.game.execution
}