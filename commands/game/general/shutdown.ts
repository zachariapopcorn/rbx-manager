import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData, MessagingService } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any[]) {
    let messaging = new MessagingService(client.config.ROBLOX_API_KEY);
    let typeOfOperation = args["type"];
    let jobID = args["jobid"];
    let reason = args["reason"];
    if(typeOfOperation === "jobID" && !jobID) {
        let embed = client.embedMaker("Argument Error", `You didn't supply a Job ID even though you supplied the jobID shutdown type`, "error", interaction.user);
        return await interaction.editReply(embed);
    }
    try {
        await messaging.sendMessage("Shutdown", {
            isGlobal: (typeOfOperation === "global"),
            jobID: jobID,
            reason: reason
        });
    } catch(e) {
        let embed = client.embedMaker("Error", `There was an error while trying to send the shutdown request: ${e}`, "error", interaction.user);
        return await interaction.editReply(embed);
    }
    let embed = client.embedMaker("Success", "You've successfully sent out the following shutdown to be executed based on the inputted settings", "success", interaction.user);
    await interaction.editReply(embed);
    if(client.config.logging.enabled) {
        if(typeOfOperation === "global") {
            await client.logAction(`<@${interaction.user.id}> has shutdown all of the game servers for the reason of **${reason}**`);
        } else {
            await client.logAction(`<@${interaction.user.id}> has shutdown the game server with the job ID of **${jobID}** for the reason of **${reason}**`);
        }
    }
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("shutdown")
    .setDescription("Shutdowns all servers or shuts down a specific server")
    .addStringOption(o => o.setName("type").setDescription("The type of shutdown to preform").setRequired(true).addChoice("global", "global").addChoice("jobID", "jobID"))
    .addStringOption(o => o.setName("reason").setDescription("The reason of the shutdown").setRequired(true))
    .addStringOption(o => o.setName("jobid").setDescription("The job ID of the server you wish to shutdown (only if you choose so)").setRequired(false))

export const commandData: CommandData = {
    category: "General Game",
    permissions: config.permissions.game.shutdown
}