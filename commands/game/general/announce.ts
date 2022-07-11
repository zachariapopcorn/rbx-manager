import Discord from 'discord.js';
import * as Builders from '@discordjs/builders';
import { BotClient, CommandData } from '../../../utils/classes';
import { config } from '../../../config';

export async function run(interaction: Discord.CommandInteraction, client: BotClient, args: any) {
    // add messaging call later
    let embed = client.embedMaker("Success", "You've successfully sent this announcement to the game", "success", interaction.user);
    await interaction.editReply(embed);
    if(client.config.logging.enabled) {
        await client.logAction(`<@${interaction.user.id}> has announced **${args["message"]}** with the title of **${args["title"]}** to the game's players`);
    }
}

export const slashData = new Builders.SlashCommandBuilder()
    .setName("announce")
    .setDescription("Announces the inputted message to every game server")
    .addStringOption(o => o.setName("title").setDescription("The title of the announcement").setRequired(true))
    .addStringOption(o => o.setName("message").setDescription("The message that you wish to announce").setRequired(true))

export const commandData: CommandData = {
    category: "General Game",
    permissions: config.permissions.game.broadcast
}