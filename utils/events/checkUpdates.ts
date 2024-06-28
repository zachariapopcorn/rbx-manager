import fs from 'fs';

import BotClient from "../classes/BotClient";

export default async function checkUpdates(client: BotClient) {
    let localVersion = Number(JSON.parse(await fs.promises.readFile(`${process.cwd()}/package.json`, "utf-8")).version.replaceAll(".", ""));
    let remoteVersion = Number((await (await fetch("https://raw.githubusercontent.com/sv-du/rbx-manager/master/package.json")).json()).version.replaceAll(".", ""));
    let oldActivity = client.user.presence.activities[0];
    if(remoteVersion > localVersion) {
        client.setStatusActivity();
        client.onLatestVersion = false;
    } else {
        client.setStatusActivity();
        client.onLatestVersion = true;
    }
    setTimeout(async() => {
        await checkUpdates(client);
    }, 5000);
}