import Discord from 'discord.js';
import Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("checkuser")
    .setDescription("Checks the status of punishments for the user")
    .addStringOption(o => o.setName("username").setDescription("The username of the user you wish to check").setRequired(true))

export const commandData: CommandData = {
    category: "General Game",
    permissions: config.permissions.game.general
}