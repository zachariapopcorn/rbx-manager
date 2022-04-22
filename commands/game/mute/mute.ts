import Discord from 'discord.js';
import Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("mute")
    .setDescription("Mutes the inputted user")
    .addStringOption(o => o.setName("username").setDescription("The username of the user you wish to mute").setRequired(true))

export const commandData: CommandData = {
    category: "Mute",
    permissions: config.permissions.game.mute
}