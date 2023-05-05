import Discord from 'discord.js';
import AntiAbuseAction from './AntiAbuseAction';

export default interface BotConfig {
    DISCORD_TOKEN: string,
    ROBLOX_USERNAME: string,
    ROBLOX_PASSWORD: string,
    ROBLOX_COOKIE: string,
    ROBLOX_API_KEY: string,
    ROVER_API_KEY: string,
    WEB_API_KEY: string,
    groupIds: number[],
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
    antiAbuse: {
        enabled: boolean,
        thresholds: {
            ranks: number,
            exiles: number
        },
        actions: {
            ranks: AntiAbuseAction,
            exiles: AntiAbuseAction
        }
    }
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
        },
        antiAbuse: {
            enabled: boolean,
            loggingChannel: string
        },
        sales: {
            enabled: boolean,
            loggingChannel: string
        }
    }
    embedColors: {
        info: Discord.ColorResolvable,
        success: Discord.ColorResolvable,
        error: Discord.ColorResolvable
    },
    debug?: boolean,
    defaultCooldown: number,
    cooldownOverrides: {},
    suspensionRank: number,
    universes: number[],
    datastoreName: string,
    verificationChecks: boolean,
    collectorTime: number,
    maximumNumberOfUsers: number,
    lockedRanks: any[],
    lockedCommands: string[],
}