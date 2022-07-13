import { Client, Interaction, Collection } from "discord.js";
import Command from "./Command";
import Cooldown from "./Cooldown";

export default class Module {
    client: Client<true>;
    name: string;
    commands: Command[] = [];
    cooldowns: Cooldown[] = [];

    init(client: Client<true>) {
        this.client = client;
        this.onReady();
        this.client.on('interactionCreate', (i) => this.onInternalInteraction(i));
    }
    
    onInternalInteraction(i: Interaction) {
        if(!i.isCommand()) return;
        if(!(i.commandName == this.name.toLowerCase())) return;

        const commandName = i.options.getSubcommand();
        this.commands.forEach(cmd => {
            if(cmd.name == commandName) {
                if(cmd.cooldown) {
                    for (const key in this.cooldowns) {
                        if (Object.prototype.hasOwnProperty.call(this.cooldowns, key)) {
                            const element = this.cooldowns[key];
                            if(element.command == cmd && i.user.id == element.user.id && Date.now() < element.use_after) {
                                i.reply({content: ":x: **You are on cooldown.**", ephemeral: true});
                                return
                            } else {
                                this.cooldowns = this.cooldowns.filter((v) => v != element);
                            }
                            
                        }
                    }
                    
                }
                const cDown: Cooldown = {use_after: Date.now() + cmd.cooldown * 1000, command: cmd, user: i.user};
                this.cooldowns.push(cDown);
                cmd.callback(i);
            }
        })
    }

    onReady() { }
}