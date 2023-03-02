import roblox = require('noblox.js');
import * as fs from 'fs/promises';
import axios = require('axios');
import BotClient from '../classes/BotClient';

const axiosClient = axios.default;

async function isUserInGroup(userID: number, groupID: number): Promise<boolean> {
    let res;
    try {
        res = await axiosClient({
            url: `https://groups.roblox.com/v2/users/${userID}/groups/roles`,
            method: "GET"
        });
    } catch(e) {
        console.error(e);
        return true; // Just in case it fails and that person is in the group
    }
    let userData = res.data.data;
    let index = userData.findIndex(data => data.group.id === groupID);
    if(index === -1) return false;
    return true;
}

export default async function checkBans(client: BotClient) {
    try {
        let bannedUsers = (JSON.parse(await fs.readFile(`${process.cwd()}/database/groupbans.json`, "utf-8"))).userIDs;
        for(let i = 0; i < bannedUsers.length; i++) {
            let userID = bannedUsers[i];
            if(await isUserInGroup(userID, client.config.groupId)) {
                await roblox.exile(client.config.groupId, userID);
            }
        }
    } catch(e) {
        console.error(e);
    }
    setTimeout(async() => {
        await checkBans(client);
    }, 10000);
}
