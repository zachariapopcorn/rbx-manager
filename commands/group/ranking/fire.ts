import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData, CommandLog } from '../../../utils/classes';
import { config } from '../../../config';

import roblox = require('noblox.js');

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
            let verificationStatus = await client.preformVerificationChecks(interaction.user.id, "groupMembershipPermissions.changeRank", robloxID);
            if(!verificationStatus) {
                if(!verificationStatus) {
                    logs.push({
                        username: username,
                        status: "Error",
                        message: "Verification checks have failed"
                    });
                    continue;
                }
            }
        }
        let rankID = await roblox.getRankInGroup(client.config.groupId, robloxID);
        if(rankID === 0) {
            logs.push({
                username: username,
                status: "Error",
                message: "The user provided is not in the group"
            });
            continue;
        }
        let ranks = await roblox.getRoles(client.config.groupId);
        let lowestRank = Number.MAX_VALUE;
        for(let i = 0; i < ranks.length; i++) {
            let rankID = ranks[i].rank;
            if(lowestRank > rankID && rankID != 0) {
                lowestRank = rankID;
            }
        }
        try {
            await roblox.setRank(client.config.groupId, robloxID, lowestRank);
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
        await client.logAction(`<@${interaction.user.id}> has fired **${await roblox.getUsernameFromId(robloxID)}**`);
    }
    await client.initiateLogEmbedSystem(interaction, logs);
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("fire")
    .setDescription("Fires the inputted user(s)")
    .addStringOption(o => o.setName("username").setDescription("The person/people that you wish to fire").setRequired(true))

export const commandData: CommandData = {
    category: "Ranking",
    permissions: config.permissions.group.ranking
}