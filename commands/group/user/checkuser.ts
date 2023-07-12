import Discord from 'discord.js';
import roblox = require('noblox.js');
import ms = require('ms');

import fs from "fs/promises"

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import RobloxDatastore from '../../../utils/classes/RobloxDatastore';
import GroupHandler from '../../../utils/classes/GroupHandler';
import UniverseHandler from '../../../utils/classes/UniverseHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';
import ModerationData from '../../../utils/interfaces/ModerationData';
import GroupBanEntry from '../../../utils/interfaces/GroupBanEntry';
import SuspensionEntry from '../../../utils/interfaces/SuspensionEntry';

const database = new RobloxDatastore(config);

function formatWarnDate(date: Date): string {
    let hour = date.getHours();
    let isAM = false;
    if(hour === 0) {
        hour = 12;
        isAM = true;
    } else if(hour === 12) {
        isAM = false;
    } else {
        if(hour < 12) {
            isAM = true;
        } else {
            hour -= 12;
        }
    }
    let mins = `${date.getMinutes()}`;
    if(mins.length === 1) mins = `0${mins}`;
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} - ${hour}:${mins} ${isAM ? "AM" : "PM"}`;
}

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let username = args["username"];
        let robloxID = await roblox.getIdFromUsername(username) as number;
        if(!robloxID) {
            let embed = client.embedMaker({title: "Invalid Username", description: "The username provided is an invalid Roblox username", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        username = await roblox.getUsernameFromId(robloxID);
        let groupDataValue;
        let gameDataValue;
        if(client.config.universes.length !== 0) {
            let universeName = args["universe"];
            let universeID = UniverseHandler.getIDFromName(universeName);
            let moderationData: ModerationData | string = "";
            try {
                moderationData = await database.getModerationData(universeID, robloxID);
            } catch(e) {
                if((e.toString() as string).indexOf("NOT_FOUND") !== -1) {
                    moderationData = {
                        banData: {
                            isBanned: false,
                            reason: ""
                        },
                        muteData: {
                            isMuted: false,
                            reason: ""
                        },
                        warns: []
                    }
                }
            }
            let warnsString = "There were len warnings found for this user\n\n";
            if(typeof(moderationData) !== "string") {
                if(moderationData.warns) {
                    if(moderationData.warns.length === 0) {
                        warnsString = "No warnings present";
                    } else {
                        for(let i = 0; i < moderationData.warns.length; i++) {
                            warnsString += `Author: ${moderationData.warns[i].author} | Reason: ${moderationData.warns[i].reason} | Date Assigned: ${formatWarnDate(new Date(moderationData.warns[i].dateAssigned))}\n`;
                        }
                        warnsString = warnsString.replace("len", moderationData.warns.length.toString());
                    }
                }
            }
            gameDataValue = "```\nIs User Banned: <ban status>\nIs User Muted: <mute status>\nWarnings: <warnings>```"
            .replace("<ban status>", (typeof(moderationData) === "string" ? "Unable to Load" : moderationData.banData.isBanned ? `Yes\nBan Reason: ${moderationData.banData.reason}` : "No"))
            .replace("<mute status>", (typeof(moderationData) === "string" ? "Unable to Load" : moderationData.muteData.isMuted ? `Yes\nMute Reason: ${moderationData.muteData.reason}` : "No"))
            gameDataValue = gameDataValue.replace("<warnings>", (typeof(moderationData) === "string" ? "Unable to Load" : moderationData.warns ? moderationData.warns.length === 0 ? "No warnings present" : warnsString : "No warnings present"))
        }
        if(client.config.groupIds.length !== 0) {
            let groupID = GroupHandler.getIDFromName(args["group"]);
            let bannedUsers = JSON.parse(await fs.readFile(`${process.cwd()}/database/groupbans.json`, "utf-8")) as GroupBanEntry[];
            let suspendedUsers = JSON.parse(await fs.readFile(`${process.cwd()}/database/suspensions.json`, "utf-8")) as SuspensionEntry[];
            let bannedIndex = bannedUsers.findIndex(v => v.groupID === groupID && v.userID === robloxID);
            let isGroupBanned = (bannedIndex !== -1);
            let suspendedIndex = suspendedUsers.findIndex(v => v.groupID === groupID && v.userId === robloxID);
            let isSuspended = (suspendedIndex !== -1);
            let extraGroupData = "Is User Suspended: No";
            if(isSuspended) {
                let oldRole = (await roblox.getRoles(groupID)).find(v => v.id === suspendedUsers[suspendedIndex].oldRoleID).name;
                let time = suspendedUsers[suspendedIndex].timeToRelease - Date.now() as any;
                if(time <= 0) {
                    time = "Officially, this user is not suspended anymore, the next suspension check will delete their record from the DB"
                } else {
                    time = ms(time, {long: true})
                }
                extraGroupData = `Is User Suspended: Yes\nSuspension Reason: ${suspendedUsers[suspendedIndex].reason}\nSuspended From: ${oldRole}\nSuspended For: ${time}`;
            }
            groupDataValue = "```\nRank Name: <rank name>\nRank ID: <rank id>\nIs User Group Banned: <ban status>\n<extra>```"
            .replace("<rank name>", await roblox.getRankNameInGroup(groupID, robloxID))
            .replace("<rank id>", (await roblox.getRankInGroup(groupID, robloxID)).toString())
            .replace("<ban status>", isGroupBanned ? "Yes" : "No")
            .replace("<extra>", extraGroupData)
        }
        let embed = client.embedMaker({title: "Information", description: "", type: "info", author: interaction.user});
        embed.addFields({
            name: "User Data",
            value: "```\nUsername: <username>\nRoblox ID: <id>\n```"
            .replace("<username>", username)
            .replace("<id>", `${robloxID}`)
        });
        if(groupDataValue) {
            embed.addFields({
                name: "Group Data",
                value: groupDataValue
            });
        }
        if(gameDataValue) {
            embed.addFields({
                name: "Game Data",
                value: gameDataValue
            });
        }
        return await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("checkuser")
    .setDescription("Gets information about the inputted user")
    .addStringOption(o => o.setName("username").setDescription("The username of the user you wish to check").setRequired(true)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "User",
        isEphemeral: false,
        permissions: config.permissions.group.user,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
}

if(config.groupIds.length !== 0) {
    command.slashData.addStringOption(o => o.setName("group").setDescription("The group to check the user's group data in").setRequired(true).addChoices(...GroupHandler.parseGroups() as any))
}

if(config.universes.length !== 0) {
    command.slashData.addStringOption(o => o.setName("universe").setDescription("The universe to check the user's moderation status on").setRequired(true).addChoices(...UniverseHandler.parseUniverses() as any))
}

export default command;