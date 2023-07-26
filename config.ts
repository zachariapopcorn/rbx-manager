import BotConfig from "./utils/interfaces/BotConfig";

require('dotenv').config();

const values = ["DISCORD_TOKEN", "ROBLOX_USERNAME", "ROBLOX_PASSWORD", "ROBLOX_COOKIE", "ROBLOX_API_KEY", "ROVER_API_KEY"];
for(let i = 0; i < values.length; i++) {
    if(!process.env[values[i]]) {
        console.log(`${values[i]} not defined in .env file`);
        process.exit(1);
    }
}

const config: BotConfig = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    ROBLOX_USERNAME: process.env.ROBLOX_USERNAME,
    ROBLOX_PASSWORD: process.env.ROBLOX_PASSWORD,
    ROBLOX_COOKIE: process.env.ROBLOX_COOKIE,
    ROBLOX_API_KEY: process.env.ROBLOX_API_KEY,
    ROVER_API_KEY: process.env.ROVER_API_KEY,
    groupIds: [],
    permissions: {
        all: [""],
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
        enabled: false,
        rewards: [], // Format is [{rewardID: string, rank: {groupId: number, rankName: string}, xpNeeded: number}] ; EX: [rewardID: "activeMemberReward", rank: {groupId: 253, rankName: "Developer"}, xpNeeded: 1000]
        earnings: {
            messages: 2,
            reactions: 1
        }
    },
    counting: {
        enabled: false,
        goal: 0,
        loggingChannel: ""
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
        },
        xp: {
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
    cooldownOverrides: {}, // Format: {"command name": cooldownInMilliSeconds} ; EX: {"exile": 20000}
    suspensionRank: 0,
    universes: [],
    datastoreName: "moderations",
    verificationChecks: true,
    collectorTime: 120000,
    maximumNumberOfUsers: 5,
    lockedRanks: [],
    lockedCommands: [],
}

export default config;