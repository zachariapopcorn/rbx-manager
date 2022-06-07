import { BotConfig } from "./utils/classes";

require('dotenv').config();

export const config: BotConfig = {
    token: process.env.token,
    cookie: process.env.cookie,
    API_KEY: process.env.API_KEY,
    groupId: 5242495,
    permissions: {
        all: ["759959415708450837"],
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
        enabled: true,
        auditLogChannel: "967932588327067768",
        shoutLogChannel: "967932588327067768",
        commandLogChannel: "967932588327067768"
    },
    embedColors: {
        info: "BLUE",
        success: "GREEN",
        error: "RED",
    },
    universeId: 3507532981,
    datastoreName: "moderations",
    verificationChecks: true,
    lockedRanks: ["Administrators/Moderators"],
    whitelistedServers: ["658241441234944021"]
}