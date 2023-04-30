import Discord from 'discord.js';
import roblox = require('noblox.js');

import BotClient from '../../../utils/classes/BotClient';
import CommandFile from '../../../utils/interfaces/CommandFile';
import RobloxDatastore from '../../../utils/classes/RobloxDatastore';
import CommandHelpers from '../../../utils/classes/CommandHelpers';

import config from '../../../config';

const database = new RobloxDatastore(config);

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let name = args["name"] as string;
        let key = args["key"] as string;
        let scope = args["scope"] as string || "global";
        let universeName = args["universe"];
        let universeID = CommandHelpers.getUniverseIDFromName(universeName);
        try {
            await roblox.deleteDatastoreEntry(universeID, name, key, scope);
        } catch(e) {
            let embed: Discord.EmbedBuilder;
            if(e.toString() === "Error: 404 NOT_FOUND Entry not found in the datastore.") {
                embed = client.embedMaker({title: "Error", description: "The supplied data doesn't return any data, please try a different combination", type: "error", author: interaction.user});
            } else {
                embed = client.embedMaker({title: "Error", description: `There was an error while trying to delete data: ${e}`, type: "error", author: interaction.user});
            }
            return interaction.editReply({embeds: [embed]});
        }
        await client.logAction(`<@${interaction.user.id}> has deleted the **${key}** key in the **${name}** datastore, which is located in the **${scope}** scope from **${universeName}**`);
        let embed = client.embedMaker({title: "Success", description: "You've successfully deleted this data", type: "success", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("deletevalue")
    .setDescription("Deletes data from the datastores with the given settings")
    .addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...CommandHelpers.parseUniverses() as any))
    .addStringOption(o => o.setName("name").setDescription("The name of the datastore to delete data from").setRequired(true))
    .addStringOption(o => o.setName("key").setDescription("The entry key of the data to delete from the datastore").setRequired(true))
    .addStringOption(o => o.setName("scope").setDescription("The scope of which the datastore is located at").setRequired(false)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Database",
        permissions: config.permissions.game.datastore,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
}

export default command;