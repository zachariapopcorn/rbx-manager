import roblox = require('noblox.js');

import BotClient from '../classes/BotClient';

export default async function checkLoginStatus(client: BotClient) {
    try {
        await roblox.getCurrentUser();
        client.user.setActivity("Logged Into Roblox? ✅");
        client.isLoggedIn = true;
    } catch(e) {
        client.user.setActivity("Logged Into Roblox? ❌");
        client.isLoggedIn = false;
    }
    setTimeout(async() => {
        await checkLoginStatus(client);
    }, 10000);
}