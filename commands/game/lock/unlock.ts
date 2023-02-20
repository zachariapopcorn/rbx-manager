import Discord from 'discord.js';

import BotClient from '../../../utils/classes/BotClient';
import CommandFile from '../../../utils/interfaces/CommandFile';
import MessagingService from '../../../utils/classes/MessagingService';
import CommandHelpers from '../../../utils/classes/CommandHelpers';

import config from '../../../config';

const messaging = new MessagingService(config);

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {      
        let jobID = args["jobid"];
        let reason = args["reason"];
        let universeName = args["universe"];
        let universeID = CommandHelpers.getUniverseIDFromName(universeName);
        try {
            await messaging.sendMessage(universeID, "Unlock", {
                jobID: jobID,
                reason: reason
            });
        } catch(e) {
            let embed = client.embedMaker({title: "Error", description: `There was an error while trying to send the unlock request to the server: ${e}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        await client.logAction(`<@${interaction.user.id}> has unlocked the server of **${universeName}** with the job id of **${jobID}** for the reason of **${reason}**`);
        let embed = client.embedMaker({title: "Success", description: "You've successfully unlocked the inputted server", type: "success", author: interaction.user})
        await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlocks the inputted server")
    .addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...CommandHelpers.parseUniverses() as any))
    .addStringOption(o => o.setName("jobid").setDescription("The job ID of the server you wish to unlock").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("The reason of why you want to unlock the supplied server").setRequired(true)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Lock",
        permissions: config.permissions.game.lock
    }
}

export default command;