import BotConfig from "./utils/interfaces/BotConfig";

require('dotenv').config();

const config: BotConfig = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    ROBLOX_COOKIE: process.env.ROBLOX_COOKIE,
    ROBLOX_API_KEY: process.env.ROBLOX_API_KEY,
    ROVER_API_KEY: process.env.ROVER_API_KEY,
    WEB_API_KEY: process.env.WEB_API_KEY,
    groupId: 0,
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
        }
    },
    embedColors: {
        info: "Blue",
        success: "Green",
        error: "Red"
    },
    universes: [],
    datastoreName: "moderations",
    verificationChecks: true,
    collectorTime: 120000,
    maximumNumberOfUsers: 5,
    lockedRanks: [""],
    lockedCommands: [""],
    whitelistedServers: [""]
}

export default config;
