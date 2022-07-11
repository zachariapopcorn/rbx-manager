import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

import roblox = require('noblox.js');

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any) {
    if(client.config.verificationChecks) {
        let verificationStatus = await client.preformVerificationChecks(interaction.user.id, "groupMembershipPermissions.inviteMembers");
        if(!verificationStatus) {
            let embed = client.embedMaker("Verification Checks Failed", "You've failed the verification checks", "error", interaction.user);
            return await interaction.editReply(embed);
        }
    }
    let joinRequests = await roblox.getJoinRequests(client.config.groupId, "Asc", 10);
    let previousPageCursor = joinRequests.previousPageCursor;
    let nextPageCursor = joinRequests.nextPageCursor;
    let embedDescription = "";
    let counter = 1;
    for(let i = 0; i < joinRequests.data.length; i++) {
        embedDescription += `**${counter}**: ${joinRequests.data[i].requester.username}`;
        counter++;
    }
    if(joinRequests.data.length === 0) {
        embedDescription = "There are currently no join requests";
        let embed = client.embedMaker("Join Requests", embedDescription, "info", interaction.user, true);
        return await interaction.editReply(embed);
    }
    let embed = client.embedMaker("Join Requests", embedDescription, "info", interaction.user, true);
    if(!previousPageCursor && !nextPageCursor) {
        return await interaction.editReply(embed);
    }
    client.addButton(embed, "backButton", "Previous Page", "PRIMARY");
    client.addButton(embed, "nextButton", "Next Page", "PRIMARY");
    let msg = await interaction.editReply(embed) as Discord.Message;
    let filter = (buttonInteraction: Discord.Interaction) => buttonInteraction.isButton() && buttonInteraction.user.id === interaction.user.id;
    let collector = msg.createMessageComponentCollector({filter: filter});
    collector.on("collect", async(button: Discord.ButtonInteraction) => {
        if(button.customId === "backButton") {
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
        await button.reply({content: "ㅤ"});
        await button.deleteReply();
        let embed = client.embedMaker("Join Requests", embedDescription, "info", interaction.user, true);
        client.addButton(embed, "backButton", "Previous Page", "PRIMARY");
        client.addButton(embed, "nextButton", "Next Page", "PRIMARY");
        if(!previousPageCursor) embed.components[0].components[0].setDisabled(true);
        if(!nextPageCursor) embed.components[1].components[0].setDisabled(true);
        await msg.edit(embed);
    });
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("get-join-requests")
    .setDescription("Gets the pending join requests of the group")

export const commandData: CommandData = {
    category: "Join Request",
    permissions: config.permissions.group.joinrequests
}