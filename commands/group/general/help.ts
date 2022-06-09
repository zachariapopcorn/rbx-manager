import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { commands } from '../../..';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any) {
    let helpData = {}
    for(let i = 0; i < commands.length; i++) {
        let commandName = commands[i].name;
        let slashData = commands[i].slashData as Builders.SlashCommandBuilder;
        let commandData = commands[i].commandData as CommandData;
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
        let embed = client.embedMaker(`${categories[i]} Commands`, embedDescription, "info", interaction.user);
        helpData[categories[i]].helpEmbed = embed;
    }
    let helpPageIndex = 0;
    let embed = helpData[categories[helpPageIndex]].helpEmbed;
    client.addButton(embed, "previousPage", "Previous Page", "PRIMARY");
    client.addButton(embed, "nextPage", "Next Page", "PRIMARY");
    let msg = await interaction.editReply(embed) as Discord.Message;
    let filter = (buttonInteraction: Discord.Interaction) => buttonInteraction.isButton() && buttonInteraction.user.id === interaction.user.id;
    let collector = msg.createMessageComponentCollector({filter: filter});
    collector.on('collect', async(button: Discord.ButtonInteraction) => {
        if(button.customId === "previousPage") {
            helpPageIndex -= 1;
            if(helpPageIndex === -1) helpPageIndex = categories.length - 1;
        } else {
            helpPageIndex += 1;
            if(helpPageIndex === categories.length) helpPageIndex = 0;
        }
        embed = helpData[categories[helpPageIndex]].helpEmbed;
        embed.components = [];
        client.addButton(embed, "previousPage", "Previous Page", "PRIMARY");
        client.addButton(embed, "nextPage", "Next Page", "PRIMARY");
        await button.reply({content: "ㅤ"});
        await button.deleteReply();
        await msg.edit(embed);
    });
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("help")
    .setDescription("Gets a list of commands")

export const commandData: CommandData = {
    category: "General Group"
}