import { SlashCommandBuilder } from 'discord.js';
import CommandFile from "./CommandFile";
import CommandData from './CommandData';

export default interface CommandInstance {
    file: CommandFile,
    name: string,
    slashData: SlashCommandBuilder,
    commandData: CommandData
}