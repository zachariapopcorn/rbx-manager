import BotConfig from "../interfaces/BotConfig";
import RobloxRequestType from '../interfaces/RobloxRequestType';
import BotClient from "./BotClient";

export default class MessagingService extends BotClient {
    private API_KEY: string;
    constructor(config: BotConfig) {
        super(config);
        this.API_KEY = config.ROBLOX_API_KEY;
    }
    public async sendMessage(universeID: number, type: RobloxRequestType, payload: any) {
        await this.request({
            url: `https://apis.roblox.com/messaging-service/v1/universes/${universeID}/topics/DiscordModerationSystemCall`,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": this.API_KEY
            },
            body: {
                message: JSON.stringify({type: type, payload: payload})
            },
            robloxRequest: false
        });
    }
}