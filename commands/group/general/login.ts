import Discord from 'discord.js';
import roblox from 'noblox.js';

import BotClient from '../../../utils/classes/BotClient';
import CommandFile from '../../../utils/interfaces/CommandFile';

import * as funcaptcha from "funcaptcha";
import { Challenge1 } from 'funcaptcha/lib/challenge';

import fs from "fs";

import { loginToRoblox } from '../../..';

const map = {
    "0️⃣": 0,
    "1️⃣": 1,
    "2️⃣": 2,
    "3️⃣": 3,
    "4️⃣": 4,
    "5️⃣": 5
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/111.0";

const keys = Object.keys(map);

function timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function login(client: BotClient, username: string, password: string, csrfToken?: string, captchaId?: string, captchaToken?: string) {
    return await client.request({
        url: "https://auth.roblox.com/v2/login",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
			"User-Agent": UA,
			"X-CSRF-TOKEN": csrfToken || "",
        },
        body: {
            "ctype": "Username",
			"cvalue": username,
			"password": password,
			"captchaId": captchaId || "",
			"captchaToken": captchaToken || ""
        },
        robloxRequest: false
    });
}

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction, client: BotClient, args: any): Promise<any> => {
        let isLoggedIn = true;
        try {
            await roblox.getCurrentUser();
        } catch {
            isLoggedIn = false;
        }
        if(isLoggedIn) {
            let embed = client.embedMaker({title: "Already Logged In", description: "The bot is already logged into the bot account, no need to login again", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        const stringTable = (await (await client.request({url: "https://pastebin.com/raw/Gi6yKwyD", method: "GET", headers: {}, body: undefined, robloxRequest: false})).json()).string_table;
        let res = await login(client, client.config.ROBLOX_USERNAME, client.config.ROBLOX_PASSWORD);
        let csrfToken = res.headers.get("x-csrf-token");
        res = await login(client, client.config.ROBLOX_USERNAME, client.config.ROBLOX_PASSWORD, csrfToken);
        let fieldData = (await res.json()).errors[0].fieldData;
        if(!fieldData) {
            let embed = client.embedMaker({title: "Error", description: "A captcha wasn't provided for some reason. The full body has been logged to the console", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let cID = fieldData.unifiedCaptchaId;
        let cToken;
        try {
            let dataBlob = fieldData.dxBlob;
            await timeout(5000);
            let captchaToken = await funcaptcha.getToken({
                pkey: "476068BF-9607-4799-B53D-966BE98E2B81",
                data: {
                    blob: dataBlob
                },
                headers: {
                    "user-agent": UA
                },
                site: "https://www.roblox.com",
                location: "https://www.roblox.com"
            });
            console.log(captchaToken);
            if(!captchaToken.token) {
                let embed = client.embedMaker({title: "Captcha Implementation Broken", description: "The captcha implementation is currently broken. Please wait for a fix", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
            let session = new funcaptcha.Session(captchaToken, {
                userAgent: UA
            });
            let challenge = await session.getChallenge();
            if(challenge instanceof Challenge1) throw new Error("Captcha type given not implemented");
            let amountOfWaves = challenge.data.game_data.waves;
            let objective = challenge.data.game_data.game_variant;
            let embed = client.embedMaker({title: "Captcha Required", description: `Logins require a captcha to be completed, please complete the captcha below\n\nObjective: ${stringTable[`3.instructions-${objective}`]}\n\nGuide: https://github.com/noahcoolboy/roblox-funcaptcha/raw/master/img.gif\n\nAmount of Waves: ${amountOfWaves}`, type: "info", author: interaction.user});
            await interaction.editReply({embeds: [embed]});
            for(let i = 0; i < amountOfWaves; i++) {
                await fs.promises.writeFile(`${process.cwd()}/Image.gif`, await challenge.getImage());
                let msg = await (interaction.channel as Discord.TextChannel).send({files: [`${process.cwd()}/Image.gif`]});
                for(let i = 0; i < keys.length; i++) {
                    await msg.react(keys[i]);
                }
                let collected = await msg.awaitReactions({
                    filter: (reaction, user) => {
                        if(interaction.user.id !== user.id) return false;
                        if(keys.findIndex(key => key === reaction.emoji.name) === -1) return false;
                        return true;
                    },
                    time: client.config.collectorTime,
                    max: 1
                });
                await msg.delete();
                if(collected.size === 0) {
                    let embed = client.embedMaker({title: "Captcha Expired", description: "You didn't answer the captcha in time, please rerun the command", type: "error", author: interaction.user});
                    return await interaction.editReply({embeds: [embed]});
                }
                let answer = map[collected.at(0).emoji.name];
                let answerResponse = await challenge.answer(answer);
                if(answerResponse.response === "answered" && answerResponse.solved === false) {
                    let embed = client.embedMaker({title: "Captcha Failed", description: "You've failed the captcha, please rerun the command", type: "error", author: interaction.user});
                    return await interaction.editReply({embeds: [embed]});
                }
            }
            cToken = captchaToken.token;
        } catch(e) {
            console.log(e);
            let embed = client.embedMaker({title: "Error", description: `There was an error while trying to complete the login captcha: ${e}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let embed = client.embedMaker({title: "Captcha Completed", description: "You've successfully completed the captcha, I am now attempting to login to the Roblox account", type: "info", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        res = await login(client, client.config.ROBLOX_USERNAME, client.config.ROBLOX_PASSWORD, csrfToken, cID, cToken);
        let rawCookie = res.headers.get("set-cookie");
        if(!rawCookie) {
            let embed = client.embedMaker({title: "Error", description: `There was an error while trying to login to the Roblox account: ${(await res.json()).errors[0].message}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        embed = client.embedMaker({title: "Success", description: "I've successfully logged into the Roblox account", type: "success", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        let newCookie = (Object.values(rawCookie)[2] as string).split(";")[0].replace(".ROBLOSECURITY=", "");
        await loginToRoblox(newCookie);
        let envContent = await fs.promises.readFile(`${process.cwd()}/.env`, "utf-8");
        envContent = envContent.replace(`ROBLOX_COOKIE=${client.config.ROBLOX_COOKIE}`, `ROBLOX_COOKIE=${newCookie}`);
        await fs.promises.writeFile(`${process.cwd()}/.env`, envContent);
        await fs.promises.unlink(`${process.cwd()}/Image.gif`);
        client.config.ROBLOX_COOKIE = newCookie;
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("login")
    .setDescription("Logs the bot into the configured bot account"),
    commandData: {
        category: "General Group",
    }
}

export default command;