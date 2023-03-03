import Discord from 'discord.js';
import roblox = require('noblox.js');

import BotClient from '../../../utils/classes/BotClient';
import CommandFile from '../../../utils/interfaces/CommandFile';

import config from '../../../config';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        if(client.isUserOnCooldown(require('path').parse(__filename).name, interaction.user.id)) {
            let embed = client.embedMaker({title: "Cooldown", description: "You're currently on cooldown for this command, take a chill pill", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let authorRobloxID = await client.getRobloxUser(interaction.guild.id, interaction.user.id);
        if(client.config.verificationChecks) {
            let verificationStatus = false;
            if(authorRobloxID !== 0) {
                verificationStatus = await client.preformVerificationChecks(authorRobloxID, "Shouts");
            }
            if(!verificationStatus) {
                let embed = client.embedMaker({title: "Verification Checks Failed", description: "You've failed the verification checks", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
        }
        try {
            await roblox.shout(client.config.groupId, args["message"]);
        } catch(e) {
            let embed = client.embedMaker({title: "Error", description: `There was an error while trying to shout the inputted message to the group: ${e}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let embed = client.embedMaker({title: "Success", description: "You've successfully shouted the inputted message to the group shout", type: "success", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        await client.logAction(`<@${interaction.user.id}> has shouted "**${args["message"]}**" to the group`);
        client.cooldowns.push({commandName: require('path').parse(__filename).name, userID: interaction.user.id, cooldownExpires: (Date.now() + (client.getCooldownForCommand(require('path').parse(__filename).name)))});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("shout")
    .setDescription("Shouts a message to the group")
    .addStringOption(o => o.setName("message").setDescription("The message that you wish to shout to the group").setRequired(true)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Shout",
        permissions: config.permissions.group.shout
    }
}

export default command;