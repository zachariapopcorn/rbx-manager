import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

import roblox = require('noblox.js')
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
    let bannedUsers = JSON.parse(await fs.readFile(`${process.cwd()}/database/groupbans.json`, "utf-8"));
    let index = bannedUsers.userIDs.findIndex(v => v === robloxID);
    if(index === -1) {
        let embed = client.embedMaker("Not Banned", "The user that you supplied is currently not banned from the group", "info", interaction.user);
        return await interaction.editReply(embed);
    }
    bannedUsers.userIDs.splice(index, 1);
    await fs.writeFile(`${process.cwd()}/database/groupbans.json`, JSON.stringify(bannedUsers));
    let embed = client.embedMaker("Success", "You've successfully unbanned this user from the group", "success", interaction.user);
    await interaction.editReply(embed);
    if(config.logging.enabled) {
        return await client.logAction(`<@${interaction.user.id}> has unbanned **${await roblox.getUsernameFromId(robloxID)}** from the group`);
    }
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("ungroupban")
    .setDescription("Unbans the user inputted from the group")
    .addStringOption(o => o.setName("username").setDescription("The username of the user you wish to unban from the group").setRequired(true))

export const commandData: CommandData = {
    category: "User",
    permissions: config.permissions.group.user
}