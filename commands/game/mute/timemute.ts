import Discord from 'discord.js';
import roblox = require('noblox.js');
import ms = require('ms');

import BotClient from '../../../utils/classes/BotClient';
import CommandFile from '../../../utils/interfaces/CommandFile';
import CommandLog from '../../../utils/interfaces/CommandLog';
import MessagingService from '../../../utils/classes/MessagingService';
import ModerationData from '../../../utils/interfaces/ModerationData';
import RobloxDatastore from '../../../utils/classes/RobloxDatastore';
import CommandHelpers from '../../../utils/classes/CommandHelpers';

import config from '../../../config';

const database = new RobloxDatastore(config);
const messaging = new MessagingService(config);

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        if(client.isUserOnCooldown(require('path').parse(__filename).name, interaction.user.id)) {
            let embed = client.embedMaker({title: "Cooldown", description: "You're currently on cooldown for this command, take a chill pill", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let logs: CommandLog[] = [];
        let usernames = args["username"].replaceAll(" ", "").split(",");
        let timeData = CommandHelpers.parseTimes(usernames, args["time"]);
        if(timeData.didError) {
            let embed = client.embedMaker({title: "Argument Error", description: `Something about your time input was wrong. Most likely it was because of invalid times, please input valid ones`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let times = timeData.parsedTimes;
        let reasonData = CommandHelpers.parseReasons(usernames, args["reason"]);
        if(reasonData.didError) {
            let embed = client.embedMaker({title: "Argument Error", description: `You inputted an unequal amount of usernames and reasons, please make sure that these amounts are equal, or, if you wish to apply one reason to multiple people, only put that reason for the reason argument`, type: "error", author: interaction.user})
            return await interaction.editReply({embeds: [embed]});
        }
        let reasons = reasonData.parsedReasons;
        let universeName = args["universe"];
        let universeID = CommandHelpers.getUniverseIDFromName(universeName);
        for(let i = 0; i < usernames.length; i++) {
            let username = usernames[i];
            let time = times[i];
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
                let oldData: ModerationData;
                try {
                    oldData = await database.getModerationData(universeID, robloxID);
                } catch(e) {
                    if(!(e.toString() === "Error: 404 NOT_FOUND Entry not found in the datastore.")) {
                        logs.push({
                            username: username,
                            status: "Error",
                            message: e
                        });
                        continue;
                    } else {
                        oldData = {
                            banData: { // Gets overridden in the setModerationData call
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
                await database.setModerationData(universeID, robloxID, {banData: {isBanned: oldData.banData.isBanned, reason: oldData.banData.reason, releaseTime: oldData.banData.releaseTime}, muteData: {isMuted: true, reason: reason, releaseTime: (Date.now() + time)}});
            } catch(e) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: e
                });
                continue;
            }
            let didMuteError = false;
            try {
                await messaging.sendMessage(universeID, "Mute", {username: username, reason: reason});
            } catch(e) {
                didMuteError = true;
                logs.push({
                    username: username,
                    status: "Error",
                    message: `Although this user is now muted, I couldn't mute them in the game because of the following error: ${e}`
                });
            }
            if(!didMuteError) {
                logs.push({
                    username: username,
                    status: "Success"
                });
            }
            await client.logAction(`<@${interaction.user.id}> has muted **${username}** in **${universeName}** for **${ms(time, {long: true})}** with the reason of **${reason}**`);
            continue;
        }
        await client.initiateLogEmbedSystem(interaction, logs);
        client.cooldowns.push({commandName: require('path').parse(__filename).name, userID: interaction.user.id, cooldownExpires: (Date.now() + (client.getCooldownForCommand(require('path').parse(__filename).name) * usernames.length))});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("timemute")
    .setDescription("Mutes the inputted user(s) for the given time")
    .addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...CommandHelpers.parseUniverses() as any))
    .addStringOption(o => o.setName("username").setDescription("The username(s) of the user(s) you wish to mute").setRequired(true))
    .addStringOption(o => o.setName("time").setDescription("The duration of the mute(s)").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("The reason(s) of the mute(s)").setRequired(false)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Mute",
        permissions: config.permissions.game.mute
    }
}

export default command;