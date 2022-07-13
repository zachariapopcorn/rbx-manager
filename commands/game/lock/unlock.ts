import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData, MessagingService } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    let messaging = new MessagingService(client.config.API_KEY);
    let jobID = args["jobid"];
    let reason = args["reason"];
    try {
        await messaging.sendMessage("Lock", {
            jobID: jobID,
            reason: reason
        });
    } catch(e) {
        let embed = client.embedMaker("Error", `There was an error while trying to send the unlock request to the server: ${e}`, "error", interaction.user);
        return await interaction.editReply(embed);
    }
    let embed = client.embedMaker("Success", "You've successfully unlocked the inputted server", "success", interaction.user);
    await interaction.editReply(embed);
    if(client.config.logging.enabled) {
        await client.logAction(`<@${interaction.user.id}> has unlocked the server with the job id of **${jobID}** for the reason of **${reason}**`);
    }
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlocks the inputted server")
    .addStringOption(o => o.setName("jobid").setDescription("The job ID of the server you wish to unlock").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("The reason of why you want to unlock the supplied server").setRequired(true))

export const commandData: CommandData = {
    category: "Lock",
    permissions: config.permissions.game.lock
}