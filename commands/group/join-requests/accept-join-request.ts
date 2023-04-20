import Discord from 'discord.js';
import roblox = require('noblox.js');

import BotClient from '../../../utils/classes/BotClient';
import CommandHelpers from '../../../utils/classes/CommandHelpers';
import CommandFile from '../../../utils/interfaces/CommandFile';
import CommandLog from '../../../utils/interfaces/CommandLog';

import config from '../../../config';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction, client: BotClient, args: any): Promise<any> => {
        if(client.config.verificationChecks) {
            let verificationStatus = false;
            let robloxID = await client.getRobloxUser(interaction.guild.id, interaction.user.id);
            if(robloxID !== 0) {
                verificationStatus = await client.preformVerificationChecks(robloxID, "JoinRequests");
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
            let robloxID = await roblox.getIdFromUsername(username) as number;
            if(!robloxID) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "The username provided is an invalid Roblox username"
                });
                continue;
            }
            username = await roblox.getUsernameFromId(robloxID);
            try {
                await roblox.handleJoinRequest(client.config.groupId, robloxID, true);
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
            await client.logAction(`<@${interaction.user.id}> has accepted the join request of **${username}** for the reason of **${reason}**`);
            continue;
        }
        await client.initiateLogEmbedSystem(interaction, logs);
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("accept-join-request")
    .setDescription("Accepts the join request of the user(s) inputted")
    .addStringOption(o => o.setName("username").setDescription("The username(s) of the user(s) you wish to accept the join request of").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("The reason(s) of why you're accepting the join request(s)").setRequired(false)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Join Request",
        permissions: config.permissions.group.joinrequests
    },
    hasCooldown: true
}

export default command;