import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

import roblox = require('noblox.js');

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    let robloxID;
    try {
        robloxID = await roblox.getIdFromUsername(args["username"]);
    } catch {
        let embed = client.embedMaker("Invalid Username", "The username that you provided is invalid", "error", interaction.user);
        return await interaction.editReply(embed);
    }
    if(config.verificationChecks) {
        let verificationStatus = await client.preformVerificationChecks(interaction.user.id, "groupMembershipPermissions.changeRank", robloxID);
        if(!verificationStatus) {
            let embed = client.embedMaker("Verification Checks Failed", "You've failed the verification checks", "error", interaction.user);
            return await interaction.editReply(embed);
        }
    }
    let rankID = await roblox.getRankInGroup(client.config.groupId, robloxID);
    if(rankID === 0) {
        let embed = client.embedMaker("Invalid User", "The user that you supplied isn't in the group", "error", interaction.user);
        return await interaction.editReply(embed);
    }
    let roles = await roblox.getRoles(client.config.groupId);
    let currentRoleIndex = roles.findIndex(role => role.rank === rankID);
    let currentRole = roles[currentRoleIndex];
    let potentialRole = roles[currentRoleIndex + 1];
    let oldRoleName = currentRole.name;
    if(client.isLockedRole(potentialRole)) {
        for(let i = currentRoleIndex + 1; i < roles.length; i++) {
            potentialRole = roles[i];
            if(!client.isLockedRole(potentialRole)) break;
        }
        let embed = client.embedMaker("Role Locked", `The role(s) above this user is locked, would you like to promote this user to **${potentialRole.name}**?`, "info", interaction.user);
        client.addButton(embed, "yesButton", "Continue", "PRIMARY");
        client.addButton(embed, "noButton", "Cancel", "PRIMARY");
        let msg = await interaction.editReply(embed) as Discord.Message;
        let filter = (filterInteraction: Discord.Interaction) => {
            if(!filterInteraction.isButton()) return false;
            if(filterInteraction.user.id !== interaction.user.id) return false;
            return true;
        }
        let componentCollector = msg.createMessageComponentCollector({filter: filter, max: 1});
        componentCollector.on('end', async(collectedButtons) => {
            let button = [...collectedButtons.values()][0];
            let didCancelOrError = false;
            if(button.customId === "yesButton") {
                try {
                    await roblox.setRank(client.config.groupId, robloxID, potentialRole.rank);
                } catch(e) {
                    let embed = client.embedMaker("Error", `There was an error while trying to promote this user`, "error", interaction.user);
                    await msg.edit(embed);
                }
            } else {
                let embed = client.embedMaker("Cancelled", `You've successfully cancelled this action`, "info", interaction.user);
                await msg.edit(embed);
                didCancelOrError = true;
            }
            await button.reply({content: "ㅤ"});
            await button.deleteReply();
            if(!didCancelOrError) {
                let embed = client.embedMaker("Success", `You have successfully promoted this user`, "success", interaction.user);
                await msg.edit(embed);
                if(config.logging.enabled) {
                    await client.logAction(`<@${interaction.user.id}> has promoted **${await roblox.getUsernameFromId(robloxID)}** from **${oldRoleName}** to **${potentialRole.name}**`);
                }
            }
        });
    } else {
        try {
            await roblox.setRank(client.config.groupId, robloxID, potentialRole.rank);
        } catch(e) {
            let embed = client.embedMaker("Error", `There was an error while trying to promote this user: ${e}`, "error", interaction.user);
            return await interaction.editReply(embed);
        }
        let embed = client.embedMaker("Success", `You have successfully promoted this user`, "success", interaction.user);
        await interaction.editReply(embed);
        if(config.logging.enabled) {
            await client.logAction(`<@${interaction.user.id}> has promoted **${await roblox.getUsernameFromId(robloxID)}** from **${oldRoleName}** to **${potentialRole.name}**`);
        }
    }
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("promote")
    .setDescription("Promotes the inputed user")
    .addStringOption(o => o.setName("username").setDescription("The username of the person that you wish to promote").setRequired(true))

export const commandData: CommandData = {
    category: "Ranking",
    permissions: config.permissions.group.ranking
}