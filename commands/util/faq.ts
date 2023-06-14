import Discord from 'discord.js';

import BotClient from '../../utils/classes/BotClient';

import CommandFile from '../../utils/interfaces/CommandFile';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction, client: BotClient, args: any): Promise<any> => {
        let description = "Here's an FAQ of questions that I think people would ask me\n\n";
        description += "**Q: Why aren't plugin commands showing up?**\n"
        description += "A: Discord does a stupid, it'll take some time for the command to show up on the client"
        let embed = client.embedMaker({title: "FAQ", description: description, type: "info", author: interaction.user});
        return await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("faq")
    .setDescription("Gets a list of random questions that I think people would ask"),
    commandData: {
        category: "Util",
        isEphemeral: true,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
}

export default command;