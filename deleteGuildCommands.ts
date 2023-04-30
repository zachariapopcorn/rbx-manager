import readline from 'readline';

import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

import config from './config';

let rest = new REST().setToken(config.DISCORD_TOKEN);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question("Enter your bot's client ID: ", (clientID) => {
    rl.question("Enter the guild ID of the server to delete guild commands from: ", async (guildID) => {
        try {
            await rest.put(Routes.applicationGuildCommands(clientID, guildID), {body: []});
            console.log("Success");
        } catch(e) {
            console.error(`There was an error while trying to delete these commands: ${e}`);
        }
        process.exit(0);
    });
});