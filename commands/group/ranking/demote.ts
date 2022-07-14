import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData, CommandLog } from '../../../utils/classes';
import { config } from '../../../config';

import roblox = require('noblox.js');

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any) {
    let logs: CommandLog[] = [];
    let usernames = args["username"].replaceAll(" ", "").split(",");
    let didReply = false;
    for(let i = 0; i < usernames.length; i++) {
        let username = usernames[i];
        let robloxID;
        try {
            robloxID = await roblox.getIdFromUsername(username);
        } catch {
            logs.push({
                username: username,
                status: "Error",
                message: "The username provided is an invalid Roblox username"
            });
            continue;
        }
        username = await roblox.getUsernameFromId(robloxID);
        if(config.verificationChecks) {
            let verificationStatus = await client.preformVerificationChecks(interaction.user.id, "groupMembershipPermissions.changeRank", robloxID);
            if(!verificationStatus) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "Verification checks have failed"
                });
                continue;
            }
        }
        let rankID = await roblox.getRankInGroup(client.config.groupId, robloxID);
        if(rankID === 0) {
            logs.push({
                username: username,
                status: "Error",
                message: "The user provided is not in the group"
            });
            continue;
        }
        let roles = await roblox.getRoles(client.config.groupId);
        let currentRoleIndex = roles.findIndex(role => role.rank === rankID);
        let currentRole = roles[currentRoleIndex];
        let potentialRole = roles[currentRoleIndex - 1];
        if(potentialRole.rank === 0) {
            logs.push({
                username: username,
                status: "Error",
                message: "The user provided is at the lowest role of the group"
            });
            continue;
        }
        let oldRoleName = currentRole.name;
        if(client.isLockedRole(potentialRole)) {
            let shouldBreakAfterForLoop = false;
            for(let i = currentRoleIndex - 1; i >= 0; i--) {
                potentialRole = roles[i];
                if(potentialRole.rank === 0) {
                    logs.push({
                        username: username,
                        status: "Error",
                        message: "All the roles below the provided user are locked"
                    });
                    shouldBreakAfterForLoop = true;
                }
                if(!client.isLockedRole(potentialRole)) break;
            }
            if(shouldBreakAfterForLoop) continue; // If I call continue in the nested for loop (the one right above this line), it won't cause the main username for loop to skip over the rest of the code
            let embed = client.embedMaker("Role Locked", `The role(s) below **${username}** is locked, would you like to demote **${username}** to **${potentialRole.name}**?`, "info", interaction.user);
            client.addButton(embed, "yesButton", "Continue", "PRIMARY");
            client.addButton(embed, "noButton", "Cancel", "PRIMARY");
            let msg: Discord.Message;
            if(i === 0) {
                msg = await interaction.editReply(embed) as Discord.Message;
            } else {
                msg = await interaction.channel.send(embed) as Discord.Message;
            }
            didReply = true;
            let filter = (buttonInteraction: Discord.Interaction) => buttonInteraction.isButton() && buttonInteraction.user.id === interaction.user.id;
            let button = await msg.awaitMessageComponent({filter: filter});
            await button.reply({content: "ㅤ"});
            await button.deleteReply();
            if(button.customId === "yesButton") {
                try {
                    await roblox.setRank(client.config.groupId, robloxID, potentialRole.rank);
                } catch(e) {
                    logs.push({
                        username: username,
                        status: "Error",
                        message: e
                    });
                    continue;
                }
            } else {
                logs.push({
                    username: username,
                    status: "Cancelled",
                });
                continue;
            }
            logs.push({
                username: username,
                status: "Success"
            });
            await client.logAction(`<@${interaction.user.id}> has demoted **${await roblox.getUsernameFromId(robloxID)}** from **${oldRoleName}** to **${potentialRole.name}**`);
        } else {
            try {
                await roblox.setRank(client.config.groupId, robloxID, potentialRole.rank);
            } catch(e) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: e
                });
                continue;
            }
            logs.push({
                username: username,
                status: "Success"
            });
            await client.logAction(`<@${interaction.user.id}> has demoted **${await roblox.getUsernameFromId(robloxID)}** from **${oldRoleName}** to **${potentialRole.name}**`);
        }
    }
    await client.initiateLogEmbedSystem(interaction, logs, didReply);
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("demote")
    .setDescription("Demotes the inputted user(s)")
    .addStringOption(o => o.setName("username").setDescription("The username(s) of the user(s) you wish to demote").setRequired(true))

export const commandData: CommandData = {
    category: "Ranking",
    permissions: config.permissions.group.ranking
}