import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any) {
    let typeOfOperation = args["type"];
    if(typeOfOperation === "jobID" && !args["jobid"]) {
        let embed = client.embedMaker("Argument Error", `You didn't supply a Job ID even though you supplied the jobID execution type`, "error", interaction.user);
        return await interaction.editReply(embed);
    }
    // add messaging call later
    let embed = client.embedMaker("Success", "You've successfully sent out the following code to be executed based on the inputted settings", "success", interaction.user);
    await interaction.editReply(embed);
    if(client.config.logging.enabled) {
        if(typeOfOperation === "global") {
            await client.logAction(`<@${interaction.user.id}> has executed **${args["code"]}** in all of the game servers`);
        } else {
            await client.logAction(`<@${interaction.user.id}> has executed **${args["code"]}** the game server with the job ID of **${args["jobid"]}**`);
        }
    }
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("eval")
    .setDescription("Runs serverside code on either all servers or a specific one")
    .addStringOption(o => o.setName("type").setDescription("The type of execution to preform").setRequired(true).addChoice("global", "global").addChoice("jobID", "jobID"))
    .addStringOption(o => o.setName("code").setDescription("The code to execute in the game").setRequired(true))
    .addStringOption(o => o.setName("jobid").setDescription("The job ID of the server you wish to run the code in (only if you choose so)").setRequired(false))

export const commandData: CommandData = {
    category: "General Game",
    permissions: config.permissions.game.execution
}