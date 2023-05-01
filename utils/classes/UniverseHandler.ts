import Discord from 'discord.js';

import config from '../../config';

export default class UniverseHandler {
    private static universeData: {id: number, name: string}[] = [];
    public static async loadUniverses() {
        for(let i = 0; i < config.universes.length; i++) {
            let res = await fetch(`https://develop.roblox.com/v1/universes/${config.universes[i]}`);
            let body = await res.json();
            this.universeData.push({id: body.id, name: body.name});
        }
    }
    public static parseUniverses(): Discord.APIApplicationCommandOptionChoice[] {
        let parsed: Discord.APIApplicationCommandOptionChoice[] = [];
        for(let i = 0; i < this.universeData.length; i++) {
            parsed.push({name: this.universeData[i].name, value: this.universeData[i].name});
        }
        return parsed;
    }
    public static getNameFromID(universeID: number): string {
        return this.universeData.find(v => v.id === universeID).name;
    }
    public static getIDFromName(universeName: string): number {
        return this.universeData.find(v => v.name === universeName).id;
    }
}