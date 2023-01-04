import axios = require('axios');
import BotConfig from "./BotConfig";
import RobloxRequestType from '../interfaces/RobloxRequestType';

export class MessagingService {
    private API_KEY: string;
    private config: BotConfig;
    constructor(config: BotConfig) {
        this.config = config;
        this.API_KEY = config.ROBLOX_API_KEY;
    }
    public async request(requestOptions: {url: string, method?: axios.Method, headers?: any, body?: any}) : Promise<any> {
        const axiosClient = axios.default;
        let responseData: axios.AxiosResponse;
        requestOptions.headers = {
            "x-api-key": this.API_KEY,
            ...requestOptions.headers
        }
        try {
            responseData = await axiosClient({
                url: requestOptions.url,
                method: requestOptions.method || "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...requestOptions.headers || {}
                },
                data: requestOptions.body || {}
            })
        } catch(e) {
            throw e;
        }
        return responseData.data;
    }
    public async sendMessage(type: RobloxRequestType, payload: any) {
        await this.request({
            url: `https://apis.roblox.com/messaging-service/v1/universes/${this.config.universeId}/topics/DiscordModerationSystemCall`,
            method: "POST",
            body: {
                message: JSON.stringify({type: type, payload: payload})
            }
        });
    }
}