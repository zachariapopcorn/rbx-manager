import Discord from 'discord.js';
import Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("groupban")
    .setDescription("Bans the supplied user from the group")
    .addStringOption(o => o.setName("username").setDescription("The username of the user you wish to ban from the group"))

export const commandData: CommandData = {
    category: "User",
    permissions: config.permissions.group.user
}