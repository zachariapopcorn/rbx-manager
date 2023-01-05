import Discord from 'discord.js';
import roblox = require('noblox.js');

import * as fs from 'fs/promises';

import BotClient from '../../../utils/classes/BotClient';
import CommandHelpers from '../../../utils/classes/CommandHelpers';
import CommandFile from '../../../utils/interfaces/CommandFile';
import CommandLog from '../../../utils/interfaces/CommandLog';

import config from '../../../config';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let authorRobloxID = await client.getRobloxUser(interaction.guild.id, interaction.user.id);
        if(client.config.verificationChecks) {
            let verificationStatus = false;
            if(authorRobloxID !== 0) {
                verificationStatus = await client.preformVerificationChecks(authorRobloxID, "Exile");
            }
            if(!verificationStatus) {
                let embed = client.embedMaker({title: "Verification Checks Failed", description: "You've failed the verification checks", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
        }
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
            let victimRobloxID;
            try {
                victimRobloxID = await roblox.getIdFromUsername(username);
            } catch {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "The username provided is an invalid Roblox username"
                });
                continue;
            }
            username = await roblox.getUsernameFromId(victimRobloxID);
            if(config.verificationChecks) {
                let verificationStatus = await client.preformVerificationChecks(authorRobloxID, "Exile", victimRobloxID);
                if(!verificationStatus) {
                    logs.push({
                        username: username,
                        status: "Error",
                        message: "Verification checks have failed"
                    });
                    continue;
                }
            }
            let bannedUsers = JSON.parse(await fs.readFile(`${process.cwd()}/database/groupbans.json`, "utf-8"));
            let index = bannedUsers.userIDs.findIndex(v => v === victimRobloxID);
            if(index === -1) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "The user provided is not banned from the group"
                });
                continue;
            }
            bannedUsers.userIDs.splice(index, 1);
            await fs.writeFile(`${process.cwd()}/database/groupbans.json`, JSON.stringify(bannedUsers));
            logs.push({
                username: username,
                status: "Success"
            });
            await client.logAction(`<@${interaction.user.id}> has unbanned **${username}** from the group for the reason of **${reason}**`);
        }
        await client.initiateLogEmbedSystem(interaction, logs);
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("ungroupban")
    .setDescription("Unbans the user(s) inputted from the group")
    .addStringOption(o => o.setName("username").setDescription("The username(s) of the user(s) you wish to unban from the group").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("The reason(s) of the unbans(s)").setRequired(false)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "User",
        permissions: config.permissions.group.user
    }
}

export default command;