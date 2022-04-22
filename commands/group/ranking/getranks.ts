import Discord from 'discord.js';
import Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("getranks")
    .setDescription("Gets the ranks of the group")

export const commandData: CommandData = {
    category: "Ranking"
}