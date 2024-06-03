import roblox = require('noblox.js');

import ModerationData from '../interfaces/ModerationData';

import config from '../../config';

interface GetModerationDataResponse {
    data: ModerationData,
    err?: string
}

export default class RobloxDatastore {
    public static async getModerationData(universeID: number, userID: number): Promise<GetModerationDataResponse> {
        let userData: ModerationData;
        try {
            userData = (await roblox.getDatastoreEntry(universeID, config.datastoreName, `${userID}-moderationData`)).data;
        } catch(e) {
            let err = e.toString() as string;
            if(!err.includes("NOT_FOUND")) return {data: undefined, err: err};
            userData = {
                banData: {
                    isBanned: false,
                    reason: ""
                },
                muteData: {
                    isMuted: false,
                    reason: ""
                },
                warns: []
            }
        }
        return {data: userData};
    }
    public static async setModerationData(universeID: number, userID: number, moderationData: ModerationData) {
        await roblox.setDatastoreEntry(universeID, config.datastoreName, `${userID}-moderationData`, moderationData);
    }
}