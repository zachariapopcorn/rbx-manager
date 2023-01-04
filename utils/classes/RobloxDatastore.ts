import axios = require('axios');
import BotConfig from '../interfaces/BotConfig';
import ModerationData from '../interfaces/ModerationData';

export default class RobloxDatastore {
    private API_KEY: string;
    private config: BotConfig;
    constructor(config: BotConfig) {
        this.config = config;
        this.API_KEY = config.ROBLOX_API_KEY;
    }
    public async request(requestOptions: {url: string, method: axios.Method, headers: any, body: any}) : Promise<any> {
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
                headers: requestOptions.headers,
                data: requestOptions.body
            })
        } catch(e) {
            throw e;
        }
        return responseData.data;
    }
    public async getAsync(datastoreName: string, entryKey: string, scope?: string): Promise<any> {
        if(!scope) scope = "global";
        let response = await this.request({
            url: `https://apis.roblox.com/datastores/v1/universes/${this.config.universeId}/standard-datastores/datastore/entries/entry?datastoreName=${datastoreName}&scope=${scope}&entryKey=${entryKey}`,
            method: "GET",
            headers: {"Content-Type": "application/json"},
            body: {}
        });
        return response;
    }
    public async removeAsync(datastoreName: string, entryKey: string, scope?: string): Promise<any> {
        if(!scope) scope = "global";
        let response = await this.request({
            url: `https://apis.roblox.com/datastores/v1/universes/${this.config.universeId}/standard-datastores/datastore/entries/entry?datastoreName=${datastoreName}&scope=${scope}&entryKey=${entryKey}`,
            method: "DELETE",
            headers: {"Content-Type": "application/json"},
            body: {}
        });
        return response;
    }
    public async getModerationData(userID: number): Promise<ModerationData> {
        let response = await this.getAsync(this.config.datastoreName, `${userID}-moderationData`);
        return response;
    }
    public async setModerationData(userID: number, moderationData: ModerationData) {
        await this.request({
            url: `https://apis.roblox.com/datastores/v1/universes/${this.config.universeId}/standard-datastores/datastore/entries/entry?datastoreName=${this.config.datastoreName}&entryKey=${userID}-moderationData`,
            method: "POST",
            headers: {
                "content-md5": require('crypto').createHash('md5').update(JSON.stringify(moderationData)).digest('base64')
            },
            body: moderationData
        });
    }
}