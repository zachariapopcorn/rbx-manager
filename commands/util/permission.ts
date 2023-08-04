import Discord from 'discord.js';
import fs from 'fs';

import BotClient from '../../utils/classes/BotClient';
import ConfigHelpers from '../../utils/classes/ConfigHelpers';

import CommandFile from '../../utils/interfaces/CommandFile';

import config from '../../config';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let permissionNode = args["permission"];
        let role = args["role"];
        let subcommand = args["subcommand"];
        let permissionArray = ConfigHelpers.getPropertyFromString(client.config.permissions, permissionNode) as string[];
        if(!permissionArray) {
            let embed = client.embedMaker({title: "Invalid Permission", description: "You supplied an invalid permission", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let index = permissionArray.indexOf(role);
        if(subcommand === "add") {
            if(index !== -1) {
                let embed = client.embedMaker({title: "Permission Already Granted", description: "This role already has the permission supplied", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
            permissionArray.push(role);
        } else {
            if(index === -1) {
                let embed = client.embedMaker({title: "Permission Not Granted", description: "This role doesn't have the permission supplied", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
            permissionArray.splice(index, 1);
        }
        ConfigHelpers.setPropertyFromString(config, permissionNode, permissionArray);
        ConfigHelpers.setPropertyFromString(client.config, permissionNode, permissionArray);
        ConfigHelpers.writeToConfigFile(client);
        let embed = client.embedMaker({title: "Successfully Modified Permissions", description: `You've successfully modified the permissions of this permission to ${subcommand} the role supplied`, type: "success", author: interaction.user});
        return await interaction.editReply({embeds: [embed]});
    },
    autocomplete: async(interaction: Discord.AutocompleteInteraction, client: BotClient): Promise<any> => {
        let strings = ConfigHelpers.getObjectStrings(client.config.permissions);
        let focused = interaction.options.getFocused();
        let filtered = strings.filter(choice => choice.startsWith(focused));
        return await interaction.respond(filtered.map(choice => ({name: choice, value: choice})));
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("permission")
    .setDescription("Configures role permissions for the bot")
    .addSubcommand(sc => {
        sc.setName("add");
        sc.setDescription("Adds an allowed role to the bot");
        sc.addStringOption(o => o.setName("permission").setDescription("The permission setting to modify").setRequired(true).setAutocomplete(true));
        sc.addRoleOption(o => o.setName("role").setDescription("The role to give the permission to").setRequired(true));
        return sc;
    })
    .addSubcommand(sc => {
        sc.setName("remove");
        sc.setDescription("Removes an allowed role from the bot");
        sc.addStringOption(o => o.setName("permission").setDescription("The permission setting to modify").setRequired(true).setAutocomplete(true));
        sc.addRoleOption(o => o.setName("role").setDescription("The role to remove the permission from").setRequired(true));
        return sc;
    }) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Util",
        isEphemeral: false,
        permissions: ["Administrator"],
        useDiscordPermissionSystem: true,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
}

export default command;