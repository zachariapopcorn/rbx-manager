import Discord from 'discord.js';
import roblox = require('noblox.js');

import BotClient from '../../../utils/classes/BotClient';
import CommandFile from '../../../utils/interfaces/CommandFile';

import config from '../../../config';
import GroupHandler from '../../../utils/classes/GroupHandler';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let groupID = GroupHandler.getIDFromName(args["group"]);
        let authorRobloxID = await client.getRobloxUser(interaction.guild.id, interaction.user.id);
        if(client.config.verificationChecks) {
            let verificationStatus = false;
            if(authorRobloxID !== 0) {
                verificationStatus = await client.preformVerificationChecks(groupID, authorRobloxID, "Shouts");
            }
            if(!verificationStatus) {
                let embed = client.embedMaker({title: "Verification Checks Failed", description: "You've failed the verification checks", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
        }
        try {
            await roblox.shout(groupID, "");
        } catch(e) {
            let embed = client.embedMaker({title: "Error", description: `There was an error while trying to clear the group shout: ${e}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let embed = client.embedMaker({title: "Success", description: "You've successfully cleared the group shout", type: "success", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        await client.logAction(`<@${interaction.user.id}> has cleared the group shout in **${GroupHandler.getNameFromID(groupID)}**`);
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("clearshout")
    .setDescription("Clears the group shout")
    .addStringOption(o => o.setName("group").setDescription("The group to clear the shout of").setRequired(true).addChoices(...GroupHandler.parseGroups() as any)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Shout",
        permissions: config.permissions.group.shout
    },
    hasCooldown: true
}

export default command;