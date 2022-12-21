import axios = require('axios');

export default interface RequestOptions {
    url: string,
    method: axios.Method,
    headers: any,
    body: any,
    robloxRequest: boolean
}