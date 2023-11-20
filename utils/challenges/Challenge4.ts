import Discord from 'discord.js';

import { Challenge4 } from 'funcaptcha/lib/challenge';

import fs from "fs";

import BotClient from '../../utils/classes/BotClient';

import SolvedCaptchaResult from '../interfaces/SolvedCaptchaResult';

import { captchaModal } from '../../commands/group/general/login';

function getInstruction(challenge: Challenge4) {
    let instructionString = (challenge.data.game_data as any).instruction_string;
    let instruction = challenge.data.string_table[`4.instructions-${instructionString}`];
    instruction = instruction.replaceAll("<strong>", "");
    instruction = instruction.replaceAll("</strong>", "");
    return instruction;
}

export default async function solveChallenge4(interaction: Discord.CommandInteraction, client: BotClient, challenge: Challenge4): Promise<SolvedCaptchaResult> {
    const buttonFilter = (buttonInteraction: Discord.Interaction) => buttonInteraction.isButton() && buttonInteraction.user.id === interaction.user.id;
    const modalFilter = (modalInteraction: Discord.ModalSubmitInteraction) => modalInteraction.isModalSubmit() && modalInteraction.user.id === interaction.user.id;
    try {
        let amountOfWaves = challenge.data.game_data.waves;
        let embed = client.embedMaker({title: "Captcha Required", description: `Logins require a captcha to be completed, please complete the captcha below\n\nObjective: ${getInstruction(challenge)}\n\nGuide: https://i.imgur.com/05OYegq.png\n\nAmount of Waves: ${amountOfWaves}\n\nTo answer, type the # tile that the answer is in`, type: "info", author: interaction.user});
        let componentData = client.createButtons([
            {customID: "Answer", label: "Answer", style: Discord.ButtonStyle.Primary}
        ]);
        await interaction.editReply({embeds: [embed]});
        for(let i = 0; i < amountOfWaves; i++) {
            await fs.promises.writeFile(`${process.cwd()}/Image.gif`, await challenge.getImage());
            let msg = await (interaction.channel as Discord.TextChannel).send({files: [`${process.cwd()}/Image.gif`], components: componentData.components});
            let button = (await msg.awaitMessageComponent({filter: buttonFilter, time: client.config.collectorTime}));
            if(!button) {
                await msg.delete();
                let embed = client.embedMaker({title: "Captcha Expired", description: "You didn't answer the captcha in time, please rerun the command", type: "error", author: interaction.user});
                await interaction.editReply({embeds: [embed]});
                return {success: false, error: "CE"};
            }
            await button.showModal(captchaModal);
            let modal = await button.awaitModalSubmit({filter: modalFilter, time: client.config.collectorTime});
            if(!modal) {
                await msg.delete();
                let embed = client.embedMaker({title: "Captcha Expired", description: "You didn't answer the captcha in time, please rerun the command", type: "error", author: interaction.user});
                await interaction.editReply({embeds: [embed]});
                return {success: false, error: "CE"};
            }
            await msg.delete();
            await modal.reply({content: "ㅤ"});
            await modal.deleteReply();
            let answer = Number(modal.fields.getTextInputValue("answer"));
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