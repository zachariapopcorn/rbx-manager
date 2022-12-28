import Discord from 'discord.js';
import roblox = require('noblox.js');

import BotClient from '../../../utils/classes/BotClient';
import CommandFile from '../../../utils/interfaces/CommandFile';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let shout = await roblox.getShout(client.config.groupId);
        let embedDescription = "";
        embedDescription += `**Poster**: ${shout.poster.username}\n`;
        embedDescription += `**Body**: ${shout.body}\n`;
        embedDescription += `**Created**: ${shout.created}\n`;
        let embed = client.embedMaker({title: "Current Shout", description: embedDescription, type: "info", author: interaction.user});
        return await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("getshout")
    .setDescription("Gets the current group shout"),
    commandData: {
        category: "Shout"
    }
}

export default command;