import Discord from 'discord.js';
import roblox = require('noblox.js');
import ms = require('ms')

import * as fs from 'fs/promises';

import BotClient from '../../../utils/classes/BotClient';
import CommandFile from '../../../utils/interfaces/CommandFile';

import config from '../../../config';
import SuspensionFile from '../../../utils/interfaces/SuspensionFile';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        if(client.isUserOnCooldown(require('path').parse(__filename).name, interaction.user.id)) {
            let embed = client.embedMaker({title: "Cooldown", description: "You're currently on cooldown for this command, take a chill pill", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let username = args["username"];
        let userID = await roblox.getIdFromUsername(username) as number;
        if(!userID) {
            let embed = client.embedMaker({title: "Invalid Username", description: "The username provided is an invalid Roblox username", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        username = await roblox.getUsernameFromId(userID);
        let time = ms(args["time"]);
        if(!time) {
            let embed = client.embedMaker({title: "Invalid Time Suppiled", description: "You inputted an invalid time, please input a valid one", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let oldRank = await roblox.getRankInGroup(client.config.groupId, userID);
        if(oldRank === 0) {
            let embed = client.embedMaker({title: "User Not In Group", description: "This user is currently not in the group", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let suspensions = JSON.parse(await fs.readFile(`${process.cwd()}/database/suspensions.json`, "utf-8")) as SuspensionFile;
        let index = suspensions.users.findIndex(v => v.userId === userID);
        if(index != -1) {
            suspensions.users[index].timeToRelease = Date.now() + (time as any);
        } else {
            let oldRoleID = (await roblox.getRoles(client.config.groupId)).find(v => v.rank === oldRank).id;
            suspensions.users.push({
                userId: userID,
                reason: args["reason"],
                oldRoleID: oldRoleID,
                timeToRelease: Date.now() + (time as any)
            });
            try {
                await roblox.setRank(client.config.groupId, userID, client.config.suspensionRank);
            } catch(e) {
                let embed = client.embedMaker({title: "Error", description: `There was an error while trying to change the rank of this user: ${e}`, type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
        }
        await fs.writeFile(`${process.cwd()}/database/suspensions.json`, JSON.stringify(suspensions));
        await client.logAction(`<@${interaction.user.id}> has suspended **${username}** for **${ms((time as any), {long: true})}** for the reason of **${args["reason"]}**`);
        let embed = client.embedMaker({title: "Success", description: `You've successfully suspended this user`, type: "success", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        client.cooldowns.push({commandName: require('path').parse(__filename).name, userID: interaction.user.id, cooldownExpires: (Date.now() + (client.getCooldownForCommand(require('path').parse(__filename).name)))});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("suspend")
    .setDescription("Suspends the given users with the given amount of time")
    .addStringOption(o => o.setName("username").setDescription("The username of the person you wish to suspend").setRequired(true))
    .addStringOption(o => o.setName("time").setDescription("The amount of time you wish to suspend the user for").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("The reason for the suspension").setRequired(true)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Ranking",
        permissions: config.permissions.group.ranking
    }
}

export default command;