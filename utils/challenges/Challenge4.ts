import Discord from 'discord.js';

import { Challenge4 } from 'funcaptcha/lib/challenge';

import fs from "fs";

import BotClient from '../../utils/classes/BotClient';

import SolvedCaptchaResult from '../interfaces/SolvedCaptchaResult';

function getInstruction(challenge: Challenge4) {
    let instructionString = (challenge.data.game_data as any).instruction_string;
    let instruction = challenge.data.string_table[`4.instructions-${instructionString}`];
    instruction = instruction.replaceAll("<strong>", "");
    instruction = instruction.replaceAll("</strong>", "");
    return instruction;
}

export default async function solveChallenge4(interaction: Discord.CommandInteraction, client: BotClient, challenge: Challenge4): Promise<SolvedCaptchaResult> {
    try {
        let amountOfWaves = challenge.data.game_data.waves;
        let embed = client.embedMaker({title: "Captcha Required", description: `Logins require a captcha to be completed, please complete the captcha below\n\nObjective: ${getInstruction(challenge)}\n\nGuide: https://i.imgur.com/05OYegq.png\n\nAmount of Waves: ${amountOfWaves}\n\nTo answer, type the # tile that the answer is in`, type: "info", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        for(let i = 0; i < amountOfWaves; i++) {
            await fs.promises.writeFile(`${process.cwd()}/Image.gif`, await challenge.getImage());
            let msg = await (interaction.channel as Discord.TextChannel).send({files: [`${process.cwd()}/Image.gif`]});
            let collected = await interaction.channel.awaitMessages({
                filter: (message: Discord.Message) => {
                    if(message.author.id !== interaction.user.id) return false;
                    return true;
                },
                time: client.config.collectorTime,
                max: 1
            });
            await msg.delete();
            if(collected.size === 0) {
                let embed = client.embedMaker({title: "Captcha Expired", description: "You didn't answer the captcha in time, please rerun the command", type: "error", author: interaction.user});
                await interaction.editReply({embeds: [embed]});
                return {success: false, error: "CE"};
            }
            try {
                await collected.at(0).delete();
            } catch {}
            let answer = Number(collected.at(0).content);
            if(isNaN(answer)) {
                return {success: false, error: "Invalid answer received"};
            }
            let answerResponse = await challenge.answer(answer);
            if(answerResponse.response === "answered" && answerResponse.solved === false) {
                let embed = client.embedMaker({title: "Captcha Failed", description: "You've failed the captcha, please rerun the command", type: "error", author: interaction.user});
                await interaction.editReply({embeds: [embed]});
                return {success: false, error: "CF"};
            }
        }
        return {success: true};
    } catch(e) {
        return {success: false, error: e};
    }
}