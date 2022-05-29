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
    let inputtedRank = args["rank"];
    let isRankID = Number(inputtedRank) == inputtedRank;
    try {
        if(!isRankID) { // If a rank name was inputed
            inputtedRank = roles.find(v => v.name.toLowerCase() === inputtedRank.toLowerCase()).rank; // Errors if not a group role
        } else {
            inputtedRank = Number(inputtedRank);
            let index = roles.findIndex(v => v.rank === inputtedRank);
            if(index === -1) throw("")
        }
    } catch {
        let embed = client.embedMaker("Invalid Role", "The role that you supplied is not valid", "error", interaction.user);
        return await interaction.editReply(embed);
    }
    if(config.verificationChecks) {
        let authorRobloxID = await client.getRobloxUser(interaction.user.id); // We can assume that this is valid due to the checks above passing
        let authorRank = await roblox.getRankInGroup(client.config.groupId, authorRobloxID);
        if(inputtedRank >= authorRank) {
            let embed = client.embedMaker("Verification Checks Failed", "The role that you tried to rank this user to is greater than or equal to your Roblox rank", "error", interaction.user);
            return await interaction.editReply(embed);
        }
    }
    let roleObject = await roblox.getRole(client.config.groupId, inputtedRank);
    if(client.isLockedRole(roleObject)) {
        let embed = client.embedMaker("Locked Rank", "The rank that you tried to rank this user to is currently locked, please try a different rank", "error", interaction.user);
        return await interaction.editReply(embed);
    }
    let oldRank = await roblox.getRankNameInGroup(client.config.groupId, robloxID);
    try {
        await roblox.setRank(client.config.groupId, robloxID, inputtedRank);
    } catch(e) {
        let embed = client.embedMaker("Error", `There was an error while trying to rank this user: ${e}`, "error", interaction.user);
        return await interaction.editReply(embed);
    }
    let newRank = await roblox.getRankNameInGroup(client.config.groupId, robloxID);
    let embed = client.embedMaker("Success", "You've successfully ranked this user", "success", interaction.user);
    await interaction.editReply(embed);
    if(client.config.logging.enabled) {
        await client.logAction(`<@${interaction.user.id}> has ranked **${await roblox.getUsernameFromId(robloxID)}** from **${oldRank}** to **${newRank}**`);
    }
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("setrank")
    .setDescription("Sets the rank of the inputted user to the inputted rank")
    .addStringOption(o => o.setName("username").setDescription("The username of the person you wish to rank").setRequired(true))
    .addStringOption(o => o.setName("rank").setDescription("The rank you wish to rank this user to").setRequired(true))

export const commandData: CommandData = {
    category: "Ranking",
    permissions: config.permissions.group.ranking
}