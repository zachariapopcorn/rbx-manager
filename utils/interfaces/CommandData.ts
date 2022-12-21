import Discord from 'discord.js';

type CommandCategory = "Ban" | "Database" | "General Game" | "JobID" | "Lock" | "Mute" | "General Group" | "Join Request" | "Ranking" | "User" | "Shout";

export default interface CommandData {
    category: CommandCategory,
    permissions?: Discord.PermissionResolvable[] | string[],
    useDiscordPermissionSystem?: boolean
}