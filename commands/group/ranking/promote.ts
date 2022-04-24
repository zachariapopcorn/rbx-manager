import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("promote")
    .setDescription("Promotes the inputed user")
    .addStringOption(o => o.setName("username").setDescription("The username of the person that you wish to promote").setRequired(true))

export const commandData: CommandData = {
    category: "Ranking",
    permissions: config.permissions.group.ranking
}