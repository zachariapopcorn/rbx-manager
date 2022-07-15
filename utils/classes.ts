import Discord from 'discord.js';
import Builders from '@discordjs/builders';
import roblox from 'noblox.js';
import { config } from '../config';

import axios = require('axios');

type RobloxRequestType = "Announce" | "Eval" | "GetJobID" | "Kick" | "Lock" | "Unlock" | "Mute" | "Unmute" | "Shutdown";
type CommandCategory = "Ban" | "Database" | "General Game" | "JobID" | "Lock" | "Mute" | "General Group" | "Join Request" | "Ranking" | "User" | "Shout";

type RobloxPostPermissions = "groupPostsPermissions.viewWall" | "groupPostsPermissions.postToWall" | "groupPostsPermissions.deleteFromWall" | "groupPostsPermissions.viewStatus" | "groupPostsPermissions.postToStatus";
type RobloxMembershipPermissions = "groupMembershipPermissions.changeRank" | "groupMembershipPermissions.inviteMembers" | "groupMembershipPermissions.removeMembers";
type RobloxManagementPermissions = "groupManagementPermissions.manageRelationships" | "groupManagementPermissions.manageClan" | "groupManagementPermissions.viewAuditLogs";
type RobloxEconomyPermissions = "groupEconomyPermissions.spendGroupFunds" | "groupEconomyPermissions.advertiseGroup" | "groupEconomyPermissions.createItems" | "groupEconomyPermissions.manageItems" | "groupEconomyPermissions.addGroupPlaces" | "groupEconomyPermissions.manageGroupGames" | "groupEconomyPermissions.viewGroupPayouts";

export interface BotConfig {
    DISCORD_TOKEN: string,
    ROBLOX_USERNAME: string,
    ROBLOX_PASSWORD: string,
    ROBLOX_COOKIE: string,
    ROBLOX_API_KEY: string,
    groupId: number,
    permissions: {
        all: string[],
        group: {
            shout: string[],
            ranking: string[],
            joinrequests: string[],
            user: string[],
        },
        game: {
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
        audit: {
            enabled: boolean,
            loggingChannel: string
        },
        shout: {
            enabled: boolean,
            loggingChannel: string
        },
        command: {
            enabled: boolean,
            loggingChannel: string
        }
    }
    embedColors: {
        info: Discord.ColorResolvable,
        success: Discord.ColorResolvable,
        error: Discord.ColorResolvable
    },
    universeId: number,
    datastoreName: string,
    verificationChecks: boolean,
    lockedRanks: any[],
    whitelistedServers: string[]
}

export interface CommandFile {
    run: Function;(interaction: Discord.CommandInteraction, client: BotClient, args: any[]),
    slashData: Builders.SlashCommandBuilder,
    commandData: CommandData
}

export interface CommandData {
    category: CommandCategory,
    permissions?: Discord.PermissionResolvable[] | string[],
    useDiscordPermissionSystem?: boolean
}

export interface VerificationResult {
    passedVerificationChecks: boolean,
    memberRole?: number
}

export interface RoverAPIResponse {
    status: "ok" | "error",
    robloxUsername: string,
    robloxId: number,
    errorCode: number,
    error: string
}

export interface CommandLog {
    username: string,
    status: "Success" | "Error" | "Cancelled",
    message?: string
}

export interface ModerationData {
    banData: {
        isBanned: boolean,
        reason: string
    },
    muteData: {
        isMuted: boolean,
        reason: string
    }
}

export class BotClient extends Discord.Client {
    public config: BotConfig

    constructor() {
        super({
            intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS]
        })
    }

