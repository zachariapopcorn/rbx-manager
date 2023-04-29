import Discord from 'discord.js';
import roblox = require('noblox.js');
import BotClient from '../classes/BotClient';
import SuspensionFile from '../interfaces/SuspensionFile';
import fs from "fs/promises"

let oldDate;

export default async function checkAudits(groupID: number, client: BotClient) {
    if(!client.isLoggedIn) return;
    let currentUser = await roblox.getCurrentUser();
    try {
        let auditLog = await roblox.getAuditLog(groupID, "", undefined, "Asc", 100);
        if(!oldDate) oldDate = auditLog.data[0].created;
        let index = auditLog.data.findIndex(log => log.created.toISOString() === oldDate.toISOString());
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
            } else if(log.actionType === "Change Rank") {
                let isUserSuspended = false;
                let suspensions = (JSON.parse(await fs.readFile(`${process.cwd()}/database/suspensions.json`, "utf-8")) as SuspensionFile).users;
                let susIndex = suspensions.findIndex(v => v.userId === log.description["TargetId"]);
                if(susIndex !== -1) isUserSuspended = true;
                let isLockedRank = client.isLockedRole((await roblox.getRoles(groupID)).find(v => v.name === log.description["NewRoleSetName"]));
                if(isUserSuspended && await roblox.getRankInGroup(groupID, log.description["TargetId"]) != client.config.suspensionRank) {
                    try {
                        await roblox.setRank(groupID, log.description["TargetId"], client.config.suspensionRank);
                    } catch(e) {
                        console.error(`There was an error re-ranking ${log.description["TargetName"]} to the suspended role: ${e}`);
                    }
                } else if(isLockedRank) {
                    try {
                        await roblox.setRank(groupID, log.description["TargetId"], log.description["OldRoleSetId"]);
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
            if(log.actionType === "Change Rank") {
                let antiAAIndex = client.groupLogs.findIndex(v => v.userID === log.actor.user.userId && v.action === "Rank");
                if(antiAAIndex === -1) {
                    client.groupLogs.push({groupID: groupID, userID: log.actor.user.userId, cooldownExpires: Date.now() + 60000, action: "Rank", amount: 1});
                } else {
                    client.groupLogs[antiAAIndex].amount += 1;
                }
            } else if(log.actionType === "Remove Member") {
                let antiAAIndex = client.groupLogs.findIndex(v => v.userID === log.actor.user.userId && v.action === "Exile");
                if(antiAAIndex === -1) {
                    client.groupLogs.push({groupID: groupID, userID: log.actor.user.userId, cooldownExpires: Date.now() + 60000, action: "Exile", amount: 1});
                } else {
                    client.groupLogs[antiAAIndex].amount += 1;
                }
            }
        }
        oldDate = auditLog.data[0].created;
    } catch(e) {
        if(e !== "Skip check") {
            console.error(`There was an error while trying to check the audit logs: ${e}`);
        }
    }
    setTimeout(async() => {
        await checkAudits(groupID, client);
    }, 5000);
}