import { BotConfig } from "./utils/classes";

require('dotenv').config();

export const config: BotConfig = {
    token: process.env.token,
    cookie: process.env.cookie,
    groupId: 0,
    permissions: {
        group: {
            all: [""],
            shout: [""],
            ranking: [""],
            joinrequests: [""],
            user: [""],
        },
        game: {
            all: [""],
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
        enabled: true,
        auditLogChannel: "",
        shouttLogChannel: "",
        commandLogChannel: ""
    },
    embedColors: {
        info: "BLUE",
        success: "GREEN",
        error: "RED",
    },
    whitelistedServers: [""]
}