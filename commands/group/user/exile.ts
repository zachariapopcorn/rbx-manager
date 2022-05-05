import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

import roblox = require('noblox.js')

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    let robloxID;
    try {
        robloxID = await roblox.getIdFromUsername(args["username"]);
    } catch {
        let embed = client.embedMaker("Invalid Username", "The username that you provided is invalid", "error", interaction.user);
        return await interaction.editReply(embed);
    }
    if(client.config.verificationChecks) {
        let verificationStatus = await client.preformVerificationChecks(interaction.user.id, "groupMembershipPermissions.removeMembers", robloxID);
        if(!verificationStatus) {
            let embed = client.embedMaker("Verification Checks Failed", "You've failed the verification checks", "error", interaction.user);
            return await interaction.editReply(embed);
        }
    }
    try {
        await roblox.exile(config.groupId, robloxID);
    } catch(e) {
        let embed = client.embedMaker("Error", `There was an error while trying to kick this user from the group: ${e}`, "error", interaction.user);
        return await interaction.editReply(embed);
    }
    let embed = client.embedMaker("Success", "You've successfully exiled this user", "success", interaction.user);
    await interaction.editReply(embed);
    if(config.logging.enabled) {
        return await client.logAction(`<@${interaction.user.id}> has exiled **${await roblox.getUsernameFromId(robloxID)}** from the group`);
    }
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("exile")
    .setDescription("Kicks the inputted user from the group")
    .addStringOption(o => o.setName("username").setDescription("The username of the user you wish to exile").setRequired(true))

export const commandData: CommandData = {
    category: "User",
    permissions: config.permissions.group.user
}