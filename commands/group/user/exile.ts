import Discord from 'discord.js';
import Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("exile")
    .setDescription("Kicks the inputted user from the group")
    .addStringOption(o => o.setName("username").setDescription("The username of the user you wish to exile").setRequired(true))

export const commandData: CommandData = {
    category: "User",
    permissions: config.permissions.group.user
}