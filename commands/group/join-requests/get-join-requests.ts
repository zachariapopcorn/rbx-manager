import Discord from 'discord.js';
import Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("get-join-requests")
    .setDescription("Gets the pending join requests of the group")

export const commandData: CommandData = {
    category: "Join Request",
    permissions: config.permissions.group.joinrequests
}