import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("shout")
    .setDescription("Shouts a message to the group")
    .addStringOption(o => o.setName("message").setDescription("The message that you wish to shout to the group").setRequired(true))

export const commandData: CommandData = {
    category: "Shout",
    permissions: config.permissions.group.shout
}