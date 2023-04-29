import Discord from 'discord.js';
import roblox = require('noblox.js');

import BotClient from '../../../utils/classes/BotClient';
import CommandFile from '../../../utils/interfaces/CommandFile';

import config from '../../../config';

async function batchAccept(client: BotClient, userIDS: Number[]): Promise<void> {
    let res = await client.request({
        url: `https://groups.roblox.com/v1/groups/${client.config.groupId}/join-requests`,
        method: "POST",
        headers: {},
        body: {
            "UserIds": userIDS
        },
        robloxRequest: true
    });
    let body = await res.json();
    if(body.errors) {
        throw new Error(body.errors[0].message);
    }
}

function parseUsers(users: roblox.GroupJoinRequest[]): Number[] {
    let userIDs = [];
    for(let i = 0; i < users.length; i++) {
        userIDs.push(users[i].requester.userId);
    }
    return userIDs;
}

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction, client: BotClient, args: any): Promise<any> => {
        let reason = args["reason"];
        let joinRequests = await roblox.getJoinRequests(client.config.groupId, "Asc", 100);
        if(joinRequests.data.length === 0) {
            let embed = client.embedMaker({title: "No Join Requests", description: "There are currently no pending join requests", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let embed = client.embedMaker({title: "Processing Join Requests", description: "Currently processing join requests, please be patient. You will be pinged once the process is done", type: "info", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        let nextCursor = joinRequests.nextPageCursor;
        await client.logAction(`<@${interaction.user.id}> has started to accept all of the join requests in the group for the reason of **${reason}**`);
        try {
            await batchAccept(client, parseUsers(joinRequests.data));
        } catch(e) {
            let embed = client.embedMaker({title: "Error", description: `There was an error while trying to accept the join requests: ${e}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        while(nextCursor) {
            joinRequests = await roblox.getJoinRequests(client.config.groupId, "Asc", 100, nextCursor);
            nextCursor = joinRequests.nextPageCursor;
            try {
                await batchAccept(client, parseUsers(joinRequests.data));
            } catch(e) {
                let embed = client.embedMaker({title: "Error", description: `There was an error while trying to accept the join requests: ${e}`, type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
        }
        embed = client.embedMaker({title: "Success", description: "You've successfully accepted all the join requests in the group", type: "success", author: interaction.user});
        await interaction.editReply({content: `<@${interaction.user.id}>`, embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("accept-all-requests")
    .setDescription("Accepts all the pending join requests")
    .addStringOption(o => o.setName("reason").setDescription("The reason for why you are accepting all these requests").setRequired(true)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Join Request",
        permissions: config.permissions.group.joinrequests
    },
    hasCooldown: true
}

export default command;