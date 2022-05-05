import { BotConfig } from "./utils/classes";

require('dotenv').config();

export const config: BotConfig = {
    token: process.env.token,
    cookie: process.env.cookie,
    groupId: 5242495,
    permissions: {
        group: {
            all: ["759959415708450837"],
            shout: [""],
            ranking: [""],
            joinrequests: [""],
            user: [""],
        },
        game: {
            all: ["759959415708450837"],
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
    verificationChecks: true,
    lockedRanks: [""],
    whitelistedServers: ["658241441234944021"]
}