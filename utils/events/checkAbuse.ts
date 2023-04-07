import Discord from 'discord.js';
import roblox = require('noblox.js');
import BotClient from '../classes/BotClient';

export default async function checkAbuse(client: BotClient) {
    for(let i = client.groupLogs.length - 1; i >= 0; i--) {
        if(client.groupLogs[i].cooldownExpires >= Date.now()) {
            client.commandCooldowns.splice(i, 1);
        } else {
            let rankIndex = client.groupLogs.findIndex(v => v.userID === client.groupLogs[i].userID && v.action === "Rank");
            let exileIndex = client.groupLogs.findIndex(v => v.userID === client.groupLogs[i].userID && v.action === "Exile");
            if(rankIndex != -1) {
                let amount = client.groupLogs[rankIndex].amount;
                if(amount > client.config.antiAbuse.thresholds.ranks) {
                    let didError = false;
                    try {
                        if(client.config.antiAbuse.actions.ranks === "Suspend") {
                            await roblox.setRank(client.config.groupId, client.groupLogs[i].userID, client.config.suspensionRank);
                        } else {
                            await roblox.exile(client.config.groupId, client.groupLogs[i].userID);
                        }
                    } catch(e) {
                        didError = true;
                        console.log(e);
                    }
                    let channel = await client.channels.fetch(client.config.logging.antiAbuse.loggingChannel) as Discord.TextChannel;
                    if(channel) {
                        let description = `A rank abuser, **${await roblox.getUsernameFromId(client.groupLogs[i].userID)}**, has been detected abusing rank changing privileges`;
                        if(didError) {
                            description += "\n\n**THE AUTOMATIC ACTION CONFIGURED FAILED TO PUNISH THE USER**"
                        }
                        let embed = client.embedMaker({title: "Rank Abuser Detected", description: description, type: "info", author: client.user});
                        await channel.send({embeds: [embed]});
                    }
                }
            }
            if(exileIndex != -1) {
                let amount = client.groupLogs[exileIndex].amount;
                if(amount > client.config.antiAbuse.thresholds.exiles) {
                    let didError = false;
                    try {
                        if(client.config.antiAbuse.actions.exiles === "Suspend") {
                            await roblox.setRank(client.config.groupId, client.groupLogs[i].userID, client.config.suspensionRank);
                        } else {
                            await roblox.exile(client.config.groupId, client.groupLogs[i].userID);
                        }
                    } catch(e) {
                        didError = true;
                        console.log(e);
                    }
                    let channel = await client.channels.fetch(client.config.logging.antiAbuse.loggingChannel) as Discord.TextChannel;
                    if(channel) {
                        let description = `An exile abuser, **${await roblox.getUsernameFromId(client.groupLogs[i].userID)}**, has been detected abusing exile privileges`;
                        if(didError) {
                            description += "\n\n**THE AUTOMATIC ACTION CONFIGURED FAILED TO PUNISH THE USER**"
                        }
                        let embed = client.embedMaker({title: "Exile Abuser Detected", description: description, type: "info", author: client.user});
                        await channel.send({embeds: [embed]});
                    }
                }
            }
        }
    }
    setTimeout(async() => {
        await checkAbuse(client);
    }, 5);
}