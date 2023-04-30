import Discord from 'discord.js';
import roblox = require('noblox.js');

import config from '../../config';

export default class GroupHandler {
    private static groupData: {id: number, name: string}[] = this.loadGroupNames();
    private static loadGroupNames(): {id: number, name: string}[] {
        let temp = [];
        for(let i = 0; i < config.groupIds.length; i++) {
            roblox.getGroup(config.groupIds[i]).then((groupInfo) => {
                temp.push({id: groupInfo.id, name: groupInfo.name});
            });
        }
        return temp;
    }
    public static parseGroups(): Discord.APIApplicationCommandOptionChoice[] {
        let parsed: Discord.APIApplicationCommandOptionChoice[] = [];
        for(let i = 0; i < this.groupData.length; i++) {
            parsed.push({name: this.groupData[i].name, value: this.groupData[i].name});
        }
        return parsed;
    }
    public static getNameFromID(groupID: number): string {
        return this.groupData.find(v => v.id === groupID).name;
    }
    public static getIDFromName(groupName: string): number {
        return this.groupData.find(v => v.name === groupName).id;
    }
}