import Discord from 'discord.js';
import Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("fire")
    .setDescription("Fires the inputted user")
    .addStringOption(o => o.setName("username").setDescription("The person that you wish to fire").setRequired(true))

export const commandData: CommandData = {
    category: "Ranking",
    permissions: config.permissions.group.ranking
}