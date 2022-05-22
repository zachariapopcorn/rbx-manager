import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

import roblox = require('noblox.js');
import * as fs from 'fs/promises';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    let robloxID;
    try {
        robloxID = await roblox.getIdFromUsername(args["username"]);
    } catch {
        let embed = client.embedMaker("Invalid Username", "The username that you provided is invalid", "error", interaction.user);
        return await interaction.editReply(embed);
    }
    if(config.verificationChecks) {
        let verificationStatus = await client.preformVerificationChecks(interaction.user.id, "groupMembershipPermissions.removeMembers", robloxID);
        if(!verificationStatus) {
            let embed = client.embedMaker("Verification Checks Failed", "You've failed the verification checks", "error", interaction.user);
            return await interaction.editReply(embed);
        }
    }
    let rankID = await roblox.getRankInGroup(config.groupId, robloxID);
    if(rankID !== 0) {
        try {
            await roblox.exile(config.groupId, robloxID);
        } catch(e) {
            let embed = client.embedMaker("Error", `There was an error while trying to kick this user from the group: ${e}`, "error", interaction.user);
            await interaction.editReply(embed);
        }
    }
    let bannedUsers = JSON.parse(await fs.readFile(`${process.cwd()}/database/groupbans.json`, "utf-8"));
    bannedUsers.userIDs.push(robloxID);
    await fs.writeFile(`${process.cwd()}/database/groupbans.json`, JSON.stringify(bannedUsers));
    let embed = client.embedMaker("Success", "You've successfully banned this user from the group", "success", interaction.user);
    await interaction.editReply(embed);
    if(config.logging.enabled) {
        return await client.logAction(`<@${interaction.user.id}> has banned **${await roblox.getUsernameFromId(robloxID)}** from the group`);
    }
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("groupban")
    .setDescription("Bans the supplied user from the group")
    .addStringOption(o => o.setName("username").setDescription("The username of the user you wish to ban from the group").setRequired(true));

export const commandData: CommandData = {
    category: "User",
    permissions: config.permissions.group.user
}