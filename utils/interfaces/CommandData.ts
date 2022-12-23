import Discord from 'discord.js';
import CommandCategory from './CommandCategory';

export default interface CommandData {
    category: CommandCategory,
    permissions?: Discord.PermissionResolvable[] | string[],
    useDiscordPermissionSystem?: boolean
}