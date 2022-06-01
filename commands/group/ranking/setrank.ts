import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData, CommandLog } from '../../../utils/classes';
import { config } from '../../../config';

import roblox = require('noblox.js');

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any) {
    let logs: CommandLog[] = [];
    let usernames = args["username"].replaceAll(" ", "").split(",");
    let ranks = args["rank"].replaceAll(" ", "").split(",");
    if(ranks.length === 1) {
        while(true) {
            ranks.push(ranks[0]);
            if(ranks.length === usernames.length) break;
        }
    } else if(ranks.length !== usernames.length) {
        let embed = client.embedMaker("Argument Error", `You inputted an unequal amount of usernames and ranks, please make sure that these amounts are equal, or, if you wish to apply one rank to multiple people, only put that rank for the rank argument`, "error", interaction.user);
        return await interaction.editReply(embed);
    }
    for(let i = 0; i < usernames.length; i++) {
        let username = usernames[i];
        let rank = ranks[i];
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
                logs.push({
                    username: username,
                    status: "Error",
                    message: "Verification checks have failed"
                });
                continue;
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
        let roles = await roblox.getRoles(client.config.groupId);
        let isRankID = Number(rank) == rank;
        try {
            if(!isRankID) { // If a rank name was inputed
                rank = roles.find(v => v.name.toLowerCase() === rank.toLowerCase()).rank; // Errors if not a group role
            } else {
                rank = Number(rank);
                let index = roles.findIndex(v => v.rank === rank);
                if(index === -1) throw("")
            }
        } catch {
            logs.push({
                username: username,
                status: "Error",
                message: `The rank provided, **${rank}**, is invalid`
            });
            continue;
        }
        if(config.verificationChecks) {
            let authorRobloxID = await client.getRobloxUser(interaction.user.id); // We can assume that this is valid due to the checks above passing
            let authorRank = await roblox.getRankInGroup(client.config.groupId, authorRobloxID);
            if(rank >= authorRank) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "Verification checks have failed"
                });
                continue;
            }
        }
        let roleObject = await roblox.getRole(client.config.groupId, rank);
        if(client.isLockedRole(roleObject)) {
            logs.push({
                username: username,
                status: "Error",
                message: `The rank provided, **${rank}**, is currently locked`
            });
            continue;
        }
        let oldRank = await roblox.getRankNameInGroup(client.config.groupId, robloxID);
        try {
            await roblox.setRank(client.config.groupId, robloxID, rank);
        } catch(e) {
            logs.push({
                username: username,
                status: "Error",
                message: e
            });
            continue;
        }
        let newRank = await roblox.getRankNameInGroup(client.config.groupId, robloxID);
        logs.push({
            username: username,
            status: "Success"
        });
        if(client.config.logging.enabled) {
            await client.logAction(`<@${interaction.user.id}> has ranked **${await roblox.getUsernameFromId(robloxID)}** from **${oldRank}** to **${newRank}**`);
        }
    }
    await client.initiateLogEmbedSystem(interaction, logs);
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("setrank")
    .setDescription("Sets the rank of the inputted user(s) to the inputted rank(s)")
    .addStringOption(o => o.setName("username").setDescription("The username(s) of the person/people you wish to rank").setRequired(true))
    .addStringOption(o => o.setName("rank").setDescription("The rank(s) you wish to rank the inputted person/people to").setRequired(true))

export const commandData: CommandData = {
    category: "Ranking",
    permissions: config.permissions.group.ranking
}