    public async request(requestOptions: {url: string, method?: axios.Method, headers?: any, body?: any, robloxRequest?: boolean, returnFullResponse?: boolean}) : Promise<any> {
        const axiosClient = axios.default;
        let responseData: axios.AxiosResponse;
        if(requestOptions.robloxRequest) {
            requestOptions.headers = {
                "X-CSRF-TOKEN": await roblox.getGeneralToken(),
                "Cookie": this.config.ROBLOX_COOKIE,
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
        if(requestOptions.returnFullResponse) return responseData;
        return responseData.data;
    }
    public embedMaker(title: string, description: string, type: "info" | "success" | "error", author? : Discord.User, makeObject?: boolean): any {
        if(!author) author = this.user;
        if(!makeObject && makeObject !== false) makeObject = true;
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
        if(!this.config.logging.command.enabled) return;
        let embed = this.embedMaker("Command Executed", logString, "info");
        let channel = await this.channels.fetch(this.config.logging.command.loggingChannel) as Discord.TextChannel;
        if(channel) {
            try {
                await channel.send(embed);
            } catch(e) {
                console.error(`There was an error while trying to log a command execution to the command logging channel: ${e}`);
            }
        }
    }
    public createLogEmbeds(author: Discord.User, logs: CommandLog[]): Discord.WebhookEditMessageOptions[] {
        let embeds = [];
        let masterDescription = "";
        let pageCount = 1;
        for(let i = 0; i < logs.length; i++) {
            let logObject = logs[i];
            if(i === 0) {
                if(logObject.status === "Error") {
                    masterDescription += `**Username**: ${logObject.username} | **Status**: ${logObject.status} | **Message**: ${logObject.message.toString().replace("Error: ", "")}\n`;
                } else {
                    masterDescription += `**Username**: ${logObject.username} | **Status**: ${logObject.status} | **Message**: Operation ${logObject.status}\n`;
                }
            } else if(i % 10 !== 0) {
                if(logObject.status === "Error") {
                    masterDescription += `**Username**: ${logObject.username} | **Status**: ${logObject.status} | **Message**: ${logObject.message.toString().replace("Error: ", "")}\n`;
                } else {
                    masterDescription += `**Username**: ${logObject.username} | **Status**: ${logObject.status} | **Message**: Operation ${logObject.status}\n`;
                }
            } else {
                let embed = this.embedMaker(`Logs (Page ${pageCount})`, masterDescription, "info", author);
                embeds.push(embed);
                masterDescription = "";
                pageCount++;
            }
        }
        let embed = this.embedMaker(`Logs (Page ${pageCount})`, masterDescription, "info", author);
        embeds.push(embed);
        masterDescription = "";
        return embeds;
    }
    public async initiateLogEmbedSystem(interaction: Discord.CommandInteraction, logs: CommandLog[], didCommandReply?: boolean) {
        if(didCommandReply === undefined) didCommandReply = false;
        let logEmbeds = this.createLogEmbeds(interaction.user, logs);
        if(logEmbeds.length === 1) {
            if(didCommandReply) {
                return await interaction.channel.send(logEmbeds[0]);
            } else {
                return await interaction.editReply(logEmbeds[0]);
            }
        } else {
            let index = 0;
            let embed = logEmbeds[index];
            this.addButton(embed, "backButton", "Previous Log Page", "PRIMARY");
            this.addButton(embed, "nextButton", "Next Log Page", "PRIMARY");
            let msg: Discord.Message;
            if(didCommandReply) {
                msg = await interaction.channel.send(embed) as Discord.Message;
            } else {
                msg = await interaction.editReply(embed) as Discord.Message;
            }
            let filter = (buttonInteraction: Discord.Interaction) => buttonInteraction.isButton() && buttonInteraction.user.id === interaction.user.id;
            let collector = msg.createMessageComponentCollector({filter: filter});
            collector.on('collect', async(button: Discord.ButtonInteraction) => {
                if(button.customId === "backButton") {
                    index -= 1;
                    if(index < 0) {
                        index = logEmbeds.length - 1;
                    }
                } else {
                    index++;
                    if(index === logEmbeds.length) {
                        index = 0;
                    }
                }
                await button.reply({content: "ㅤ"});
                await button.deleteReply();
                embed = logEmbeds[index];
                embed.components = [];
                this.addButton(embed, "backButton", "Previous Log Page", "PRIMARY");
                this.addButton(embed, "nextButton", "Next Log Page", "PRIMARY");
                await msg.edit(embed);
            });
        }
    }
    public isLockedRole(role: roblox.Role): boolean {
        let isLocked = false;
        if(this.config.lockedRanks.findIndex(lockedRank => lockedRank === role.name) !== -1) isLocked = true;
        if(this.config.lockedRanks.findIndex(lockedRank => lockedRank === role.rank) !== -1) isLocked = true;
        return isLocked;
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
        if(command.commandData.useDiscordPermissionSystem) {
            let permissionsRequired = command.commandData.permissions as Discord.PermissionResolvable[];
            for(let i = 0; i < permissionsRequired.length; i++) {
                if(user.permissions.has(permissionsRequired[i])) return true;
            }
            return false;
        } else {
            let roleIDsRequired = command.commandData.permissions as string[];
            if(!roleIDsRequired) return true;
            roleIDsRequired = roleIDsRequired.concat(config.permissions.all);
            if(user.roles.cache.some(role => roleIDsRequired.includes(role.id))) return true;
            return false;
        }
    }
}

export class RobloxDatastore {
    private API_KEY: string;
    constructor(key: string) {
        this.API_KEY = key;
    }
    public async request(requestOptions: {url: string, method?: axios.Method, headers?: any, body?: any}) : Promise<any> {
        const axiosClient = axios.default;
        let responseData: axios.AxiosResponse;
        requestOptions.headers = {
            "x-api-key": this.API_KEY,
            ...requestOptions.headers
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
    public async getAsync(datastoreName: string, entryKey: string, scope?: string): Promise<any> {
        if(!scope) scope = "global";
        let response = await this.request({
            url: `https://apis.roblox.com/datastores/v1/universes/${config.universeId}/standard-datastores/datastore/entries/entry?datastoreName=${datastoreName}&scope=${scope}&entryKey=${entryKey}`,
            method: "GET"
        });
        return response;
    }
    public async removeAsync(datastoreName: string, entryKey: string, scope?: string): Promise<any> {
        if(!scope) scope = "global";
        let response = await this.request({
            url: `https://apis.roblox.com/datastores/v1/universes/${config.universeId}/standard-datastores/datastore/entries/entry?datastoreName=${datastoreName}&scope=${scope}&entryKey=${entryKey}`,
            method: "DELETE"
        });
        return response;
    }
    public async getModerationData(userID: number): Promise<ModerationData> {
        let response = await this.getAsync(config.datastoreName, `${userID}-moderationData`);
        return response;
    }
    public async setModerationData(userID: number, moderationData: ModerationData) {
        await this.request({
            url: `https://apis.roblox.com/datastores/v1/universes/${config.universeId}/standard-datastores/datastore/entries/entry?datastoreName=${config.datastoreName}&entryKey=${userID}-moderationData`,
            method: "POST",
            headers: {
                "content-md5": require('crypto').createHash('md5').update(JSON.stringify(moderationData)).digest('base64')
            },
            body: moderationData
        });
    }
}

export class MessagingService {
    private API_KEY: string;
    constructor(key: string) {
        this.API_KEY = key;
    }
    public async request(requestOptions: {url: string, method?: axios.Method, headers?: any, body?: any}) : Promise<any> {
        const axiosClient = axios.default;
        let responseData: axios.AxiosResponse;
        requestOptions.headers = {
            "x-api-key": this.API_KEY,
            ...requestOptions.headers
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
    public async sendMessage(type: RobloxRequestType, payload: any) {
        await this.request({
            url: `https://apis.roblox.com/messaging-service/v1/universes/${config.universeId}/topics/DiscordModerationSystemCall`,
            method: "POST",
            body: {
                message: JSON.stringify({type: type, payload: payload})
            }
        });
    }
}