import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData, ModerationData, RobloxDatastore } from '../../../utils/classes';
import { config } from '../../../config';

import roblox = require('noblox.js');
import * as fs from 'fs/promises';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any) {
    let username = args["username"];
    let robloxID;
    try {
        robloxID = await roblox.getIdFromUsername(username);
    } catch {
        let embed = client.embedMaker("Invalid Username", "The username that you provided is invalid", "error", interaction.user);
        return await interaction.editReply(embed);
    }
    username = await roblox.getUsernameFromId(robloxID);
    let database = new RobloxDatastore(client.config.API_KEY);
    let moderationData: ModerationData | string = "";
    try {
        moderationData = await database.getModerationData(robloxID);
    } catch(e) {
        if(e.response.data.error === "NOT_FOUND") { // Meaning that if the data doesn't exist, meaning that they have a clean slate
            moderationData = {
                banData: {
                    isBanned: false,
                    reason: ""
                },
                muteData: {
                    isMuted: false,
                    reason: ""
                }
            }
        }
    }
    let isGroupBanned = false;
    let bannedUsers = JSON.parse(await fs.readFile(`${process.cwd()}/database/groupbans.json`, "utf-8"));
    let index = bannedUsers.userIDs.findIndex(v => v === robloxID);
    if(index !== -1) isGroupBanned = true;
    let embed = client.embedMaker("Information", "", "info", interaction.user, false);

    embed.addField("User Data", "```\nUsername: <username>\nRoblox ID: <id>\n```"
    .replace("<username>", username)
    .replace("<id>", robloxID))

    embed.addField("Group Data", "```\nRank Name: <rank name>\nRank ID: <rank id>\nIs User Group Banned: <ban status>\n```"
    .replace("<rank name>", await roblox.getRankNameInGroup(client.config.groupId, robloxID))
    .replace("<rank id>", (await roblox.getRankInGroup(client.config.groupId, robloxID)).toString())
    .replace("<ban status>", isGroupBanned ? "Yes" : "No"))

    embed.addField("Game Data", "```\nIs User Banned: <ban status>\nIs User Muted: <mute status>\n```"
    .replace("<ban status>", (typeof(moderationData) === "string" ? "Unable to Load" : moderationData.banData.isBanned ? `Yes\nReason: ${moderationData.banData.reason}` : "No"))
    .replace("<mute status>", (typeof(moderationData) === "string" ? "Unable to Load" : moderationData.muteData.isMuted ? `"Yes\nReason: ${moderationData.muteData.reason}"` : "No"))
    )

    return await interaction.editReply({embeds: [embed]});
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("checkuser")
    .setDescription("Gets information about the inputted user")
    .addStringOption(o => o.setName("username").setDescription("The username of the user you wish to check").setRequired(true))

export const commandData: CommandData = {
    category: "User",
    permissions: config.permissions.group.user
}