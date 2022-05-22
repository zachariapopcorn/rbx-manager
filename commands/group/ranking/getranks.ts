import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';

import roblox = require('noblox.js');

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    let ranks = await roblox.getRoles(client.config.groupId);
    let description = "";
    for(let i = 1; i < ranks.length; i++) {
        let rankNameIndex = client.config.lockedRanks.findIndex(v => v === ranks[i].name);
        let rankIDIndex = client.config.lockedRanks.findIndex(v => v === ranks[i].rank);
        if(rankNameIndex === -1 && rankIDIndex === -1) {
            description += `**Name**: ${ranks[i].name} | **ID**: ${ranks[i].rank}\n`;
        } else {
            description += `**Name**: ${ranks[i].name} | **ID**: ${ranks[i].rank} [LOCKED]\n`;
        }
    }
    let embed = client.embedMaker("Ranks in Group", description, "info", interaction.user);
    return await interaction.editReply(embed);
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("getranks")
    .setDescription("Gets the ranks of the group")

export const commandData: CommandData = {
    category: "Ranking"
}