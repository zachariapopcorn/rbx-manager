import Discord from 'discord.js';
import roblox from 'noblox.js';

import fs from "fs/promises"

import BotClient from '../../../utils/classes/BotClient';

import CommandFile from '../../../utils/interfaces/CommandFile';
import UserEntry from '../../../utils/interfaces/UserEntry';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let xpData = JSON.parse(await fs.readFile(`${process.cwd()}/database/xpdata.json`, "utf-8")) as UserEntry[];
        let index = xpData.findIndex(v => v.discordID === interaction.user.id);
        let userData: UserEntry;
        if(index !== -1) {
            userData = xpData[index];
        } else {
            userData = {
                discordID: interaction.user.id,
                robloxID: 0,
                redeemedRewards: [],
                xp: 0
            }
        }
        let rewards = client.config.xpSystem.rewards;
        let availableRewardString = "";
        for(let i = 0; i < rewards.length; i++) {
            if(userData.xp >= rewards[i].xpNeeded && userData.redeemedRewards.indexOf(rewards[i].rewardID) === -1) {
                let groupName = (await roblox.getGroup(rewards[i].rank.groupId)).name;
                availableRewardString += `**ID**: ${rewards[i].rewardID} | **Reward**: ${rewards[i].rank.rankName} rank in **${groupName}**\n`;
            }
        }
        if(availableRewardString === "") {
            let embed = client.embedMaker({title: "No Rewards Available", description: "You don't have any rewards available at the moment. Try again later", type: "info", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let embed = client.embedMaker({title: "Avaiable Rewards", description: `You have rewards avaiable. To redeem them, run the redeem command\n\n${availableRewardString}`, type: "info", author: interaction.user});
        return await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("list-rewards")
    .setDescription("Lists all the awards that you qualify for which you didn't redeem"),
    commandData: {
        category: "XP",
        isEphemeral: false,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
}

export default command;