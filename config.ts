import BotConfig from "./utils/interfaces/BotConfig";

require('dotenv').config();

const config: BotConfig = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    ROBLOX_COOKIE: process.env.ROBLOX_COOKIE,
    ROBLOX_API_KEY: process.env.ROBLOX_API_KEY,
    ROVER_API_KEY: process.env.ROVER_API_KEY,
    groupId: 5242495,
    permissions: {
        all: ["990827999286919218"],
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
            loggingChannel: "1019800364712734821"
        },
        shout: {
            enabled: true,
            loggingChannel: "1019800364712734821"
        },
        command: {
            enabled: true,
            loggingChannel: "1019800364712734821"
        }
    },
    embedColors: {
        info: "Blue",
        success: "Green",
        error: "Red"
    },
    universeId: 3507532981,
    datastoreName: "moderations",
    verificationChecks: true,
    collectorTime: 120000,
    maximumNumberOfUsers: 5,
    lockedRanks: ["Administrators/Moderators", "Developer"],
    lockedCommands: ["exile"],
    whitelistedServers: ["658241441234944021"]
}

export default config;