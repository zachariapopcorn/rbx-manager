import Discord from 'discord.js';
import roblox = require('noblox.js');

import fs from "fs/promises"

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import CommandHelpers from '../../../utils/classes/CommandHelpers';
import GroupHandler from '../../../utils/classes/GroupHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';
import CommandLog from '../../../utils/interfaces/CommandLog';
import GroupBanEntry from '../../../utils/interfaces/GroupBanEntry';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let groupID = GroupHandler.getIDFromName(args["group"]);
        let authorRobloxID = await client.getRobloxUser(interaction.guild.id, interaction.user.id);
        let logs: CommandLog[] = [];
        let usernames = args["username"].replaceAll(" ", "").split(",");
        let reasonData = CommandHelpers.parseReasons(usernames, args["reason"]);
        if(reasonData.didError) {
            let embed = client.embedMaker({title: "Argument Error", description: `You inputted an unequal amount of usernames and reasons, please make sure that these amounts are equal, or, if you wish to apply one reason to multiple people, only put that reason for the reason argument`, type: "error", author: interaction.user})
            return await interaction.editReply({embeds: [embed]});
        }
        let reasons = reasonData.parsedReasons;
        for(let i = 0; i < usernames.length; i++) {
            let username = usernames[i];
            let reason = reasons[i];
            let victimRobloxID = await roblox.getIdFromUsername(username) as number;
            if(!victimRobloxID) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "The username provided is an invalid Roblox username"
                });
                continue;
            }
            username = await roblox.getUsernameFromId(victimRobloxID);
            if(config.verificationChecks) {
                let verificationStatus = await client.preformVerificationChecks(groupID, authorRobloxID, "Exile", victimRobloxID);
                if(!verificationStatus) {
                    logs.push({
                        username: username,
                        status: "Error",
                        message: "Verification checks have failed"
                    });
                    continue;
                }
            }
            let bannedUsers = JSON.parse(await fs.readFile(`${process.cwd()}/database/groupbans.json`, "utf-8")) as GroupBanEntry[];
            let index = bannedUsers.findIndex(v => v.groupID === groupID && v.userID === victimRobloxID);
            if(index !== -1) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "The user provided is already banned from the group"
                });
                continue;
            }
            bannedUsers.push({groupID: groupID, userID: victimRobloxID});
            await fs.writeFile(`${process.cwd()}/database/groupbans.json`, JSON.stringify(bannedUsers));
            let rankID = await roblox.getRankInGroup(groupID, victimRobloxID);
            if(rankID !== 0) {
                try {
                    await roblox.exile(groupID, victimRobloxID);
                } catch(e) {
                    logs.push({
                        username: username,
                        status: "Error",
                        message: `Although this user is now group banned, they did not get exiled due to the following error: ${e}`
                    });
                }
            } else {
                logs.push({
                    username: username,
                    status: "Success"
                });
            }
            await client.logAction(`<@${interaction.user.id}> has banned **${username}** from the group for the reason of **${reason}** from **${GroupHandler.getNameFromID(groupID)}**`);
        }
        await client.initiateLogEmbedSystem(interaction, logs);
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("groupban")
    .setDescription("Bans the supplied user(s) from the group")
    .addStringOption(o => o.setName("group").setDescription("The group to do the banning in").setRequired(true).addChoices(...GroupHandler.parseGroups() as any))
    .addStringOption(o => o.setName("username").setDescription("The username(s) of the user(s) you wish to ban from the group").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("The reason(s) of the bans(s)").setRequired(false)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "User",
        isEphemeral: false,
        permissions: config.permissions.group.user,
        hasCooldown: true,
        preformGeneralVerificationChecks: true,
        permissionToCheck: "Exile"
    }
}

export default command;