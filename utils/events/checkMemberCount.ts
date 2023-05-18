import Discord from 'discord.js';
import roblox = require('noblox.js');

import BotClient from '../classes/BotClient';

const oldMemberCounts: {id: number, count: number}[] = [];

export default async function checkMemberCount(groupID: number, client: BotClient) {
    if(!client.config.counting.enabled) return;
    try {
        let groupInfo = (await roblox.getGroup(groupID));
        let index = oldMemberCounts.findIndex(v => v.id === groupID);
        if(index === -1) {
            oldMemberCounts.push({id: groupID, count: groupInfo.memberCount});
            throw("Skip check");
        }
        if(groupInfo.memberCount === oldMemberCounts[index].count) throw("Skip check");
        let isAddition = groupInfo.memberCount > oldMemberCounts[index].count;
        let isAtGoal = groupInfo.memberCount >= client.config.counting.goal;
        let embedDescription = "";
        embedDescription += `We have ${(isAddition ? "gained" : "lost")} **${Math.abs(groupInfo.memberCount - oldMemberCounts[index].count)}** members\n`;
        embedDescription += `**Old MemberCount**: ${oldMemberCounts[index].count}\n`;
        embedDescription += `**New MemberCount**: ${groupInfo.memberCount}`;
        embedDescription += `**Goal Reached?**: ${isAtGoal ? "Yes" : "No"}`;
        let embed = client.embedMaker({title: `${(isAddition ? "Gained Members" : "Lost Members")}`, description: embedDescription, type: "info", author: client.user});
        let channel = await client.channels.fetch(client.config.counting.loggingChannel) as Discord.TextChannel;
        if(channel) {
            await channel.send({embeds: [embed]});
        }
    } catch(e) {
        if(e !== "Skip check") {
            console.error(`There was an error while trying to check for member counts: ${e}`);
        }
    }
}