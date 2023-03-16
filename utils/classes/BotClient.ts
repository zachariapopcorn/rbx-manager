import Discord from 'discord.js';
import roblox from 'noblox.js';

import BotConfig from '../interfaces/BotConfig';
import RequestOptions from '../interfaces/RequestOptions';
import EmbedMakerOptions from '../interfaces/EmbedMakerOptions';
import CommandLog from '../interfaces/CommandLog';
import NeededRobloxPermissions from '../interfaces/NeededRobloxPermissions';
import CooldownEntry from '../interfaces/CooldownEntry';

export default class BotClient extends Discord.Client {
    public config: BotConfig;
    public cooldowns: CooldownEntry[] = [];
    public roverCache: {discordID: string, robloxID: number}[] = [];

    constructor(config: BotConfig) {
        super({intents: [Discord.IntentsBitField.Flags.Guilds, Discord.IntentsBitField.Flags.GuildMessages, Discord.IntentsBitField.Flags.GuildMessageReactions]});
        this.config = config;
    }

    public async request(requestOptions: RequestOptions) : Promise<Response> {
        if(requestOptions.robloxRequest) {
            requestOptions.headers = {
                "X-CSRF-TOKEN": await roblox.getGeneralToken(),
                "Cookie": this.config.ROBLOX_COOKIE,
                ...requestOptions.headers
            }
        }
        return await fetch(requestOptions.url, {
            method: requestOptions.method,
            headers: requestOptions.headers,
            body: JSON.stringify(requestOptions.body)
        })
    }

    public embedMaker(embedOptions: EmbedMakerOptions): Discord.EmbedBuilder {
        let embed = new Discord.EmbedBuilder();
        embed.setAuthor({name: embedOptions.author.tag, iconURL: embedOptions.author.displayAvatarURL()});
        embed.setColor(this.config.embedColors[embedOptions.type]);
        if(embedOptions.description.length > 0) {
            embed.setDescription(embedOptions.description);
        }
        embed.setFooter({text: "Created by zachariapopcorn#8105 - https://discord.gg/XGGpf3q"});
        embed.setTitle(embedOptions.title);
        return embed;
    }

    public createButtons(buttonData: {customID: string, label: string, style: Discord.ButtonStyle}[]): Discord.MessageReplyOptions {
        let components = [];
        for(let i = 0; i < buttonData.length; i++) {
            let newComponent = new Discord.ActionRowBuilder().addComponents(new Discord.ButtonBuilder().setCustomId(buttonData[i].customID).setLabel(buttonData[i].label).setStyle(buttonData[i].style));
            components.push(newComponent);
        }
        return {components: components}
    }

    public disableButtons(componentData: Discord.MessageReplyOptions): Discord.MessageReplyOptions {
        let components = [];
        let oldComponents = componentData.components;
        for(let i = 0; i < oldComponents.length; i++) {
            let actionRow = (oldComponents[i] as Discord.ActionRowBuilder);
            (actionRow.components[0] as Discord.ButtonBuilder).setDisabled(true);
            components.push(actionRow);
        }
        return {components: components}
    }

    public async getRobloxUser(guildID: string, discordID: string): Promise<number> {
        let index = this.roverCache.findIndex(v => v.discordID === discordID);
        if(index != -1) {
            return this.roverCache[index].robloxID;
        }
        let res = await this.request({
            url: `https://registry.rover.link/api/guilds/${guildID}/discord-to-roblox/${discordID}`,
            method: "GET",
            headers: {
                "Content-Type": "application/json;charset=UTF-8",
                "Authorization": `Bearer ${this.config.ROVER_API_KEY}`
            },
            body: undefined,
            robloxRequest: false
        });
        if(res.status === 200) {
            let rbxID = (await res.json()).robloxId;
            this.roverCache.push({discordID: discordID, robloxID: rbxID});
            return rbxID;
        } else {
            let headers = res.headers;
            if(parseInt(headers.get("X-RateLimit-Remaining")) === 0) {
                console.log("Rover API limit reached");
                setTimeout(async() => {
                    await this.getRobloxUser(guildID, discordID);
                }, parseInt(headers.get("X-RateLimit-Reset-After")) * 1000);
            } else if(res.status === 429) {
                console.log("Rover API limit reached");
                setTimeout(async() => {
                    await this.getRobloxUser(guildID, discordID);
                }, parseInt(headers.get("Retry-After")) * 1000);
            } else {
                return 0;
            }
        }
    }

    private async getPermissions(rbxID: number) {
        let rank = await roblox.getRankInGroup(this.config.groupId, rbxID);
        let role = (await roblox.getRoles(this.config.groupId)).find(r => r.rank === rank);
        let permissions = (await roblox.getRolePermissions(this.config.groupId, role.id)).permissions;
        let permissionData = {
            "JoinRequests": permissions.groupMembershipPermissions.inviteMembers,
            "Ranking": permissions.groupMembershipPermissions.changeRank,
            "Shouts": permissions.groupPostsPermissions.postToStatus,
            "Exile": permissions.groupMembershipPermissions.removeMembers
        }
        return permissionData;
    }

