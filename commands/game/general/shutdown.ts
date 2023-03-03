import Discord from 'discord.js';

import BotClient from '../../../utils/classes/BotClient';
import CommandFile from '../../../utils/interfaces/CommandFile';
import MessagingService from '../../../utils/classes/MessagingService';
import CommandHelpers from '../../../utils/classes/CommandHelpers';

import config from '../../../config';

const messaging = new MessagingService(config);

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        if(client.isUserOnCooldown(require('path').parse(__filename).name, interaction.user.id)) {
            let embed = client.embedMaker({title: "Cooldown", description: "You're currently on cooldown for this command, take a chill pill", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let typeOfOperation = args["type"];
        let jobID = args["jobid"];
        let reason = args["reason"];
        let universeName = args["universe"];
        let universeID = CommandHelpers.getUniverseIDFromName(universeName);
        if(typeOfOperation === "jobID" && !jobID) {
            let embed = client.embedMaker({title: "Argument Error", description: "You didn't supply a Job ID even though you supplied the jobID shutdown type", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        try {
            await messaging.sendMessage(universeID, "Shutdown", {
                isGlobal: (typeOfOperation === "global"),
                jobID: jobID,
                reason: reason
            });
        } catch(e) {
            let embed = client.embedMaker({title: "Error", description: `There was an error while trying to send the shutdown request: ${e}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        if(typeOfOperation === "global") {
            await client.logAction(`<@${interaction.user.id}> has shutdown all of the servers of **${universeName}** for the reason of **${reason}**`);
        } else {
            await client.logAction(`<@${interaction.user.id}> has shutdown the server of **${universeName}** with the job ID of **${jobID}** for the reason of **${reason}**`);
        }
        let embed = client.embedMaker({title: "Success", description: "You've successfully sent out the following shutdown to be executed based on the inputted settings", type: "success", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        client.cooldowns.push({commandName: require('path').parse(__filename).name, userID: interaction.user.id, cooldownExpires: (Date.now() + (client.getCooldownForCommand(require('path').parse(__filename).name)))});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("shutdown")
    .setDescription("Shutdowns all servers or shuts down a specific server")
    .addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...CommandHelpers.parseUniverses() as any))
    .addStringOption(o => o.setName("type").setDescription("The type of shutdown to preform").setRequired(true).addChoices({name: "global", value: "global"}, {name: "jobID", value: "jobID"}))
    .addStringOption(o => o.setName("reason").setDescription("The reason of the shutdown").setRequired(true))
    .addStringOption(o => o.setName("jobid").setDescription("The job ID of the server you wish to shutdown (only if you choose so)").setRequired(false)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "General Game",
        permissions: config.permissions.game.shutdown
    }
}

export default command;