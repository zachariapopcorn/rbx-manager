import Discord from 'discord.js';
import roblox from 'noblox.js';

import BotClient from '../../../utils/classes/BotClient';
import CommandFile from '../../../utils/interfaces/CommandFile';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction, client: BotClient, args: any): Promise<any> => {
        let groupInfo = await roblox.getGroup(client.config.groupId);
        let embedDescription = "";
        embedDescription += `**Group Name**: ${groupInfo.name}\n`;
        embedDescription += `**Group Description**: ${groupInfo.description}\n`;
        embedDescription += `**Group Owner**: ${groupInfo.owner.username}\n`;
        embedDescription += `**Group Membercount**: ${groupInfo.memberCount}\n`;
        let jrStatus = !groupInfo.publicEntryAllowed;
        embedDescription += `**Join Requests Enabled**: ${jrStatus ? "Yes" : "No"}`;
        let embed = client.embedMaker({title: "Group Information", description: embedDescription, type: "info", author: interaction.user});
        return await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("info")
    .setDescription("Gets the information of the group"),
    commandData: {
        category: "General Group",
    },
    hasCooldown: false
}

export default command;