    public async preformVerificationChecks(robloxID: number, permissionNeeded: NeededRobloxPermissions, victimUserID?: number): Promise<boolean> {
        let authorGroupRole = await roblox.getRankInGroup(this.config.groupId, robloxID);
        if(authorGroupRole === 0) return false;
        let permissions = await this.getPermissions(robloxID);
        if(!permissions[permissionNeeded]) return false;
        if(victimUserID) {
            let victimGroupRole = await roblox.getRankInGroup(this.config.groupId, victimUserID);
            if(victimGroupRole >= authorGroupRole) return false;
        }
        return true;
    }

    public async logAction(logString: string): Promise<void> {
        if(!this.config.logging.command.enabled) return;
        let embed = this.embedMaker({title: "Command Executed", description: logString, type: "info", author: this.user});
        let channel = await this.channels.fetch(this.config.logging.command.loggingChannel) as Discord.TextChannel;
        if(channel) {
            try {
                await channel.send({embeds: [embed]});
            } catch(e) {
                console.error(`There was an error while trying to log a command execution to the command logging channel: ${e}`);
            }
        }
    }

    public createLogEmbeds(author: Discord.User, logs: CommandLog[]): Discord.EmbedBuilder[] {
        let embeds = [];
        let masterDescription = "";
        let pageCount = 1;
        for(let i = 0; i < logs.length; i++) {
            let logObject = logs[i];
            if(i === 0) {
                if(logObject.status === "Error") {
                    masterDescription += `**Username**: ${logObject.username} | **Status**: ${logObject.status} | **Message**: ${logObject.message.toString().replace("Error: ", "")}\n`;
                } else {
                    masterDescription += `**Username**: ${logObject.username} | **Status**: ${logObject.status} | **Message**: Operation ${logObject.status}\n`;
                }
            } else if(i % 10 !== 0) {
                if(logObject.status === "Error") {
                    masterDescription += `**Username**: ${logObject.username} | **Status**: ${logObject.status} | **Message**: ${logObject.message.toString().replace("Error: ", "")}\n`;
                } else {
                    masterDescription += `**Username**: ${logObject.username} | **Status**: ${logObject.status} | **Message**: Operation ${logObject.status}\n`;
                }
            } else {
                let embed = this.embedMaker({title: `Logs (Page ${pageCount})`, description: masterDescription, type: "info", author: author});
                embeds.push(embed);
                masterDescription = "";
                pageCount++;
            }
        }
        let embed = this.embedMaker({title: `Logs (Page ${pageCount})`, description: masterDescription, type: "info", author: author});
        embeds.push(embed);
        masterDescription = "";
        return embeds;
    }

    public async initiateLogEmbedSystem(interaction: Discord.CommandInteraction, logs: CommandLog[]) {
        let logEmbeds = this.createLogEmbeds(interaction.user, logs);
        if(logEmbeds.length === 1) {
            return await interaction.editReply({embeds: [logEmbeds[0]], components: []});
        } else {
            let index = 0;
            let embed = logEmbeds[index];
            let componentData = this.createButtons([
                {customID: "backButton", label: "Previous Page", style: Discord.ButtonStyle.Success},
                {customID: "forwardButton", label: "Next Page", style: Discord.ButtonStyle.Danger}
            ]);
            let msg = await interaction.editReply({embeds: [embed], components: componentData.components}) as Discord.Message;
            let filter = (buttonInteraction: Discord.Interaction) => buttonInteraction.isButton() && buttonInteraction.user.id === interaction.user.id;
            let collector = msg.createMessageComponentCollector({filter: filter, time: this.config.collectorTime});
            collector.on("collect", async(button) => {
                if(button.customId === "backButton") {
                    index -= 1;
                    if(index < 0) {
                        index = logEmbeds.length - 1;
                    }
                } else {
                    index++;
                    if(index === logEmbeds.length) {
                        index = 0;
                    }
                }
                embed = logEmbeds[index];
                await msg.edit({embeds: [embed]});
            });
            collector.on("end", async() => {
                let disabledComponents = this.disableButtons(componentData).components;
                await msg.edit({components: disabledComponents});
            });
        }
    }

    public isLockedRole(role: roblox.Role): boolean {
        let isLocked = false;
        if(this.config.lockedRanks.findIndex(lockedRank => lockedRank === role.name) !== -1) isLocked = true;
        if(this.config.lockedRanks.findIndex(lockedRank => lockedRank === role.rank) !== -1) isLocked = true;
        return isLocked;
    }

    public isUserOnCooldown(commandName: string, userID: string): boolean {
        return (this.cooldowns.findIndex(v => v.commandName === commandName && v.userID === userID)) !== -1;
    }

    public getCooldownForCommand(commandName: string): number {
        return this.config.cooldownOverrides[commandName] || this.config.defaultCooldown;
    }
}