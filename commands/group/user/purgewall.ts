import Discord from 'discord.js';
import Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("purgewall")
    .setDescription("Purges the wall of messages from the user that you supply")
    .addStringOption(o => o.setName("username").setDescription("The username that you wish to purge from the group wall"))

export const commandData: CommandData = {
    category: "User",
    permissions: config.permissions.group.user
}