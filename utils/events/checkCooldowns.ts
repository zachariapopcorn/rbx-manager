import BotClient from "../classes/BotClient";

export default function checkCooldowns(client: BotClient) {
    for(let i = client.cooldowns.length - 1; i >= 0; i--) {
        if(Date.now() < client.cooldowns[i].cooldownExpires) continue;
        client.cooldowns.splice(i, 1);
    }
    setTimeout(() => {
        checkCooldowns(client);
    }, 5);
}