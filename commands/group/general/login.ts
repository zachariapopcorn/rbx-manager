import Discord from 'discord.js';

import * as funcaptcha from "funcaptcha";
import { Challenge1, Challenge3, Challenge4 } from 'funcaptcha/lib/challenge';

import fs from "fs";

import { loginToRoblox } from '../../..';
import { envValues } from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import BetterConsole from '../../../utils/classes/BetterConsole';

import CommandFile from '../../../utils/interfaces/CommandFile';
import InitialCaptchaMetadata from '../../../utils/interfaces/InitialCaptchaMetadata';
import SolvedCaptchaResult from '../../../utils/interfaces/SolvedCaptchaResult';

import solveChallenge1 from '../../../utils/challenges/Challenge1';
import solveChallenge3 from '../../../utils/challenges/Challenge3';
import solveChallenge4 from '../../../utils/challenges/Challenge4';

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0";

function timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getENVString(): string {
    let formatted = "";
    for(let i = 0; i < envValues.length; i++) {
        formatted += `${envValues[i]}=${process.env[envValues[i]]}\n`;
    }
    return formatted;
}

async function login(client: BotClient, username: string, password: string, csrfToken?: string, challengeId?: string, unifiedCaptchaId?: string, captchaToken?: string, challengeType?: string) {
    let headers = {
        "Content-Type": "application/json",
        "User-Agent": UA,
        "Origin": "https://www.roblox.com",
        "Referer": "https://www.roblox.com/",
        "Host": "auth.roblox.com"
    }
    if(csrfToken) {
        headers["X-CSRF-TOKEN"] = csrfToken;
    }
    if(challengeId) {
        headers["rblx-challenge-id"] = challengeId;
        let metaData = JSON.stringify({
            "unifiedCaptchaId": unifiedCaptchaId,
            "captchaToken": captchaToken,
            "actionType": "Login"
        });
        headers["rblx-challenge-metadata"] = Buffer.from(metaData, "utf-8").toString("base64");
        headers["rblx-challenge-type"] = challengeType;
    }
    return await client.request({
        url: "https://auth.roblox.com/v2/login",
        method: "POST",
        headers: headers,
        body: {
            "ctype": "Username",
			"cvalue": username,
			"password": password
        },
        robloxRequest: false
    });
}

export const captchaModal = new Discord.ModalBuilder().setCustomId("captchaModal").setTitle("Answer Prompt")
.addComponents(new Discord.ActionRowBuilder<Discord.ModalActionRowComponentBuilder>().addComponents(
    new Discord.TextInputBuilder().setCustomId("answer").setLabel("Answer").setStyle(Discord.TextInputStyle.Short)
))

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
            BetterConsole.log(body);
            let embed = client.embedMaker({title: "Error", description: "A captcha wasn't provided for some reason", type: "error", author: interaction.user});
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
                surl: "https://client-api.arkoselabs.com",
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
            if(!captchaData.token.includes("sup=1")) { // If not suppressed captcha
                let session = new funcaptcha.Session(captchaData, {
                    userAgent: UA
                });
                let challenge = await session.getChallenge();
                let res: SolvedCaptchaResult;
                if(challenge instanceof Challenge1) {
                    BetterConsole.log(`Captcha type given: 1`);
                    res = await solveChallenge1(interaction, client, challenge);
                } else if(challenge instanceof Challenge3) {
                    BetterConsole.log(`Captcha type given: 3`);
                    res = await solveChallenge3(interaction, client, challenge);
                } else if(challenge instanceof Challenge4) {
                    BetterConsole.log(`Captcha type given: 4`);
                    res = await solveChallenge4(interaction, client, challenge);
                }
                if(res.success) {
                    captchaToken = captchaData.token;
                } else {
                    if(res.error !== "CE" && res.error !== "CF") {
                        throw new Error(res.error);
                    }
                    return;
                }
            } else {
                captchaToken = captchaData.token;
            }
        } catch(e) {
            BetterConsole.log(e);
            if(e.toString() !== "Error: test") {
                let embed = client.embedMaker({title: "Error", description: `There was an error while trying to complete the login captcha: ${e}`, type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
            return;
        }
        let embed = client.embedMaker({title: "Captcha Completed", description: "You've successfully completed the captcha, I am now attempting to login to the Roblox account", type: "info", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        try { await fs.promises.unlink(`${process.cwd()}/Image.gif`); } catch {};
        let continueBody = {
            challengeId: rblxChallengeId,
            challengeMetadata: JSON.stringify({
                "unifiedCaptchaId": rblxChallengeMetadata.unifiedCaptchaId,
                "captchaToken": captchaToken,
                "actionType": "Login"
            }),
            challengeType: "captcha"
        }
        res = await client.request({
            url: "https://apis.roblox.com/challenge/v1/continue",
            method: "POST",
            headers: {
                "Accept": "application/json, text/plain, */*",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "en-US,en;q=0.5",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Length": JSON.stringify(continueBody).length,
                "Content-Type": "application/json;charset=utf-8",
                "DNT": 1,
                "Host": "apis.roblox.com",
                "Origin": "https://www.roblox.com",
                "Pragma": "no-cache",
                "Referer": "https://www.roblox.com/",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-site",
                "Sec-GPC": 1,
                "TE": "trailers",
                "User-Agent": UA,
                "X-CSRF-TOKEN": csrfToken
            },
            body: continueBody,
            robloxRequest: false
        });
        BetterConsole.log(await res.json());
        res = await login(client, client.config.ROBLOX_USERNAME, client.config.ROBLOX_PASSWORD, csrfToken, rblxChallengeId, rblxChallengeMetadata.unifiedCaptchaId, captchaToken, rblxChallengeType);
        let rawCookie = res.headers.get("set-cookie");
        if(!rawCookie) {
            let embed = client.embedMaker({title: "Error", description: `There was an error while trying to login to the Roblox account: ${(await res.json()).errors[0].message}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        if(!rawCookie.includes("ROBLOSECURITY")) {
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
            let mfaCode = (await (interaction.channel as Discord.TextChannel).awaitMessages({
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
            if(!rawCookie.includes("ROBLOSECURITY")) {
                let embed = client.embedMaker({title: "Error", description: `There was an error while trying to login to the Roblox account: ${(await res.json()).errors[0].message}`, type: "error", author: interaction.user});
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
        isEphemeral: false,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
}

export default command;
