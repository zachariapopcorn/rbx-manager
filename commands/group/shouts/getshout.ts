import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';

import roblox = require('noblox.js');

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    let shout = await roblox.getShout(client.config.groupId);
    let embedDescription = "";
    embedDescription += `**Poster**: ${shout.poster.username}\n`;
    embedDescription += `**Body**: ${shout.body}\n`;
    embedDescription += `**Created**: ${shout.created}\n`;
    let embed = client.embedMaker("Current Shout", embedDescription, "info", interaction.user);
    return await interaction.editReply(embed);
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("getshout")
    .setDescription("Gets the current group shout")

export const commandData: CommandData = {
    category: "Shout"
}