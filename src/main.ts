import { Client } from 'discord.js';
import { config } from 'dotenv';
import { REST } from '@discordjs/rest';
import { ActivityType, GatewayIntentBits, Routes } from 'discord-api-types/v10';
import { readdirSync } from 'fs';
import Module from './Module';
import { SlashCommandBuilder } from '@discordjs/builders';
import mongoose from 'mongoose';
config();

const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]});
const rest = new REST({version: '10'}).setToken((process.env.TOKEN as string));
let modules: Module[] = [];

client.login(process.env.TOKEN);
mongoose.connect(process.env.MONGO_STRING);

function commandsToJson(cmds: SlashCommandBuilder[]) {
    let result = [];
    for (const key in cmds) {
        if (Object.prototype.hasOwnProperty.call(cmds, key)) {
            const element = cmds[key];
            result.push(element.toJSON());
        }
    }

    return result;
}

async function registerCommands() {
    let cmds: SlashCommandBuilder[] = [];
    modules.forEach(async (value, index) => {
        const command = new SlashCommandBuilder().setDescription(`Commands from the module ${value.name}`);
        command.setName(value.name.toLowerCase());

        for (const key in value.commands) {
            if (Object.prototype.hasOwnProperty.call(value.commands, key)) {
                const element = value.commands[key];
                command.addSubcommand(element.builder);
            }
        }

        cmds.push(command);

        if(index == modules.length - 1) {
            const rawCmds = commandsToJson(cmds);
            
            await rest.put(Routes.applicationCommands(client.application.id), {body: rawCmds});

            return;
        }
    })
}

export async function loadModule(name: string) {
    if(!name.endsWith(".ts")) return;
    const MODULE = await import(`./modules/${name}`);
    const m = new MODULE.default();

    if(!(m instanceof Module)) return;
    m.init(client);

    modules.push(m);

    m.info("Loaded");
}

export async function unloadModule(name: string) {
    let found = false;
    modules.forEach((v, i) => {
        if(v.name.toLowerCase() == name.toLowerCase()) {
            found = true;
            v.disableModule();
            modules = modules.filter((val) => val != v);
        }
    });

    return found;
}

client.on('ready', async (client) => {
    client.user.setPresence({activities: [{name: "slash commands", type: ActivityType.Listening}], status: "online"})
    console.log("Loading...");
    const moduleDir = readdirSync("src/modules");

    moduleDir.forEach(async (f, index) => {
        await loadModule(f);
        if(index == moduleDir.length - 1) await registerCommands();      
    });

    global.upSince = new Date();
});
