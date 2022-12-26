import Discord from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';
import BotClient from '../classes/BotClient';
import CommandData from './CommandData';

export default interface CommandFile {
    run: (interaction: Discord.CommandInteraction, client: BotClient, args: any) => Promise<void>,
    slashData: SlashCommandBuilder,
    commandData: CommandData
}