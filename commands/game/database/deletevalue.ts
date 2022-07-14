import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData, RobloxDatastore } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any) {
    let database = new RobloxDatastore(client.config.ROBLOX_API_KEY);
    let name = args["name"];
    let key = args["key"];
    let scope = args["scope"] || "global";
    try {
        await database.removeAsync(name, key, scope);
    } catch(e) {
        let embed;
        if(e.response.data.error === "NOT_FOUND") {
            embed = client.embedMaker("Error", `The supplied data doesn't return any data, please try a different combination`, "error", interaction.user);
        } else {
            embed = client.embedMaker("Error", `There was an error while trying to delete data: ${e}`, "error", interaction.user);
        }
        return await interaction.editReply(embed);
    }
    let embed = client.embedMaker("Success", `You've successfully deleted this data`, "success", interaction.user);
    await client.logAction(`<@${interaction.user.id}> has deleted the **${key}** key in the **${name}** datastore, which is located in the **${scope}** scope`);
    return await interaction.editReply(embed);
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("deletevalue")
    .setDescription("Deletes data from the datastores with the given settings")
    .addStringOption(o => o.setName("name").setDescription("The name of the datastore to delete data from").setRequired(true))
    .addStringOption(o => o.setName("key").setDescription("The entry key of the data to delete from the datastore").setRequired(true))
    .addStringOption(o => o.setName("scope").setDescription("The scope of which the datastore is located at").setRequired(false))

export const commandData: CommandData = {
    category: "Database",
    permissions: config.permissions.game.datastore
}