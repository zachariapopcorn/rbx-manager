import Discord from 'discord.js';
import roblox = require('noblox.js');

import BotClient from '../../../utils/classes/BotClient';
import CommandFile from '../../../utils/interfaces/CommandFile';

import config from '../../../config';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction, client: BotClient, args: any): Promise<any> => {
        if(client.config.verificationChecks) {
            let verificationStatus = false;
            let robloxID = await client.getRobloxUser(interaction.guild.id, interaction.user.id);
            if(robloxID === 0) {
                verificationStatus = await client.preformVerificationChecks(robloxID, "JoinRequests");
            }
            if(!verificationStatus) {
                let embed = client.embedMaker({title: "Verification Checks Failed", description: "You've failed the verification checks", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
        }
        let joinRequests = await roblox.getJoinRequests(client.config.groupId, "Asc", 10);
        if(joinRequests.data.length === 0) {
            let embed = client.embedMaker({title: "Join Requests", description: "There are currently no join requests", type: "info", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let previousPageCursor = joinRequests.previousPageCursor;
        let nextPageCursor = joinRequests.nextPageCursor;
        let embedDescription = "";
        let counter = 1;
        for(let i = 0; i < joinRequests.data.length; i++) {
            embedDescription += `**${counter}**: ${joinRequests.data[i].requester.username}`;
            counter++;
        }
        let embed = client.embedMaker({title: "Join Requests", description: embedDescription, type: "info", author: interaction.user});
        if(!previousPageCursor && !nextPageCursor) {
            return await interaction.editReply({embeds: [embed]});
        }
        let msg = await interaction.editReply({embeds: [embed]}) as Discord.Message;
        await msg.react('⬅️');
        await msg.react('➡️');
        let filter = (reaction: Discord.MessageReaction, user: Discord.User) => (reaction.emoji.name === "⬅️" || reaction.emoji.name === "➡️") && user.id === interaction.user.id;
        let collector = msg.createReactionCollector({filter: filter, time: client.config.collectorTime});
        collector.on('collect', async(reaction: Discord.MessageReaction) => {
            if(reaction.emoji.name === "⬅️") {
                joinRequests = await roblox.getJoinRequests(client.config.groupId, "Asc", 10, previousPageCursor);
            } else {
                joinRequests = await roblox.getJoinRequests(client.config.groupId, "Asc", 10, nextPageCursor);
            }
            previousPageCursor = joinRequests.previousPageCursor;
            nextPageCursor = joinRequests.nextPageCursor;
            let counter = 1;
            for(let i = 0; i < joinRequests.data.length; i++) {
                embedDescription += `**${counter}**: ${joinRequests.data[i].requester.username}`;
                counter++;
            }
            embed = client.embedMaker({title: "Join Requests", description: embedDescription, type: "info", author: interaction.user});
            await msg.edit({embeds: [embed]});
        });
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("get-join-requests")
    .setDescription("Gets the pending join requests of the group"),
    commandData: {
        category: "Join Request",
        permissions: config.permissions.group.joinrequests
    }
}

export default command;