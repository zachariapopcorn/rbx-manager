import Discord from 'discord.js';

import BotClient from '../../../utils/classes/BotClient';
import CommandFile from '../../../utils/interfaces/CommandFile';

import { commands } from '../../..';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction, client: BotClient, args: any): Promise<any> => {
        let helpData = {};
        for(let i = 0; i < commands.length; i++) {
            let commandName = commands[i].name;
            let slashData = commands[i].slashData;
            let commandData = commands[i].commandData;
            if(!helpData[commandData.category]) helpData[commandData.category] = {commandHelpStrings: [], helpEmbed: null};
            let commandString = `**${commandName}** | ${slashData.description}`;
            helpData[commandData.category].commandHelpStrings.push(commandString);
        }
        let categories = Object.keys(helpData);
        for(let i = 0; i < categories.length; i++) {
            let embedDescription = "";
            let categoryHelpData = helpData[categories[i]];
            for(let i = 0; i < categoryHelpData.commandHelpStrings.length; i++) {
                embedDescription += `${categoryHelpData.commandHelpStrings[i]}\n`;
            }
            let embed = client.embedMaker({title: `${categories[i]} Commands`, description: embedDescription, type: "info", author: interaction.user});
            helpData[categories[i]].helpEmbed = embed;
        }
        let helpPageIndex = 0;
        let embed = helpData[categories[helpPageIndex]].helpEmbed;
        let msg = await interaction.editReply({embeds: [embed]}) as Discord.Message;
        await msg.react('⬅️');
        await msg.react('➡️');
        let filter = (reaction: Discord.MessageReaction, user: Discord.User) => (reaction.emoji.name === "⬅️" || reaction.emoji.name === "➡️") && user.id === interaction.user.id;
        let collector = msg.createReactionCollector({filter: filter, time: client.config.collectorTime});
        collector.on('collect', async(reaction: Discord.MessageReaction) => {
            if(reaction.emoji.name === "⬅️") {
                helpPageIndex -= 1;
                if(helpPageIndex === -1) helpPageIndex = categories.length - 1;
            } else {
                helpPageIndex += 1;
                if(helpPageIndex === categories.length) helpPageIndex = 0;
            }
            embed = helpData[categories[helpPageIndex]].helpEmbed;
            await msg.edit({embeds: [embed]});
        });
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("help")
    .setDescription("Gets a list of commands"),
    commandData: {
        category: "General Group",
    }
}

export default command;