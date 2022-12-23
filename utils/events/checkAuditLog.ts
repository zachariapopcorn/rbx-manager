import Discord from 'discord.js';
import roblox = require('noblox.js');
import BotClient from '../classes/BotClient';

let oldAuditLogDate;

export default async function checkAudits(client: BotClient) {
    let currentUser = await roblox.getCurrentUser();
    let groupID = client.config.groupId;
    try {
        let auditLog = await roblox.getAuditLog(groupID, "", undefined, "Asc", 100);
        if(!oldAuditLogDate) oldAuditLogDate = auditLog.data[0].created;
        let index = auditLog.data.findIndex(log => log.created === oldAuditLogDate);
        if(index === 0 || index === -1) throw("Skip check");
        for(let i = index - 1; i >= 0; i--) {
            let log = auditLog.data[i];
            if(log.actor.user.userId === currentUser.UserID) continue;
            if(log.actionType === "Post Status" && client.config.logging.shout.enabled) {
                let channel = await client.channels.fetch(client.config.logging.shout.loggingChannel) as Discord.TextChannel;
                if(channel) {
                    let embedDescription = "";
                    embedDescription += `**Shout Poster**: ${log.actor.user.username}\n`;
                    embedDescription += `**Role**: ${log.actor.role.name}\n`;
                    embedDescription += `**Shout Content**: ${log.description["Text"]}\n`;
                    embedDescription += `**Time of Shout**: ${log.created}\n`;
                    let embed = client.embedMaker({title: "New Shout Detected", description: embedDescription, type: "info", author: client.user});
                    await channel.send({embeds: [embed]});
                }
            } else if(log.actionType === "Change Rank" && client.config.logging.audit.enabled) {
                let channel = await client.channels.fetch(client.config.logging.audit.loggingChannel) as Discord.TextChannel;
                if(channel) {
                    let embedDescription = "";
                    embedDescription += `**Ranker**: ${log.actor.user.username}\n`;
                    embedDescription += `**Role**: ${log.actor.role.name}\n`;
                    embedDescription += `**Target**: ${log.description["TargetName"]}\n`;
                    embedDescription += `**Rank Change**: ${log.description["OldRoleSetName"]} -> ${log.description["NewRoleSetName"]}\n`;
                    embedDescription += `**Time of Ranking**: ${log.created}\n`;
                    let embed = client.embedMaker({title: "New Action Detected", description: embedDescription, type: "info", author: client.user});
                    await channel.send({embeds: [embed]});
                }
            } else if(client.config.logging.audit.enabled) {
                let channel = await client.channels.fetch(client.config.logging.audit.loggingChannel) as Discord.TextChannel;
                if(channel) {
                    let embedDescription = "";
                    embedDescription += `**Author**: ${log.actor.user.username}\n`;
                    embedDescription += `**Role**: ${log.actor.role.name}\n`;
                    embedDescription += `**Action Type**: ${log.actionType}\n`;
                    embedDescription += `**Time of Action**: ${log.created}\n`;
                    let embed = client.embedMaker({title: "New Action Detected", description: embedDescription, type: "info", author: client.user});
                    await channel.send({embeds: [embed]});
                }
            }
        }
    } catch(e) {
        if(e !== "Skip check") {
            console.error(`There was an error while trying to check the audit logs: ${e}`);
        }
    }
    setTimeout(async() => {
        await checkAudits(client);
    }, 15000);
}