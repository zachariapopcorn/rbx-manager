import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData, CommandLog } from '../../../utils/classes';
import { config } from '../../../config';

import roblox = require('noblox.js');
import * as fs from 'fs/promises';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any) {
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
        if(config.verificationChecks) {
            let verificationStatus = await client.preformVerificationChecks(interaction.user.id, "groupMembershipPermissions.removeMembers", robloxID);
            if(!verificationStatus) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "Verification checks have failed"
                });
                continue;
            }
        }
        let rankID = await roblox.getRankInGroup(config.groupId, robloxID);
        if(rankID !== 0) {
            try {
                await roblox.exile(config.groupId, robloxID);
            } catch(e) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: `There was an error while trying to exile this user from the group: ${e}`
                });
                continue;
            }
        }
        let bannedUsers = JSON.parse(await fs.readFile(`${process.cwd()}/database/groupbans.json`, "utf-8"));
        let index = bannedUsers.userIDs.findIndex(v => v === robloxID);
        if(index !== -1) {
            logs.push({
                username: username,
                status: "Error",
                message: "The user provided is already banned from the group"
            });
            continue;
        }
        bannedUsers.userIDs.push(robloxID);
        await fs.writeFile(`${process.cwd()}/database/groupbans.json`, JSON.stringify(bannedUsers));
        logs.push({
            username: username,
            status: "Success"
        });
        if(config.logging.enabled) {
            await client.logAction(`<@${interaction.user.id}> has banned **${username}** from the group`);
        }
    }
    await client.initiateLogEmbedSystem(interaction, logs);
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("groupban")
    .setDescription("Bans the supplied user(s) from the group")
    .addStringOption(o => o.setName("username").setDescription("The username(s) of the user(s) you wish to ban from the group").setRequired(true));

export const commandData: CommandData = {
    category: "User",
    permissions: config.permissions.group.user
}