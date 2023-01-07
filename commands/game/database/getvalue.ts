import Discord, { EmbedBuilder } from 'discord.js';

import BotClient from '../../../utils/classes/BotClient';
import CommandFile from '../../../utils/interfaces/CommandFile';
import RobloxDatastore from '../../../utils/classes/RobloxDatastore';

import config from '../../../config';

const database = new RobloxDatastore(config);

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let name = args["name"];
        let key = args["key"];
        let scope = args["scope"] || "global";
        let returnedData;
        try {
            returnedData = await database.getAsync(name, key, scope);
        } catch(e) {
            let embed: EmbedBuilder;
            if(e.response.data.error === "NOT_FOUND") {
                embed = client.embedMaker({title: "Error", description: "The supplied data doesn't return any data, please try a different combination", type: "error", author: interaction.user});
            } else {
                embed = client.embedMaker({title: "Error", description: `There was an error while trying to fetch data: ${e}`, type: "error", author: interaction.user});
            }
            return await interaction.editReply({embeds: [embed]});
        }
        if(typeof(returnedData) === "object") returnedData = returnedData = JSON.stringify(returnedData)
        let topData = `Datastore Name: ${name}\nScope: ${scope}\nEntry Key: ${key}`;
        let description = "**Provided Data**\n```{topData}```\n**Data Returned**\n```json\n{returnedData}```";
        description = description.replace("{topData}", topData);
        description = description.replace("{returnedData}", returnedData);
        let embed = client.embedMaker({title: "Success", description: description, type: "success", author: interaction.user});
        return await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("getvalue")
    .setDescription("Gets the datastore value with the inputted settings")
    .addStringOption(o => o.setName("name").setDescription("The name of the datastore to fetch data from").setRequired(true))
    .addStringOption(o => o.setName("key").setDescription("The entry key of the data to fetch from the datastore").setRequired(true))
    .addStringOption(o => o.setName("scope").setDescription("The scope of which the datastore is located at").setRequired(false)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Database",
        permissions: config.permissions.game.datastore
    }
}

export default command;