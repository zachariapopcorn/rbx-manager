import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

import roblox = require('noblox.js');

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    if(client.config.verificationChecks) {
        let verificationStatus = await client.preformGeneralVerificationCheck(interaction.user.id);
        if(!verificationStatus.passedVerificationChecks) {
            let embed = client.embedMaker("Verification Checks Failed", "You've failed the general verification checks, meaning that you either aren't verified with Rover, or that your verified account is not in the gorup, meaning that you can't execute this command", "error", interaction.user);
            return await interaction.editReply(embed);
        }
        let groupRole = await roblox.getRole(client.config.groupId, verificationStatus.memberRole);
        let rolePermissions = (await roblox.getRolePermissions(client.config.groupId, groupRole.id)).permissions;
        if(!rolePermissions.groupPostsPermissions.postToStatus) {
            let embed = client.embedMaker("Verification Check Failed", "Although you've passed the general verification checks, your group role doesn't have the permission to shout to the group, meaing that you can't execute this command", "error", interaction.user);
            return await interaction.editReply(embed);
        }
    }
    try {
        await roblox.shout(client.config.groupId, args["message"]);
    } catch(e) {
        let embed = client.embedMaker("Error", `There was an error while trying to shout the inputted message to the group: ${e}`, "error", interaction.user);
        return await interaction.editReply(embed);
    }
    let embed = client.embedMaker("Success", "You've successfully shouted the inputted message to the group shout", "success", interaction.user);
    await interaction.editReply(embed);
    if(client.config.logging.enabled) {
        return await client.logAction(`<@${interaction.user.id}> has shouted "**${args["message"]}**" to the group`);
    }
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("shout")
    .setDescription("Shouts a message to the group")
    .addStringOption(o => o.setName("message").setDescription("The message that you wish to shout to the group").setRequired(true))

export const commandData: CommandData = {
    category: "Shout",
    permissions: config.permissions.group.shout
}