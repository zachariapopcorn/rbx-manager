import Discord from 'discord.js';
import Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("lock")
    .setDescription("Locks the inputted server")
    .addStringOption(o => o.setName("jobid").setDescription("The job ID of the server you wish to lock").setRequired(true))

export const commandData: CommandData = {
    category: "Lock",
    permissions: config.permissions.game.lock
}