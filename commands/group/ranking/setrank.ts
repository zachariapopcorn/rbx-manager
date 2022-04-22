import Discord from 'discord.js';
import Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("setrank")
    .setDescription("Sets the rank of the inputted user to the inputted rank")
    .addStringOption(o => o.setName("username").setDescription("The username of the person you wish to rank").setRequired(true))
    .addStringOption(o => o.setName("rank").setDescription("The rank you wish to rank this user to").setRequired(true))

export const commandData: CommandData = {
    category: "Ranking",
    permissions: config.permissions.group.ranking
}