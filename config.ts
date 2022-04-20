import { BotConfig } from "./utils/classes";

require('dotenv').config();

export const config: BotConfig = {
    token: process.env.token,
    cookie: process.env.cookie,
    projectId: process.env.projectId,
    clientEmail: process.env.clientEmail,
    privateKey: process.env.privateKey,
    groupId: 0,
    permissions: {
        group: {
            all: [""],
            shout: [""],
            ranking: [""],
            joinrequests: [""],
            exile: [""],
            audits: [""]
        },
        game: {
            all: [""],
            broadcast: [""],
            kick: [""],
            ban: [""],
            datastore: [""],
            execution: [""]
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