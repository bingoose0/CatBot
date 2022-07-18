import { Client, Interaction, Collection, EmbedBuilder, Embed, CommandInteraction, InteractionType } from "discord.js";
import Command from "./Command";
import Cooldown from "./Cooldown";

export default class Module {
    client: Client<true>;
    name: string;

    commands: Command[] = [];
    cooldowns: Cooldown[] = [];

    interactionListener: (i: any) => void;
    enabled = false;

    info = (msg: string) => console.log(`[${this.name}] ${msg}`);

    init(client: Client<true>) {
        if(this.enabled) throw 'Already enabled';
        this.client = client;
        this.onReady();
        this.interactionListener = (i) => this.onInternalInteraction(i);
        this.client.on('interactionCreate', this.interactionListener);
        this.enabled = true;
    }
    
    disableModule() {
        if(!this.enabled) throw 'Already disabled';
        this.enabled = false;

        this.client.removeListener("interactionCreate", this.interactionListener);
        console.log(`Disabled ${this.name}`);
        this.onDisabled();
    }

    onDisabled() { };

    onInternalInteraction(i: Interaction) {
        if(i.type != InteractionType.ApplicationCommand) return;
        if(!(i.commandName == this.name.toLowerCase())) return;

        const commandName = i.options.();
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
                cmd.callback(i).catch((e: any) => {
                    const embed = new EmbedBuilder()
                        .setTitle("Error caught!")
                        .setColor(0xFF0000)
                        .setDescription(`\`\`\`${e}\`\`\``)
                        .addFields({name: "Time occurred", value: `<t:${Math.round(Date.now() / 1000)}>`});
                    
                    i.reply({embeds: [embed], ephemeral: true});
                    console.error(e);
                })
            }
        })
    }

    onReady() { }
}

