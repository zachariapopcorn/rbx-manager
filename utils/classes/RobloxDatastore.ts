import roblox = require('noblox.js');

import BotConfig from '../interfaces/BotConfig';
import ModerationData from '../interfaces/ModerationData';


export default class RobloxDatastore {
    private config: BotConfig;
    constructor(config: BotConfig) {
        this.config = config;
    }
    public async getModerationData(universeID: number, userID: number): Promise<ModerationData> {
        let response = await roblox.getDatastoreEntry(universeID, this.config.datastoreName, `${userID}-moderationData`);
        return response.data;
    }
    public async setModerationData(universeID: number, userID: number, moderationData: ModerationData) {
        await roblox.setDatastoreEntry(universeID, this.config.datastoreName, `${userID}-moderationData`, moderationData);
    }
}