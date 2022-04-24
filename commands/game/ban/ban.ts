import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bans the inputted user from the game")
    .addStringOption(o => o.setName("username").setDescription("The username of the user you wish to ban").setRequired(true))

export const commandData: CommandData = {
    category: "Ban",
    permissions: config.permissions.game.ban
}