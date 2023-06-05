import Discord from 'discord.js';

import { Challenge1 } from 'funcaptcha/lib/challenge';

import fs from "fs";

import BotClient from '../../utils/classes/BotClient';
import BetterConsole from '../../utils/classes/BetterConsole';

import SolvedCaptchaResult from '../interfaces/SolvedCaptchaResult';

const map = {
    "0️⃣": 0,
    "1️⃣": 1,
    "2️⃣": 2,
    "3️⃣": 3,
    "4️⃣": 4,
    "5️⃣": 5
}

const keys = Object.keys(map);

export default async function solveChallenge1(interaction: Discord.CommandInteraction, client: BotClient, challenge: Challenge1): Promise<SolvedCaptchaResult> {
    return {success: false, error: "Captcha type given not implemented"};
}