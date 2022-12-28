import Discord from 'discord.js';
import roblox = require('noblox.js');

import BotClient from '../../../utils/classes/BotClient';
import CommandHelpers from '../../../utils/classes/CommandHelpers';
import CommandFile from '../../../utils/interfaces/CommandFile';
import CommandLog from '../../../utils/interfaces/CommandLog';

import config from '../../../config';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let authorRobloxID = await client.getRobloxUser(interaction.guild.id, interaction.user.id);
        if(client.config.verificationChecks) {
            let verificationStatus = false;
            if(authorRobloxID !== 0) {
                verificationStatus = await client.preformVerificationChecks(authorRobloxID, "Ranking");
            }
            if(!verificationStatus) {
                let embed = client.embedMaker({title: "Verification Checks Failed", description: "You've failed the verification checks", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
        }
        let logs: CommandLog[] = [];
        let usernames = args["username"].replaceAll(" ", "").split(",");
        let reasonData = CommandHelpers.parseReasons(usernames, args["reason"]);
        if(reasonData.didError) {
            let embed = client.embedMaker({title: "Argument Error", description: `You inputted an unequal amount of usernames and reasons, please make sure that these amounts are equal, or, if you wish to apply one reason to multiple people, only put that reason for the reason argument`, type: "error", author: interaction.user})
            return await interaction.editReply({embeds: [embed]});
        }
        let reasons = reasonData.parsedReasons;
        let didReply = false;
        for(let i = 0; i < usernames.length; i++) {
            let username = usernames[i];
            let reason = reasons[i];
            let victimRobloxID;
            try {
                victimRobloxID = await roblox.getIdFromUsername(username);
            } catch {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "The username provided is an invalid Roblox username"
                });
                continue;
            }
            username = await roblox.getUsernameFromId(victimRobloxID);
            if(config.verificationChecks) {
                let verificationStatus = await client.preformVerificationChecks(authorRobloxID, "Ranking", victimRobloxID);
                if(!verificationStatus) {
                    logs.push({
                        username: username,
                        status: "Error",
                        message: "Verification checks have failed"
                    });
                    continue;
                }
            }
            let rankID = await roblox.getRankInGroup(client.config.groupId, victimRobloxID);
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
                let embed = client.embedMaker({title: "Role Locked", description: `The role(s) below **${username}** is locked, would you like to demote **${username}** to **${potentialRole.name}**?`, type: "info", author: interaction.user});
                let msg: Discord.Message;
                if(i === 0) {
                    msg = await interaction.editReply({embeds: [embed]}) as Discord.Message;
                } else {
                    msg = await interaction.channel.send({embeds: [embed]}) as Discord.Message;
                }
                didReply = true;
                await msg.react("✅");
                await msg.react("❌");
                let filter = (reaction: Discord.MessageReaction, user: Discord.User) => (reaction.emoji.name === "✅" || reaction.emoji.name === "❌") && user.id === interaction.user.id;
                let reaction = (await msg.awaitReactions({filter: filter, max: 1})).at(0);
                if(reaction.emoji.name === "✅") {
                    try {
                        await roblox.setRank(client.config.groupId, victimRobloxID, potentialRole.rank);
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
                await client.logAction(`<@${interaction.user.id}> has demoted **${username}** from **${oldRoleName}** to **${potentialRole.name}** for the reason of **${reason}**`);
            } else {
                try {
                    await roblox.setRank(client.config.groupId, victimRobloxID, potentialRole.rank);
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
                await client.logAction(`<@${interaction.user.id}> has demoted **${username}** from **${oldRoleName}** to **${potentialRole.name}** for the reason of **${reason}**`);
            }
            await client.initiateLogEmbedSystem(interaction, logs, didReply);
        }
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("demote")
    .setDescription("Demotes the inputted user(s)")
    .addStringOption(o => o.setName("username").setDescription("The username(s) of the user(s) you wish to demote").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("The reason(s) of the demotes(s)").setRequired(false)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Ranking",
        permissions: config.permissions.group.ranking
    }
}

export default command;