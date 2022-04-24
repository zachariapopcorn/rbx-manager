import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("announce")
    .setDescription("Announces the inputted message to every game server")
    .addStringOption(o => o.setName("message").setDescription("The message that you wish to announce").setRequired(true))

export const commandData: CommandData = {
    category: "General Game",
    permissions: config.permissions.game.broadcast
}