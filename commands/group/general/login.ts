import Discord from 'discord.js';

import * as funcaptcha from "funcaptcha";
import { Challenge1 } from 'funcaptcha/lib/challenge';

import fs from "fs";

import { loginToRoblox } from '../../..';

import BotClient from '../../../utils/classes/BotClient';
import BetterConsole from '../../../utils/classes/BetterConsole';

import CommandFile from '../../../utils/interfaces/CommandFile';
import InitialCaptchaMetadata from '../../../utils/interfaces/InitialCaptchaMetadata';

const map = {
    "0️⃣": 0,
    "1️⃣": 1,
    "2️⃣": 2,
    "3️⃣": 3,
    "4️⃣": 4,
    "5️⃣": 5
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36";

const keys = Object.keys(map);

function timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getENVString(): string {
    const values = ["DISCORD_TOKEN", "ROBLOX_USERNAME", "ROBLOX_PASSWORD", "ROBLOX_COOKIE", "ROBLOX_API_KEY", "ROVER_API_KEY", "WEB_API_KEY"];
    let formatted = "";
    for(let i = 0; i < values.length; i++) {
        formatted += `${values[i]}=${process.env[values[i]]}\n`;
    }
    return formatted;
}

async function login(client: BotClient, username: string, password: string, csrfToken?: string, challengeId?: string, unifiedCaptchaId?: string, captchaToken?: string, challengeType?: string) {
    let metaData = JSON.stringify({
        "unifiedCaptchaId": unifiedCaptchaId,
        "captchaToken": captchaToken,
        "actionType": "Login"
    });
    return await client.request({
        url: "https://auth.roblox.com/v2/login",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
			"User-Agent": UA,
			"X-CSRF-TOKEN": csrfToken || "",
            "rblx-challenge-id": challengeId || "",
            "rblx-challenge-metadata": Buffer.from(metaData, "utf-8").toString("base64"),
            "rblx-challenge-type": challengeType || ""
        },
        body: {
            "ctype": "Username",
			"cvalue": username,
			"password": password
        },
        robloxRequest: false
    });
}

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction, client: BotClient, args: any): Promise<any> => {
        if(client.isLoggedIn) {
            let embed = client.embedMaker({title: "Already Logged In", description: "The bot is already logged into the bot account, no need to login again", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let res = await login(client, client.config.ROBLOX_USERNAME, client.config.ROBLOX_PASSWORD);
        let csrfToken = res.headers.get("x-csrf-token");
        res = await login(client, client.config.ROBLOX_USERNAME, client.config.ROBLOX_PASSWORD, csrfToken);
        let body = await res.json();
        let error = body.errors[0].message;
        if(error !== "Challenge is required to authorize the request") {
            BetterConsole.log(body.toString());
            let embed = client.embedMaker({title: "Error", description: "A captcha wasn't provided for some reason. The full body has been logged to the console", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let rblxChallengeId = res.headers.get("rblx-challenge-id");
        let rblxChallengeMetadata = JSON.parse(Buffer.from(res.headers.get("rblx-challenge-metadata"), "base64").toString()) as InitialCaptchaMetadata;
        let rblxChallengeType = res.headers.get("rblx-challenge-type");
        let dataBlob = rblxChallengeMetadata.dataExchangeBlob;
        let captchaToken: string;
        try {
            await timeout(5000);
            let captchaData = await funcaptcha.getToken({
                pkey: "476068BF-9607-4799-B53D-966BE98E2B81",
                surl: "https://roblox-api.arkoselabs.com",
                data: {
                    "blob": dataBlob,
                },
                headers: {
                    "User-Agent": UA,
                },
                site: "https://www.roblox.com",
                location: "https://www.roblox.com/login"
            });
            if(!captchaData.token) {
                BetterConsole.log(captchaToken);
                let embed = client.embedMaker({title: "Captcha Implementation Broken", description: "The captcha implementation is currently broken. Please wait for a fix", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
            let session = new funcaptcha.Session(captchaData, {
                userAgent: UA
            });
            let challenge = await session.getChallenge();
            if(challenge instanceof Challenge1) throw new Error("Captcha type given not implemented");
            let amountOfWaves = challenge.data.game_data.waves;
            let objective = challenge.data.game_data.game_variant;
            let embed = client.embedMaker({title: "Captcha Required", description: `Logins require a captcha to be completed, please complete the captcha below\n\nObjective: ${challenge.data.string_table[`3.instructions-${objective}`]}\n\nGuide: https://github.com/noahcoolboy/roblox-funcaptcha/raw/master/img.gif\n\nAmount of Waves: ${amountOfWaves}`, type: "info", author: interaction.user});
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
            captchaToken = captchaData.token;
        } catch(e) {
            BetterConsole.log(e);
            let embed = client.embedMaker({title: "Error", description: `There was an error while trying to complete the login captcha: ${e}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let embed = client.embedMaker({title: "Captcha Completed", description: "You've successfully completed the captcha, I am now attempting to login to the Roblox account", type: "info", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        await fs.promises.unlink(`${process.cwd()}/Image.gif`);
        res = await login(client, client.config.ROBLOX_USERNAME, client.config.ROBLOX_PASSWORD, csrfToken, rblxChallengeId, rblxChallengeMetadata.unifiedCaptchaId, captchaToken, rblxChallengeType);
        let rawCookie = res.headers.get("set-cookie");
        if(!rawCookie) {
            let embed = client.embedMaker({title: "Error", description: `There was an error while trying to login to the Roblox account: ${(await res.json()).errors[0].message}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        if(rawCookie.indexOf("ROBLOSECURITY") === -1) {
            let body = await res.json();
            if(!body.twoStepVerificationData) {
                let embed = client.embedMaker({title: "Error", description: `There was an error while trying to login to the Roblox account: ${body.errors[0].message}`, type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
            let userID = body.user.id; 
            let mediaType = body.twoStepVerificationData.mediaType.toLowerCase();
            let challengeId = body.twoStepVerificationData.ticket;
            let embed = client.embedMaker({title: "Two Step Verification", description: `Roblox has prompted a two step verification challenge. Please enter the code from your ${mediaType}`, type: "info", author: interaction.user});
            await interaction.editReply({embeds: [embed]});
            let mfaCode = (await interaction.channel.awaitMessages({
                filter: (message) => {
                    return message.author.id === interaction.user.id;
                },
                max: 1
            })).at(0).content;
            res = await client.request({
                url: `https://twostepverification.roblox.com/v1/users/${userID}/challenges/${mediaType}/verify`,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": UA,
                    "X-CSRF-TOKEN": csrfToken
                },
                body: {
                    "actionType": "Login",
                    "challengeId": challengeId,
                    "code": mfaCode
                },
                robloxRequest: false
            });
            body = await res.json();
            let verificationToken = body.verificationToken;
            if(!verificationToken) {
                let embed = client.embedMaker({title: "Invalid Code", description: "You inputted an invalid code, please rerun the command", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
            res = await client.request({
                url: `https://auth.roblox.com/v3/users/${userID}/two-step-verification/login`,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": UA,
                    "X-CSRF-TOKEN": csrfToken
                },
                body: {
                    "challengeId": challengeId,
                    "rememberDevice": true,
                    "verificationToken": verificationToken
                },
                robloxRequest: false
            });
            rawCookie = res.headers.get("set-cookie");
            if(rawCookie.indexOf("ROBLOSECURITY") === -1) {
                let embed = client.embedMaker({title: "Error", description: `There was an error while trying to login to the Roblox account: ${body.errors[0].message}`, type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
        }
        embed = client.embedMaker({title: "Success", description: "I've successfully logged into the Roblox account", type: "success", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        let newCookie = rawCookie.split(" ").find(v => v.startsWith(".ROBLOSECURITY=")).replace(".ROBLOSECURITY=", "");
        newCookie = newCookie.substring(0, newCookie.length - 1);
        await loginToRoblox(newCookie);
        let envContent = getENVString();
        envContent = envContent.replace(`ROBLOX_COOKIE=${client.config.ROBLOX_COOKIE}`, `ROBLOX_COOKIE=${newCookie}`);
        await fs.promises.writeFile(`${process.cwd()}/.env`, envContent);
        client.config.ROBLOX_COOKIE = newCookie;
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("login")
    .setDescription("Logs the bot into the configured bot account"),
    commandData: {
        category: "General Group",
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
}

export default command;