import BotConfig from "./utils/interfaces/BotConfig";

require('dotenv').config();

const config: BotConfig = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    ROBLOX_USERNAME: process.env.ROBLOX_USERNAME,
    ROBLOX_PASSWORD: process.env.ROBLOX_PASSWORD,
    ROBLOX_COOKIE: process.env.ROBLOX_COOKIE,
    ROBLOX_API_KEY: process.env.ROBLOX_API_KEY,
    ROVER_API_KEY: process.env.ROVER_API_KEY,
    WEB_API_KEY: process.env.WEB_API_KEY,
    groupIds: [],
    permissions: {
        all: [""],
        group: {
            shout: [""],
            ranking: [""],
            joinrequests: [""],
            user: [""],
        },
        game: {
            general: [""],
            broadcast: [""],
            kick: [""],
            ban: [""],
            shutdown: [""],
            datastore: [""],
            execution: [""],
            jobIDs: [""],
            lock: [""],
            mute: [""]
        }
    },
    antiAbuse: {
        enabled: true,
        thresholds: {
            ranks: 10,
            exiles: 5
        },
        actions: {
            ranks: "Suspend",
            exiles: "Exile"
        }
    },
    logging: {
        audit: {
            enabled: true,
            loggingChannel: ""
        },
        shout: {
            enabled: true,
            loggingChannel: ""
        },
        command: {
            enabled: true,
            loggingChannel: ""
        },
        antiAbuse: {
            enabled: true,
            loggingChannel: ""
        },
        sales: {
            enabled: true,
            loggingChannel: ""
        }
    },
    embedColors: {
        info: "Blue",
        success: "Green",
        error: "Red"
    },
    defaultCooldown: 5000,
    cooldownOverrides: {},
    suspensionRank: 1,
    universes: [],
    datastoreName: "moderations",
    verificationChecks: true,
    collectorTime: 120000,
    maximumNumberOfUsers: 5,
    lockedRanks: [],
    lockedCommands: [],
}

export default config;