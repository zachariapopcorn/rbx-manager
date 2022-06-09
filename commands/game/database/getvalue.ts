import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData, RobloxDatastore } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any) {
    let database = new RobloxDatastore(client.config.API_KEY);
    let returnedData;
    try {
        returnedData = await database.getAsync(args["name"], args["key"], args["scope"]);
    } catch(e) {
        let embed;
        if(e.response.data.error === "NOT_FOUND") {
            embed = client.embedMaker("Error", `The supplied data doesn't return any data, please try a different combination`, "error", interaction.user);
        } else {
            embed = client.embedMaker("Error", `There was an error while trying to fetch data: ${e}`, "error", interaction.user);
        }
        return await interaction.editReply(embed);
    }
    if(typeof(returnedData) === "object") returnedData = returnedData = JSON.stringify(returnedData)
    let topData = `Datastore Name: ${args["name"]}\nScope: ${args["scope"] || "None provided"}\nEntry Key: ${args["key"]}`;
    let description = "**Provided Data**\n```{topData}```\n**Data Returned**\n```json\n{returnedData}```";
    description = description.replace("{topData}", topData);
    description = description.replace("{returnedData}", returnedData);
    let embed = client.embedMaker("Success", description, "success", interaction.user);
    return await interaction.editReply(embed);
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("getvalue")
    .setDescription("Gets the datastore value with the inputted settings")
    .addStringOption(o => o.setName("name").setDescription("The name of the datastore to fetch data from").setRequired(true))
    .addStringOption(o => o.setName("key").setDescription("The entry key of the data to fetch from the datastore").setRequired(true))
    .addStringOption(o => o.setName("scope").setDescription("The scope of which the datastore is located at").setRequired(false))

export const commandData: CommandData = {
    category: "Database",
    permissions: config.permissions.game.datastore
}