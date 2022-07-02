import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { Collection, CommandInteraction, MessageEmbed, User } from "discord.js";
import Account from "../models/Account";
import Module from "../module"

export default class Economy extends Module {
    workCooldowns: Collection<string, number> = new Collection<string, number>(); // String/number is userid/reset after

    onReady(): void {
        this.name = "Economy";

        this.commands.push({name: "balance", executor: (i) => this.balanceCmd(i), builder: new SlashCommandSubcommandBuilder()
            .setName("balance").setDescription("Gets your balance")});

        this.commands.push({name: "register", executor: (i) => this.registerCmd(i), builder: new SlashCommandSubcommandBuilder().setName("register").setDescription("Registers you in the database")});

        this.commands.push({name: "work", executor: (i) => this.workCmd(i), builder: new SlashCommandSubcommandBuilder().setName("work").setDescription("Makes you work and earn money :sungl:")});

        this.commands.push({name: "pay", executor: (i) => this.payCmd(i), builder: new SlashCommandSubcommandBuilder().setName("pay").setDescription("Pays someone a certain amount of money")
            .addUserOption(input => input.setName("user").setDescription("The user to pay").setRequired(true))
            .addNumberOption(input => input.setName("amount").setDescription("The amount of money to pay").setRequired(true))});
    }  
    
    async registeredCheck(i: CommandInteraction) {
        const result = await Account.findOne({userID: i.user.id});
        if(!result) {
            i.reply("**First, register with `/economy register`.**");
            return null;
        }

        return result;
    }

    async isRegistered(u: User) {
        return await Account.findOne({userID: u.id});
    }

    async workCmd(i: CommandInteraction) {
        const cooldown = this.workCooldowns.get(i.user.id);
        if(cooldown && cooldown > Date.now()) {
            i.reply({content: "You are on cooldown.", ephemeral: true});
            return;
        }
        if(cooldown) {
            this.workCooldowns.delete(i.user.id);
        }
        // We're done with cooldowns, now let's check if they are registered.
        const account = await this.registeredCheck(i);
        if(!account) return;

        const randAmount = Math.round(Math.random() * 100);
        account.balance += randAmount;
        await account.save();

        i.reply(`:white_check_mark: **You worked and made $${randAmount}!**`)
        this.workCooldowns.set(i.user.id, Date.now() + 60 * 1000);
    }

    async registerCmd(i: CommandInteraction) {
        const res = await Account.findOne({userID: i.user.id});
        if(res) {
            i.reply({content: "You are already registered.", ephemeral: true});
            return;
        }
        const acc = new Account({userID: i.user.id});
        await acc.save();
            
        i.reply("Registered!");
    }

    async balanceCmd(i: CommandInteraction) {
        const account = await this.registeredCheck(i);
        if(!account) return;

        const embed = new MessageEmbed()
            .setAuthor({iconURL: i.user.avatarURL(), name: i.user.tag})
            .setDescription(`$${account.balance}`);
        
        i.reply({embeds: [embed]});
    }

    async payCmd(i: CommandInteraction) {
        const account = await this.registeredCheck(i);
        if(!account) return;

        const user = i.options.getUser("user", true);
        const amount = i.options.getNumber("amount", true);
        
        if(user.id == this.client.application.id) {
            return i.reply({content: ":x: **I'm a robot, I can't get money!**", ephemeral: true});
        }

        if(user.id == i.user.id) {
            return i.reply({content: ":x: **You can't pay yourself.**", ephemeral: true});
        }

        const res = await this.isRegistered(user);

        if(!res) {
            return i.reply({content: ":x: **This user is not registered.**", ephemeral: true});
        }
        
        if(account.balance < amount) {
            return i.reply({content: "You can't afford this.", ephemeral: true});
        }

        res.balance += amount;
        account.balance -= amount;
        await account.save();
        await res.save();

        i.reply(":white_check_mark: **Success!**");

    }
}