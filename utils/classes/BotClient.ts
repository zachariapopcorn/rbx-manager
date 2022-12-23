import Discord, { ActionRowBuilder, ButtonBuilder, Message } from 'discord.js';
import roblox from 'noblox.js';
import axios = require('axios');

import BotConfig from './BotConfig';
import RequestOptions from '../interfaces/RequestOptions';
import EmbedMakerOptions from '../interfaces/EmbedMakerOptions';
import CommandLog from '../interfaces/CommandLog';

const axiosClient = axios.default;

export default class BotClient extends Discord.Client {
    public config: BotConfig

    constructor(config: BotConfig) {
        super({intents: [Discord.IntentsBitField.Flags.Guilds, Discord.IntentsBitField.Flags.GuildMessages, Discord.IntentsBitField.Flags.GuildMessageReactions]});
        this.config = config;
    }

    public async request(requestOptions: RequestOptions) : Promise<axios.AxiosResponse> {
        let responseData: axios.AxiosResponse;
        if(requestOptions.robloxRequest) {
            requestOptions.headers = {
                "X-CSRF-TOKEN": await roblox.getGeneralToken(),
                "Cookie": this.config.ROBLOX_COOKIE,
                ...requestOptions.headers
            }
        }
        try {
            responseData = await axiosClient({
                url: requestOptions.url,
                method: requestOptions.method,
                headers: requestOptions.headers,
                data: requestOptions.body
            })
        } catch(e) {
            throw e;
        }
        return responseData;
    }

    public embedMaker(embedOptions: EmbedMakerOptions): Discord.EmbedBuilder {
        let embed = new Discord.EmbedBuilder();
        embed.setAuthor({name: embedOptions.author.tag, iconURL: embedOptions.author.displayAvatarURL()});
        embed.setColor(this.config.embedColors[embedOptions.type]);
        embed.setDescription(embedOptions.description);
        embed.setFooter({text: "Created by zachariapopcorn#8105 - https://discord.gg/XGGpf3q"});
        embed.setTitle(embedOptions.title);
        return embed;
    }

    public async getRobloxUser(guildID: string, discordID: string): Promise<number> {
        try {
            let res = await this.request({
                url: `https://registry.rover.link/api/guilds/${guildID}/discord-to-roblox/${discordID}`,
                method: "GET",
                headers: {
                    "Content-Type": "application/json;charset=UTF-8",
                    "Authorization": `Bearer ${this.config.ROVER_API_KEY}`
                },
                body: {},
                robloxRequest: false
            });
            if(res.status === 200) {
                return res.data.robloxId;
            }
            if(res.status === 429) {
                setTimeout(async() => {
                    await this.getRobloxUser(guildID, discordID);
                }, parseInt(res.headers["Retry-After"]) * 1000);
            }
            if(parseInt(res.headers["X-RateLimit-Remaining"]) === 0) {
                setTimeout(async() => {
                    await this.getRobloxUser(guildID, discordID);
                }, parseInt(res.headers["X-RateLimit-Reset-After"]) * 1000);
            }
        } catch(e) {
            return 0;
        }
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

    public async initiateLogEmbedSystem(interaction: Discord.CommandInteraction, logs: CommandLog[], didCommandReply?: boolean) {
        if(didCommandReply === undefined) didCommandReply = false;
        let logEmbeds = this.createLogEmbeds(interaction.user, logs);
        if(logEmbeds.length === 1) {
            if(didCommandReply) {
                return await interaction.channel.send({embeds: [logEmbeds[0]]});
            } else {
                return await interaction.editReply({embeds: [logEmbeds[0]]});
            }
        } else {
            let index = 0;
            let embed = logEmbeds[index];
            let msg: Discord.Message;
            if(didCommandReply) {
                msg = await interaction.channel.send({embeds: [embed]}) as Discord.Message;
            } else {
                msg = await interaction.editReply({embeds: [embed]}) as Discord.Message;
            }
            await msg.react('⬅️');
            await msg.react('➡️');
            let filter = (reaction: Discord.MessageReaction, user: Discord.User) => (reaction.emoji.name === "⬅️" || reaction.emoji.name === "➡️") && user.id === interaction.user.id;
            let collector = msg.createReactionCollector({filter: filter});
            collector.on('collect', async(reaction: Discord.MessageReaction) => {
                if(reaction.emoji.name === "⬅️") {
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
        }
    }

    public isLockedRole(role: roblox.Role): boolean {
        let isLocked = false;
        if(this.config.lockedRanks.findIndex(lockedRank => lockedRank === role.name) !== -1) isLocked = true;
        if(this.config.lockedRanks.findIndex(lockedRank => lockedRank === role.rank) !== -1) isLocked = true;
        return isLocked;
    }
}