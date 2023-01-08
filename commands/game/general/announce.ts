import Discord from 'discord.js';

import BotClient from '../../../utils/classes/BotClient';
import CommandFile from '../../../utils/interfaces/CommandFile';
import MessagingService from '../../../utils/classes/MessagingService';

import config from '../../../config';

const messaging = new MessagingService(config);

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let title = args["title"];
        let message = args["message"];
        try {
            await messaging.sendMessage("Announce", {title: title, message: message});
        } catch(e) {
            let embed = client.embedMaker({title: "Error", description: `There was an error while trying to send the announcement to the game: ${e}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        await client.logAction(`<@${interaction.user.id}> has announced **${message}** with the title of **${title}** to the game's players`);
        let embed = client.embedMaker({title: "Success", description: "You've successfully sent this announcement to the game", type: "success", author: interaction.user});
        return await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("announce")
    .setDescription("Announces the inputted message to every game server")
    .addStringOption(o => o.setName("title").setDescription("The title of the announcement").setRequired(true))
    .addStringOption(o => o.setName("message").setDescription("The message that you wish to announce").setRequired(true)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "General Game",
        permissions: config.permissions.game.broadcast
    }
}

export default command;