import Discord from 'discord.js';
import Builders from '@discordjs/builders';
import { config } from '../config';

type RobloxRequestType = "Ban" | "Unban" | "Announce" | "CheckUser" | "Eval" | "Shutdown" | "GetJobID" | "GetJobIDs" | "Lock" | "Unlock" | "Mute" | "Unmute" | "";
type CommandCategory = "Ban" | "Database" | "General Game" | "JobID" | "Lock" | "Mute" | "General Group" | "Join Request" | "Ranking" | "User" | "Shout"

export interface BotConfig {
    token: string,
    cookie: string
    projectId: string,
    clientEmail: string,
    privateKey: string,
    groupId: number,
    permissions: {
        group: {
            all: string[],
            shout: string[],
            ranking: string[],
            joinrequests: string[],
            user: string[],
        },
        game: {
            all: string[],
            general: string[]
            broadcast: string[],
            kick: string[],
            ban: string[],
            shutdown: string[],
            datastore: string[],
            execution: string[],
            jobIDs: string[],
            lock: string[],
            mute: string[]
        }
    },
    logging: {
        enabled: boolean,
        auditLogChannel: string,
        shouttLogChannel: string,
        commandLogChannel: string
    }
    embedColors: {
        info: Discord.ColorResolvable,
        success: Discord.ColorResolvable,
        error: Discord.ColorResolvable
    }
    whitelistedServers: string[]
}

export interface CommandFile {
    run: Function;(interaction: Discord.CommandInteraction, client: BotClient, args: any[]),
    slashData: Builders.SlashCommandBuilder,
    commandData: CommandData
}

export interface CommandData {
    category: CommandCategory,
    permissions?: string[]
}

export interface RobloxRequest {
    authorID: string,
    channelID: string,
    type: RobloxRequestType,
    payload: any
}

export class BotClient extends Discord.Client {
    public config: BotConfig
    public embedMaker(title: string, description: string, type: "info" | "success" | "error", author? : Discord.User, makeObject?: boolean, ): any {
        if(!author) author = this.user;
        if(!makeObject) makeObject = true;
        let embed = new Discord.MessageEmbed();
        embed.setColor(this.config.embedColors[type]);
        embed.setAuthor({name: author.tag, iconURL: author.displayAvatarURL()});
        embed.setTitle(title);
        embed.setDescription(description);
        embed.setFooter({text: "Created by zachariapopcorn#8105 - https://discord.gg/XGGpf3q"});
        if(makeObject) {
            return {
                embeds: [embed],
                components: []
            }
        }
        return embed;
    }
}

export class CommandHelpers {
    public static loadArguments(interaction: Discord.CommandInteraction): any[] {
        let options = interaction.options.data;
        let args = [];
        for(let i = 0; i < options.length; i++) {
            args.push({
                [options[i].name]: options[i].value
            });
        }
        return args;
    }
    public static checkPermissions(command: CommandFile, user: Discord.GuildMember): boolean {
        let roleIDsRequired = command.commandData.permissions;
        if(!roleIDsRequired || roleIDsRequired.length === 0) return true;
        roleIDsRequired.concat(config.permissions.group.all);
        roleIDsRequired.concat(config.permissions.game.all);
        if(user.roles.cache.some(role => roleIDsRequired.includes(role.id))) return true;
        return false;
    }
}