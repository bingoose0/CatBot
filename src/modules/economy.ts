import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed, User } from "discord.js";
import Account from "../models/Account";
import Module from "../Module"

export default class Economy extends Module {

    onReady(): void {
        this.name = "Economy";

        this.commands.push({name: "balance", callback: (i) => this.balanceCmd(i), builder: new SlashCommandSubcommandBuilder()
            .setName("balance").setDescription("Gets your balance")});

        this.commands.push({name: "register", callback: (i) => this.registerCmd(i), builder: new SlashCommandSubcommandBuilder().setName("register").setDescription("Registers you in the database")});

        this.commands.push({name: "work", callback: (i) => this.workCmd(i), builder: new SlashCommandSubcommandBuilder().setName("work").setDescription("Makes you work and earn money :sungl:"), cooldown: 50});

        this.commands.push({name: "pay", callback: (i) => this.payCmd(i), builder: new SlashCommandSubcommandBuilder().setName("pay").setDescription("Pays someone a certain amount of money")
            .addUserOption(input => input.setName("user").setDescription("The user to pay").setRequired(true))
            .addNumberOption(input => input.setName("amount").setDescription("The amount of money to pay").setRequired(true))});

        this.commands.push({name: "gamble", cooldown: 50, callback: (i) => this.gambleCmd(i), builder: new SlashCommandSubcommandBuilder().setName("gamble").setDescription("Gambles an amount of money")
            .addNumberOption(option => option.setName("amount").setDescription("Amount to gamble").setRequired(true))});
    }  
    
    async registeredCheck(i: CommandInteraction) {
        const result = await Account.findOne({userID: i.user.id});
        if(!result) {
            i.reply("**First, register with `/economy register`.**");
            return false;
        }

        return result;
    }

    async getAccount(u: User) {
        return await Account.findOne({userID: u.id});
    }

    async workCmd(i: CommandInteraction) {
        const account = await this.registeredCheck(i);
        if(!account) return;

        const randAmount = Math.round(Math.random() * 100);
        account.balance += randAmount;
        await account.save();

        i.reply(`:white_check_mark: **You worked and made $${randAmount}!**`)
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

        const res = await this.getAccount(user);

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

    async gambleCmd(i: CommandInteraction) {
        const amount = i.options.getNumber("amount");
        if(amount > 200) return i.reply({content: ":x: **The amount must be below 200**.", ephemeral: true});
        const account = await this.registeredCheck(i);
        if(!account) return;

        if(account.balance < amount) return i.reply("You can't afford this.");

        const chance = Math.round(Math.random() * 2);
        if(chance == 1) {
            account.balance += amount;
            await account.save()
            i.reply("**You won, congrats!**");
        }

        account.balance -= amount;
        await account.save();
        i.reply("**You lost, oh noe!**");

    }
}