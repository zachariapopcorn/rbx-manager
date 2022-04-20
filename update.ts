import utils = require('util');
import axios = require('axios');
import * as fs from 'fs/promises'

const axiosClient = axios.default;

const exclusions = [];

const API_URL = "https://api.github.com/repos/zachariapopcorn/roblox-manager/contents";

let fileInfo = "";

async function getFiles(folder: string) {
    logData(`\nGetting files for ${folder}`);
    let files;
    try {
        let res = await axiosClient({
            url: `${API_URL}/${folder}`,
            method: "GET"
        });
        files = JSON.parse(JSON.stringify(res.data));
    } catch(e) {
        throw e;
    }
    for(let i = 0; i < files.length; i++) {
        if(isFolder(files[i])) {
            try {
                await fs.mkdir(files[i].path, {recursive: true});
                await getFiles(files[i].path);
            } catch(e) {
                throw e;
            }
        } else {
            let name = files[i].path;
            if(!exclusions.find(v => v === name)) {
                try {
                    logData(`Writing file ${files[i].path}`);
                    let res = await axiosClient({
                        url: files[i].download_url,
                        method: "GET"
                    });
                    let fileContent = res.data;
                    await fs.writeFile(files[i].path, fileContent);
                } catch(e) {
                    throw e;
                }
            } else {
                logData(`Skipped file ${files[i].path}`);
            }
        }
    }
}

function logData(data : string) {
    console.log(data);
    fileInfo += `${data}\n`;
}

function isFolder(data: any) {
    if(data.download_url) {
        return false;
    } else {
        return true;
    }
}

getFiles("/").then(() => {
    logData("Successfully updated bot files");
    fs.writeFile('updateLog.txt', fileInfo).catch();
}).catch(e => {
    logData(`Oops! There was an error while attempting to update the bot files: ${e}`);
    fs.writeFile('updateLog.txt', fileInfo).catch();
});