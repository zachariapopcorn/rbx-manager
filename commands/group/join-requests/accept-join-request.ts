import Discord from 'discord.js';
import roblox = require('noblox.js');

import BotClient from '../../../utils/classes/BotClient';
import CommandFile from '../../../utils/interfaces/CommandFile';
import CommandLog from '../../../utils/interfaces/CommandLog';

import config from '../../../config';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction, client: BotClient, args: any): Promise<any> => {
        if(client.config.verificationChecks) {
            let verificationStatus = false;
            let robloxID = await client.getRobloxUser(interaction.guild.id, interaction.user.id);
            if(robloxID === 0) {
                verificationStatus = await client.preformVerificationChecks(robloxID, "JoinRequests");
            }
            if(!verificationStatus) {
                let embed = client.embedMaker({title: "Verification Checks Failed", description: "You've failed the verification checks", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
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
            await client.logAction(`<@${interaction.user.id}> has accepted the join request of **${username}**`);
            continue;
        }
        await client.initiateLogEmbedSystem(interaction, logs, false);
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("accept-join-request")
    .setDescription("Accepts the join request of the user(s) inputted")
    .addStringOption(o => o.setName("username").setDescription("The username(s) of the user(s) you wish to accept the join request of").setRequired(true)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Join Request",
        permissions: config.permissions.group.joinrequests
    }
}

export default command;