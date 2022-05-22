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
    let ranks = await roblox.getRoles(client.config.groupId);
    let lowestRank = Number.MAX_VALUE;
    for(let i = 0; i < ranks.length; i++) {
        let rankID = ranks[i].rank;
        if(lowestRank > rankID && rankID != 0) {
            lowestRank = rankID;
        }
    }
    try {
        await roblox.setRank(client.config.groupId, robloxID, lowestRank);
    } catch(e) {
        let embed = client.embedMaker("Error", `There was an error while trying to fire this user: ${e}`, "error", interaction.user);
        return await interaction.editReply(embed);
    }
    let embed = client.embedMaker("Success", "You have successfully fired this user", "success", interaction.user);
    await interaction.editReply(embed);
    if(client.config.logging.enabled) {
        return await client.logAction(`<@${interaction.user.id}> has fired **${await roblox.getUsernameFromId(robloxID)}**`);
    }
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("fire")
    .setDescription("Fires the inputted user")
    .addStringOption(o => o.setName("username").setDescription("The person that you wish to fire").setRequired(true))

export const commandData: CommandData = {
    category: "Ranking",
    permissions: config.permissions.group.ranking
}