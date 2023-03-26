import Discord from 'discord.js';
import roblox = require('noblox.js');

import BotClient from '../../../utils/classes/BotClient';
import CommandFile from '../../../utils/interfaces/CommandFile';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let ranks = await roblox.getRoles(client.config.groupId);
        let description = "";
        for(let i = 1; i < ranks.length; i++) {
            if(client.isLockedRole(ranks[i])) {
                description += `**Name**: ${ranks[i].name} | **ID**: ${ranks[i].rank} [LOCKED]\n`;
            } else {
                description += `**Name**: ${ranks[i].name} | **ID**: ${ranks[i].rank}\n`;
            }
        }
        let embed = client.embedMaker({title: "Ranks in Group", description: description, type: "info", author: interaction.user});
        return await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("getranks")
    .setDescription("Gets the ranks of the group"),
    commandData: {
        category: "Ranking"
    },
    hasCooldown: false
}

export default command;