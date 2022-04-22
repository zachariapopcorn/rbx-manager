import Discord from 'discord.js';
import Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kicks a user from the game")
    .addStringOption(o => o.setName("username").setDescription("The username of the user you wish to kick").setRequired(true))

export const commandData: CommandData = {
    category: "Ban",
    permissions: config.permissions.game.ban
}