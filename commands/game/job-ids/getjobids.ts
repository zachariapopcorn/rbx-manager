import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("getjobids")
    .setDescription("Gets all of the game's job ids")

export const commandData: CommandData = {
    category: "JobID",
    permissions: config.permissions.game.jobIDs
}