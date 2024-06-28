import roblox = require('noblox.js');

import BotClient from '../classes/BotClient';

export default async function checkLoginStatus(client: BotClient) {
    try {
        await roblox.getCurrentUser();
        client.setStatusActivity();
        client.isLoggedIn = true;
    } catch(e) {
        client.setStatusActivity();
        client.isLoggedIn = false;
    }
    setTimeout(async() => {
        await checkLoginStatus(client);
    }, 10000);
}