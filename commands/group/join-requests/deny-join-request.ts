import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

import roblox = require('noblox.js');

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any) {
    if(client.config.verificationChecks) {
        let verificationStatus = await client.preformGeneralVerificationCheck(interaction.user.id);
        if(!verificationStatus.passedVerificationChecks) {
            let embed = client.embedMaker("Verification Checks Failed", "You've failed the general verification checks, meaning that you either aren't verified with Rover, or that your verified account is not in the gorup, meaning that you can't execute this command", "error", interaction.user);
            return await interaction.editReply(embed);
        }
        let groupRole = await roblox.getRole(client.config.groupId, verificationStatus.memberRole);
        let rolePermissions = (await roblox.getRolePermissions(client.config.groupId, groupRole.id)).permissions;
        if(!rolePermissions.groupMembershipPermissions.inviteMembers) {
            let embed = client.embedMaker("Verification Check Failed", "Although you've passed the general verification checks, your group role doesn't have the permission to maange join requests, meaing that you can't execute this command", "error", interaction.user);
            return await interaction.editReply(embed);
        }
    }
    let robloxID;
    try {
        robloxID = await roblox.getIdFromUsername(args["username"]);
    } catch {
        let embed = client.embedMaker("Invalid Username", "The username that you provided is invalid", "error", interaction.user);
        return await interaction.editReply(embed);
    }
    try {
        await roblox.handleJoinRequest(client.config.groupId, robloxID, false)
    } catch(e) {
        let embed = client.embedMaker("Error", `There was an error while trying to deny this user's join request: ${e}`, "error", interaction.user);
        return await interaction.editReply(embed);
    }
    let embed = client.embedMaker("Success", "You've successfully denined this user's join request", "success", interaction.user);
    await interaction.editReply(embed);
    if(config.logging.enabled) {
        return await client.logAction(`<@${interaction.user.id}> has denined the join request of **${await roblox.getUsernameFromId(robloxID)}**`);
    }
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("deny-join-request")
    .setDescription("Denies the join request of the user inputted")
    .addStringOption(o => o.setName("username").setDescription("The username of the user you wish to deny the join request of").setRequired(true))

export const commandData: CommandData = {
    category: "Join Request",
    permissions: config.permissions.group.joinrequests
}