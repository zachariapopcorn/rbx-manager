import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData, CommandLog } from '../../../utils/classes';
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
    let logs: CommandLog[] = [];
    let usernames = args["username"].replaceAll(" ", "").split(",");
    for(let i = 0; i < usernames.length; i++) {
        let username = usernames[i];
        let robloxID;
        try {
            robloxID = await roblox.getIdFromUsername(username);
        } catch {
            logs.push({
                username: username,
                status: "Error",
                message: "The username provided is an invalid Roblox username"
            });
            continue;
        }
        username = await roblox.getUsernameFromId(robloxID);
        try {
            await roblox.handleJoinRequest(client.config.groupId, robloxID, false);
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
        await client.logAction(`<@${interaction.user.id}> has denined the join request of **${username}**`);
        continue;
    }
    await client.initiateLogEmbedSystem(interaction, logs);
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("deny-join-request")
    .setDescription("Denies the join request of the user(s) inputted")
    .addStringOption(o => o.setName("username").setDescription("The username(s) of the user(s) you wish to deny the join request of").setRequired(true))

export const commandData: CommandData = {
    category: "Join Request",
    permissions: config.permissions.group.joinrequests
}