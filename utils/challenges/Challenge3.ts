import Discord from 'discord.js';

import { Challenge3 } from 'funcaptcha/lib/challenge';

import fs from "fs";

import BotClient from '../../utils/classes/BotClient';
import BetterConsole from '../../utils/classes/BetterConsole';

const map = {
    "0️⃣": 0,
    "1️⃣": 1,
    "2️⃣": 2,
    "3️⃣": 3,
    "4️⃣": 4,
    "5️⃣": 5
}

const keys = Object.keys(map);

export default async function solveChallenge3(interaction: Discord.CommandInteraction, client: BotClient, challenge: Challenge3): Promise<{success: boolean, error?: string}> {
    try {
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
                filter: (reaction: Discord.MessageReaction, user: Discord.User) => {
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
                await interaction.editReply({embeds: [embed]});
                return {success: false, error: "CE"};
            }
            let answer = map[collected.at(0).emoji.name];
            let answerResponse = await challenge.answer(answer);
            if(answerResponse.response === "answered" && answerResponse.solved === false) {
                let embed = client.embedMaker({title: "Captcha Failed", description: "You've failed the captcha, please rerun the command", type: "error", author: interaction.user});
                await interaction.editReply({embeds: [embed]});
                return {success: false, error: "CF"};
            }
            return {success: true};
        }
    } catch(e) {
        return {success: false, error: e};
    }
}