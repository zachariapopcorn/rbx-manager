import Discord from 'discord.js';
import roblox = require('noblox.js');

import * as fs from 'fs/promises';

import BotClient from '../../../utils/classes/BotClient';
import CommandFile from '../../../utils/interfaces/CommandFile';
import ModerationData from '../../../utils/interfaces/ModerationData';
import RobloxDatastore from '../../../utils/classes/RobloxDatastore';
import CommandHelpers from '../../../utils/classes/CommandHelpers';

import config from '../../../config';

import GroupBanFile from '../../../utils/interfaces/GroupBanFile';
import SuspensionFile from '../../../utils/interfaces/SuspensionFile';
import ms = require('ms');

const database = new RobloxDatastore(config);

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let username = args["username"];
        let universeName = args["universe"];
        let universeID = CommandHelpers.getUniverseIDFromName(universeName);
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
            moderationData = await database.getModerationData(universeID, robloxID);
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
        let bannedUsers = JSON.parse(await fs.readFile(`${process.cwd()}/database/groupbans.json`, "utf-8")) as GroupBanFile;
        let suspendedUsers = JSON.parse(await fs.readFile(`${process.cwd()}/database/suspensions.json`, "utf-8")) as SuspensionFile;
        let bannedIndex = bannedUsers.userIDs.findIndex(v => v === robloxID);
        let isGroupBanned = (bannedIndex !== -1);
        let suspendedIndex = suspendedUsers.users.findIndex(v => v.userId === robloxID);
        let isSuspended = (suspendedIndex !== -1);
        let extraGroupData = "Is User Suspended: No";
        if(isSuspended) {
            let oldRole = (await roblox.getRoles(client.config.groupId)).find(v => v.id === suspendedUsers.users[suspendedIndex].oldRoleID).name;
            let time = suspendedUsers.users[suspendedIndex].timeToRelease - Date.now() as any;
            if(time <= 0) {
                time = "Officially, this user is not suspended anymore, the next suspension check will delete their record from the DB"
            } else {
                time = ms(time, {long: true})
            }
            extraGroupData = `Is User Suspended: Yes\nSuspension Reason: ${suspendedUsers.users[suspendedIndex].reason}\nSuspended From: ${oldRole}\nSuspended For: ${time}`;
        }
        let embed = client.embedMaker({title: "Information", description: "", type: "info", author: interaction.user});
        embed.addFields({
            name: "User Data",
            value: "```\nUsername: <username>\nRoblox ID: <id>\n```"
            .replace("<username>", username)
            .replace("<id>", robloxID)
        },
        {
            name: "Group Data",
            value: "```\nRank Name: <rank name>\nRank ID: <rank id>\nIs User Group Banned: <ban status>\n\n<extra>```"
            .replace("<rank name>", await roblox.getRankNameInGroup(client.config.groupId, robloxID))
            .replace("<rank id>", (await roblox.getRankInGroup(client.config.groupId, robloxID)).toString())
            .replace("<ban status>", isGroupBanned ? "Yes" : "No")
            .replace("<extra>", extraGroupData)
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
    .addStringOption(o => o.setName("universe").setDescription("The universe to check the user's moderation status on").setRequired(true).addChoices(...CommandHelpers.parseUniverses() as any))
    .addStringOption(o => o.setName("username").setDescription("The username of the user you wish to check").setRequired(true)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "User",
        permissions: config.permissions.group.user
    }
}

export default command;