import { Client, Interaction } from "discord.js";
import Command from "./Command";

export default class Module {
    client: Client<true>;
    name: string;
    commands: Command[] = [];

    init(client: Client<true>) {
        this.client = client;
        this.onReady();
        this.client.on('interactionCreate', (i) => {this.onInternalInteraction(i)});
    }
    
    onInternalInteraction(i: Interaction) {
        if(!i.isCommand()) return;
        if(!(i.commandName == this.name.toLowerCase())) return;

        const commandName = i.options.getSubcommand();
        this.commands.forEach(cmd => {
            if(cmd.name == commandName) {
                cmd.executor(i);
            }
        })
    }

    onReady() { }
}