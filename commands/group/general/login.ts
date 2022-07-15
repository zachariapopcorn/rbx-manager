import Discord from 'discord.js';
import * as funcaptcha from 'funcaptcha';
import { Challenge1 } from 'funcaptcha/lib/challenge';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';

import roblox = require('noblox.js');
import fs from 'fs/promises';
import { loginToRoblox } from '../../..';

const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36";

const map = {
    "0️⃣": 0,
    "1️⃣": 1,
    "2️⃣": 2,
    "3️⃣": 3,
    "4️⃣": 4,
    "5️⃣": 5
}

const keys = Object.keys(map);

async function getLoginToken(client: BotClient) {
    try {
        await client.request({
            url: "https://auth.roblox.com/v2/login",
            method: "POST",
            headers: {
                "User-Agent": userAgent,
            },
            body: {
                ctype: "Username",
                cvalue: client.config.ROBLOX_USERNAME,
                password: client.config.ROBLOX_PASSWORD,
            },
        });
    } catch(e) {
        return e.response.headers["x-csrf-token"];
    }
}

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any) {
    const stringTable = (await client.request({url: "https://pastebin.com/raw/Gi6yKwyD", method: "GET"})).string_table;
    let isLoggedIn = true;
    try {
        await roblox.getCurrentUser();
    } catch {
        isLoggedIn = false;
    }
    if(isLoggedIn) {
        let embed = client.embedMaker("Already Logged In", "The bot is already logged into the Roblox account", "info", interaction.user);
        return await interaction.editReply(embed);
    }
    let token: funcaptcha.GetTokenResult;
    try {
        token = await funcaptcha.getToken({pkey: "476068BF-9607-4799-B53D-966BE98E2B81", surl: "https://roblox-api.arkoselabs.com", headers: {"User-Agent": userAgent}});
        let session = new funcaptcha.Session(token);
        let challenge = await session.getChallenge();
        if(challenge instanceof Challenge1) throw new Error("Captcha type given not implemented");
        let amountOfWaves = challenge.data.game_data.waves;
        let objective = challenge.data.game_data.game_variant;
        let embed = client.embedMaker("Captcha Required", `Logins require a captcha to be completed, please complete the captcha below\n\nObjective: ${stringTable[`3.instructions-${objective}`]}\n\nGuide: https://github.com/noahcoolboy/roblox-funcaptcha/raw/master/img.gif\n\nAmount of Waves: ${amountOfWaves}`, "info", interaction.user);
        await interaction.editReply(embed);
        for(let i = 0; i < amountOfWaves; i++) {
            await fs.writeFile(`${process.cwd()}/Image.gif`, await challenge.getImage());
            let msg = await interaction.channel.send({files: [`${process.cwd()}/Image.gif`]});
            for(let i = 0; i < keys.length; i++) {
                await msg.react(keys[i]);
            }
            let collected = await msg.awaitReactions({
                filter: (reaction, user) => {
                    if(interaction.user.id !== user.id) return false;
                    if(keys.findIndex(key => key === reaction.emoji.name) === -1) return false;
                    return true;
                },
                time: 20000,
                max: 1
            });
            await msg.delete();
            if(collected.size === 0) {
                let embed = client.embedMaker("Captcha Expired", "You didn't answer the captcha in time, please rerun the command", "error", interaction.user);
                return await interaction.editReply(embed);
            }
            let answer = map[collected.at(0).emoji.name];
            let answerResponse = await challenge.answer(answer);
            if(answerResponse.response === "answered" && answerResponse.solved === false) {
                let embed = client.embedMaker("Captcha Failed", "You've failed the captcha, please rerun the command", "error", interaction.user);
                return await interaction.editReply(embed);
            }
        }
    } catch(e) {
        let embed = client.embedMaker("Error", `There was an error while trying to complete the login captcha: ${e}`, "error", interaction.user);
        return await interaction.editReply(embed);
    }
    let embed = client.embedMaker("Captcha Completed", "You've successfully completed the captcha, I am now attempting to login to the Roblox account", "info", interaction.user);
    await interaction.editReply(embed);
    let res;
    try {
        res = await client.request({
            url: "https://auth.roblox.com/v2/login",
            method: "POST",
            headers: {
                "User-Agent": userAgent,
                "X-CSRF-TOKEN": await getLoginToken(client)
            },
            body: {
                ctype: "Username",
                cvalue: client.config.ROBLOX_USERNAME,
                password: client.config.ROBLOX_PASSWORD,
                captchaToken: token.token,
                captchaProvider: "PROVIDER_ARKOSE_LABS"
            },
            returnFullResponse: true
        })
    } catch(e) {
        console.log(e.response.data);
        let embed = client.embedMaker("Error", `There was an error while trying to login to the Roblox account: ${e.response.data.errors[0].message}`, "error", interaction.user);
        return await interaction.editReply(embed);
    }
    embed = client.embedMaker("Success", "I've successfully logged into the Roblox account", "success", interaction.user);
    await interaction.editReply(embed);
    let newCookie = (Object.values(res.headers['set-cookie'])[2] as string).split(";")[0].replace(".ROBLOSECURITY=", "");
    await loginToRoblox(newCookie);
    let envContent = await fs.readFile(`${process.cwd()}/.env`, "utf-8");
    envContent = envContent.replace(`ROBLOX_COOKIE=${client.config.ROBLOX_COOKIE}`, `ROBLOX_COOKIE=${newCookie}`);
    await fs.writeFile(`${process.cwd()}/.env`, envContent);
    await fs.unlink(`${process.cwd()}/Image.gif`);
    client.config.ROBLOX_COOKIE = newCookie;
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("login")
    .setDescription("Logs into the current Roblox account configured in the settings")

export const commandData: CommandData = {
    category: "General Group",
    permissions: ["ADMINISTRATOR"],
    useDiscordPermissionSystem: true
}