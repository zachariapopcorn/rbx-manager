import roblox = require('noblox.js');
import BotClient from '../classes/BotClient';
import SuspensionFile from '../interfaces/SuspensionFile';
import fs from "fs/promises"

export default async function checkSuspensions(client: BotClient) {
    let suspensions = JSON.parse(await fs.readFile(`${process.cwd()}/database/suspensions.json`, "utf-8")) as SuspensionFile;
    for(let i = suspensions.users.length - 1; i >= 0; i--) {
        if(Date.now() <= suspensions.users[i].timeToRelease) continue;
        try {
            await roblox.setRank(client.config.groupId, suspensions.users[i].userId, suspensions.users[i].oldRoleID);
        } catch(e) {
            console.error(`There was an error while trying to rerank ${await roblox.getUsernameFromId(suspensions.users[i].userId)}: ${e}`);
        }
        suspensions.users.splice(i, 1)
    }
    await fs.writeFile(`${process.cwd()}/database/suspensions.json`, JSON.stringify(suspensions));
    setTimeout(async() => {
        await checkSuspensions(client);
    }, 15000);
}