import Discord from 'discord.js';
import Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("force")
    .setDescription("Forces the ongoing request to close (MAY BREAK PRIOR REQUEST)")

export const commandData: CommandData = {
    category: "General Game",
    permissions: config.permissions.game.general
}