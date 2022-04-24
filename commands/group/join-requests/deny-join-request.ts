import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("deny-join-request")
    .setDescription("Denies the join request of the user inputted")
    .addStringOption(o => o.setName("username").setDescription("The username of the user you wish to deny the join request of").setRequired(true))

export const commandData: CommandData = {
    category: "Join Request",
    permissions: config.permissions.group.joinrequests
}