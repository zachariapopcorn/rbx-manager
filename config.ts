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
    groupIds: [5242495],
    permissions: {
        all: ["990827999286919218"],
        group: {
            shout: [""],
            ranking: [""],
            joinrequests: [""],
            user: [""],
            xp: [""]
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
    xpSystem: {
        enabled: true,
        rewards: [{
            rewardID: "activeMemberReward",
            rank: {
                groupId: 5242495,
                rankName: "Developer"
            },
            xpNeeded: 1000
        }],
        earnings: {
            messages: 2,
            reactions: 1
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
        },
        antiAbuse: {
            enabled: true,
            loggingChannel: "1019800364712734821"
        },
        sales: {
            enabled: true,
            loggingChannel: "1019800364712734821"
        },
        xp: {
            enabled: true,
            loggingChannel: "1019800364712734821"
        }
    },
    embedColors: {
        info: "Blue",
        success: "Green",
        error: "Red"
    },
    defaultCooldown: 5000,
    cooldownOverrides: {}, // Format: {"command name": cooldownInMilliSeconds} ; EX: {"exile": 20000}
    suspensionRank: 1,
    universes: [3507532981],
    datastoreName: "moderations",
    verificationChecks: true,
    collectorTime: 120000,
    maximumNumberOfUsers: 5,
    lockedRanks: ["Administrators/Moderators"],
    lockedCommands: ["revert-ranks"],
    debug: true
}

export default config;