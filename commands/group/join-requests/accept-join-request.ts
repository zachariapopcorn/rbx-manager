import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

import roblox = require('noblox.js');

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any) {
    if(client.config.verificationChecks) {
        let verificationStatus = await client.preformVerificationChecks(interaction.user.id, "groupMembershipPermissions.inviteMembers");
        if(!verificationStatus) {
            let embed = client.embedMaker("Verification Checks Failed", "You've failed the verification checks", "error", interaction.user);
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
        await roblox.handleJoinRequest(client.config.groupId, robloxID, true)
    } catch(e) {
        let embed = client.embedMaker("Error", `There was an error while trying to accept this user's join request: ${e}`, "error", interaction.user);
        return await interaction.editReply(embed);
    }
    let embed = client.embedMaker("Success", "You've successfully accepted this user's join request", "success", interaction.user);
    await interaction.editReply(embed);
    if(config.logging.enabled) {
        return await client.logAction(`<@${interaction.user.id}> has accepted the join request of **${await roblox.getUsernameFromId(robloxID)}**`);
    }
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("accept-join-request")
    .setDescription("Accepts the join request of the user inputted")
    .addStringOption(o => o.setName("username").setDescription("The username of the user you wish to accept the join request of").setRequired(true));

export const commandData: CommandData = {
    category: "Join Request",
    permissions: config.permissions.group.joinrequests
}