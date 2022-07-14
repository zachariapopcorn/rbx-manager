import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';

import roblox = require('noblox.js');

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any) {
    let groupInfo = await roblox.getGroup(client.config.groupId);
    let embedDescription = "";
    embedDescription += `**Group Name**: ${groupInfo.name}\n`;
    embedDescription += `**Group Description**: ${groupInfo.description}\n`;
    embedDescription += `**Group Owner**: ${groupInfo.owner.username}\n`;
    embedDescription += `**Group Membercount**: ${groupInfo.memberCount}\n`;
    embedDescription += `**Join Requests Enabled**: ${!groupInfo.publicEntryAllowed}`;
    let embed = client.embedMaker("Group Information", embedDescription, "info", interaction.user);
    return await interaction.editReply(embed);
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("info")
    .setDescription("Gets the information of the group")

export const commandData: CommandData = {
    category: "General Group"
}