import Discord from 'discord.js';
import roblox = require('noblox.js');

import * as fs from 'fs/promises';

import BotClient from '../../../utils/classes/BotClient';
import CommandFile from '../../../utils/interfaces/CommandFile';
import ModerationData from '../../../utils/interfaces/ModerationData';
import RobloxDatastore from '../../../utils/classes/RobloxDatastore';

import config from '../../../config';

const database = new RobloxDatastore(config);

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let username = args["username"];
        let robloxID;
        try {
            robloxID = await roblox.getIdFromUsername(username);
        } catch {
            let embed = client.embedMaker({title: "Invalid Username", description: `The username that you provided is invalid`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        username = await roblox.getUsernameFromId(robloxID);
        let moderationData: ModerationData | string = "";
        try {
            moderationData = await database.getModerationData(robloxID);
        } catch(e) {
            if(e.response.data.error === "NOT_FOUND") { // Meaning that the data doesn't exist, meaning that they have a clean slate
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
        let embed = client.embedMaker({title: "Information", description: "", type: "info", author: interaction.user});
        embed.addFields({
            name: "User Data",
            value: "```\nUsername: <username>\nRoblox ID: <id>\n```"
            .replace("<username>", username)
            .replace("<id>", robloxID)
        },
        {
            name: "Group Data",
            value: "```\nRank Name: <rank name>\nRank ID: <rank id>\nIs User Group Banned: <ban status>\n```"
            .replace("<rank name>", await roblox.getRankNameInGroup(client.config.groupId, robloxID))
            .replace("<rank id>", (await roblox.getRankInGroup(client.config.groupId, robloxID)).toString())
            .replace("<ban status>", isGroupBanned ? "Yes" : "No")
        }, {
            name: "Game Data",
            value: "```\nIs User Banned: <ban status>\nIs User Muted: <mute status>\n```"
            .replace("<ban status>", (typeof(moderationData) === "string" ? "Unable to Load" : moderationData.banData.isBanned ? `Yes\nBan Reason: ${moderationData.banData.reason}` : "No"))
            .replace("<mute status>", (typeof(moderationData) === "string" ? "Unable to Load" : moderationData.muteData.isMuted ? `Yes\nMute Reason: ${moderationData.muteData.reason}` : "No"))
        });
        return await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("checkuser")
    .setDescription("Gets information about the inputted user")
    .addStringOption(o => o.setName("username").setDescription("The username of the user you wish to check").setRequired(true)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "User",
        permissions: config.permissions.group.user
    }
}

export default command;