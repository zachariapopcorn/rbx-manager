import Discord from 'discord.js';
import roblox = require('noblox.js');
import BotClient from '../classes/BotClient';
import SalesLog from '../interfaces/SaleLog';

let oldDate;

async function getSales(client: BotClient, groupID: number): Promise<SalesLog[]> {
    let res = await fetch(`https://economy.roblox.com/v2/groups/${groupID}/transactions?cursor=&limit=100&transactionType=Sale`, {
        headers: {
            "Cookie": `.ROBLOSECURITY=${client.config.ROBLOX_COOKIE}`
        }
    });
    let json = await res.json();
    if(json.data) {
        let sales = json.data as SalesLog[];
        for(let i = 0; i < sales.length; i++) {
            sales[i].created = new Date(sales[i].created);
        }
        return sales;
    }
}

export default async function checkSales(client: BotClient) {
    if(client.config.logging.sales.enabled === false) return;
    try {
        let sales = await getSales(client, client.config.groupId);
        if(!oldDate) oldDate = sales[0].created;
        let index = sales.findIndex(log => log.created.toISOString() === oldDate.toISOString());
        if(index === 0 || index === -1) throw("Skip check");
        for(let i = index - 1; i >= 0; i--) {
            let log = sales[i];
            let channel = await client.channels.fetch(client.config.logging.sales.loggingChannel) as Discord.TextChannel;
            if(channel) {
                let embed = client.embedMaker({title: "New Sale", description: `**${log.agent.name}** has bought **${log.details.name}** for **${log.currency.amount}** robux after tax`, type: "info", author: client.user});
                await channel.send({embeds: [embed]});
            }
        }
        oldDate = sales[0].created;
    } catch(e) {
        if(e !== "Skip check") {
            console.error(`There was an error while trying to check the sale logs: ${e}`);
        }
    }
    setTimeout(async() => {
        await checkSales(client);
    }, 5000);
}