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