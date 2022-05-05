import Discord from 'discord.js';
import Builders from '@discordjs/builders';
import roblox from 'noblox.js';
import { config } from '../config';

import axios = require('axios');

type RobloxRequestType = "Ban" | "Unban" | "Announce" | "CheckUser" | "Eval" | "Shutdown" | "GetJobID" | "GetJobIDs" | "Lock" | "Unlock" | "Mute" | "Unmute" | "";
type CommandCategory = "Ban" | "Database" | "General Game" | "JobID" | "Lock" | "Mute" | "General Group" | "Join Request" | "Ranking" | "User" | "Shout";

type RobloxPostPermissions = "groupPostsPermissions.viewWall" | "groupPostsPermissions.postToWall" | "groupPostsPermissions.deleteFromWall" | "groupPostsPermissions.viewStatus" | "groupPostsPermissions.postToStatus";
type RobloxMembershipPermissions = "groupMembershipPermissions.changeRank" | "groupMembershipPermissions.inviteMembers" | "groupMembershipPermissions.removeMembers";
type RobloxManagementPermissions = "groupManagementPermissions.manageRelationships" | "groupManagementPermissions.manageClan" | "groupManagementPermissions.viewAuditLogs";
type RobloxEconomyPermissions = "groupEconomyPermissions.spendGroupFunds" | "groupEconomyPermissions.advertiseGroup" | "groupEconomyPermissions.createItems" | "groupEconomyPermissions.manageItems" | "groupEconomyPermissions.addGroupPlaces" | "groupEconomyPermissions.manageGroupGames" | "groupEconomyPermissions.viewGroupPayouts";

export interface BotConfig {
    token: string,
    cookie: string
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
        shoutLogChannel: string,
        commandLogChannel: string
    }
    embedColors: {
        info: Discord.ColorResolvable,
        success: Discord.ColorResolvable,
        error: Discord.ColorResolvable
    },
    verificationChecks: boolean,
    lockedRanks: string[],
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

export interface VerificationResult {
    passedVerificationChecks: boolean,
    memberRole?: number
}

export interface RobloxRequest {
    authorID: string,
    channelID: string,
    type: RobloxRequestType,
    payload: any
}

export interface RoverAPIResponse {
    status: "ok" | "error",
    robloxUsername: string,
    robloxId: number,
    errorCode: number,
    error: string
}

export class BotClient extends Discord.Client {
    public config: BotConfig

    constructor() {
        super({
            intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES]
        })
    }

    public async request(requestOptions: {url: string, method?: axios.Method, headers?: any, body?: any, robloxRequest?: boolean}) : Promise<any> {
        const axiosClient = axios.default;
        let responseData: axios.AxiosResponse;
        if(requestOptions.robloxRequest) {
            requestOptions.headers = {
                "X-CSRF-TOKEN": await roblox.getGeneralToken(),
                "Cookie": this.config.cookie,
                ...requestOptions.headers
            }
        }
        try {
            responseData = await axiosClient({
                url: requestOptions.url,
                method: requestOptions.method || "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...requestOptions.headers || {}
                },
                data: requestOptions.body || {}
            })
        } catch(e) {
            throw e;
        }
        return responseData.data;
    }
    public embedMaker(title: string, description: string, type: "info" | "success" | "error", author? : Discord.User, makeObject?: boolean): any {
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
    public addButton(messageData: Discord.MessageOptions, id: string, label: string, style: Discord.MessageButtonStyleResolvable) {
        let components = messageData.components || [];
        let newComponent = new Discord.MessageActionRow().addComponents(new Discord.MessageButton().setCustomId(id).setLabel(label).setStyle(style));
        components.push(newComponent);
        messageData.components = components;
    }
    public async getRobloxUser(discordID: string): Promise<number> {
        let roverResponse;
        try {
            roverResponse = await this.request({url: `https://verify.eryn.io/api/user/${discordID}`}) as RoverAPIResponse;
        } catch {
            return 0;
        }
        if(roverResponse.status === "ok") {
            return roverResponse.robloxId;
        }
    }
    private formatPermissionString(permissionString: string): any {
        let arr = permissionString.split(".");
        return {
            category: arr[0],
            permission: arr[1]
        }
    }
    public async preformVerificationChecks(discordID: string, permissionNode: RobloxPostPermissions | RobloxMembershipPermissions | RobloxManagementPermissions | RobloxEconomyPermissions, otherUser?: number): Promise<boolean> {
        let permissionObject = this.formatPermissionString(permissionNode);
        let robloxID = await this.getRobloxUser(discordID);
        if(robloxID === 0) {
            return false;
        }
        let memberRole = await roblox.getRankInGroup(this.config.groupId, robloxID);
        if(memberRole === 0) {
            return false;
        }
        let groupRole = await roblox.getRole(this.config.groupId, memberRole);
        let rolePermissions = (await roblox.getRolePermissions(this.config.groupId, groupRole.id)).permissions;
        if(!rolePermissions[permissionObject.category][permissionObject.permission]) return false;
        if(otherUser) {
            let groupRoleOfVictim = await roblox.getRankInGroup(this.config.groupId, otherUser);
            if(groupRoleOfVictim >= groupRole.rank) return false;
        }
        return true;
    }
    public async logAction(logString: string): Promise<void> {
        let embed = this.embedMaker("Command Executed", logString, "info");
        let channel = await this.channels.fetch(this.config.logging.commandLogChannel) as Discord.TextChannel;
        if(channel) {
            try {
                await channel.send(embed);
            } catch(e) {
                console.error(`There was an error while trying to log a command execution to the command logging channel: ${e}`);
            }
        }
    }
}

export class CommandHelpers {
    public static loadArguments(interaction: Discord.CommandInteraction): any {
        let options = interaction.options.data;
        let args = {};
        for(let i = 0; i < options.length; i++) {
            args[options[i].name] = options[i].value;
        }
        return args;
    }
    public static checkPermissions(command: CommandFile, user: Discord.GuildMember): boolean {
        let roleIDsRequired = command.commandData.permissions;
        if(!roleIDsRequired) return true;
        roleIDsRequired = roleIDsRequired.concat(config.permissions.group.all).concat(config.permissions.game.all);
        if(user.roles.cache.some(role => roleIDsRequired.includes(role.id))) return true;
        return false;
    }
}