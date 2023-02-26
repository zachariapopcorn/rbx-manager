import Discord from 'discord.js';
import roblox = require('noblox.js');
import BotClient from '../classes/BotClient';
import SuspensionFile from '../interfaces/SuspensionFile';
import fs from "fs/promises"

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
                let isUserSuspended = false;
                let suspensions = (JSON.parse(await fs.readFile(`${process.cwd()}/database/suspensions.json`, "utf-8")) as SuspensionFile).users;
                let susIndex = suspensions.findIndex(v => v.userId === log.description["TargetId"]);
                if(susIndex === -1) isUserSuspended = true;
                let isLockedRank = client.isLockedRole((await roblox.getRoles(client.config.groupId)).find(v => v.name === log.description["NewRoleSetName"]));
                if(isUserSuspended && await roblox.getRankInGroup(client.config.groupId, log.description["TargetId"]) != client.config.suspensionRank) {
                    try {
                        await roblox.setRank(client.config.groupId, log.description["TargetId"], client.config.suspensionRank);
                    } catch(e) {
                        console.error(`There was an error re-ranking ${log.description["TargetName"]} to the suspended role: ${e}`);
                    }
                } else if(isLockedRank) {
                    try {
                        await roblox.setRank(client.config.groupId, log.description["TargetId"], log.description["OldRoleSetId"]);
                    } catch(e) {
                        console.error(`There was an error re-ranking ${log.description["TargetName"]} to their old role: ${e}`);
                    }
                }
                if(client.config.logging.audit.enabled) {
                    let channel = await client.channels.fetch(client.config.logging.audit.loggingChannel) as Discord.TextChannel;
                    if(channel) {
                        let embedDescription = "";
                        embedDescription += `**Ranker**: ${log.actor.user.username}\n`;
                        embedDescription += `**Role**: ${log.actor.role.name}\n`;
                        embedDescription += `**Target**: ${log.description["TargetName"]}\n`;
                        embedDescription += `**Rank Change**: ${log.description["OldRoleSetName"]} -> ${log.description["NewRoleSetName"]}\n`;
                        embedDescription += `**Time of Ranking**: ${log.created}\n`;
                        if(isUserSuspended) {
                            embedDescription += "\n\n**This action has been reversed because this user is currently suspended**";
                        } else if(isLockedRank) {
                            embedDescription += "\n\n**This action has been reversed because this user was ranked to a configured locked rank**"
                        }
                        let embed = client.embedMaker({title: "New Action Detected", description: embedDescription, type: "info", author: client.user});
                        await channel.send({embeds: [embed]});
                    }
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
        oldAuditLogDate = auditLog.data[0].created;
    } catch(e) {
        if(e !== "Skip check") {
            console.error(`There was an error while trying to check the audit logs: ${e}`);
        }
    }
    setTimeout(async() => {
        await checkAudits(client);
    }, 15000);
}