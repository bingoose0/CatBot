import { EmbedBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";
import Command from "../Command";
import Module from "../Module";

export default class Info extends Module {
    name = "Info"

    onReady(): void {
        this.commands.push({
            name: "userinfo",
            builder: new SlashCommandSubcommandBuilder().setName("userinfo").setDescription("Displays someone's info").addUserOption(o => o.setName("person").setDescription("The person to look up")),
            callback: (i) => this.userInfoCmd(i)
        });
        
        this.commands.push({
            name: "guildinfo",
            builder: new SlashCommandSubcommandBuilder().setName("guildinfo").setDescription("Displays the guild's info"),
            callback: (i) => this.guildInfoCmd(i)
        });

        this.commands.push({
            name: "botinfo",
            builder: new SlashCommandSubcommandBuilder().setName("botinfo").setDescription("Displays the bot's info"),
            callback: (i) => this.botInfoCmd(i)
        });
    }

    async userInfoCmd(i: CommandInteraction) {
        let person = i.options.getUser("person", false);
        if(!person) person = i.user;

        const embed = new MessageEmbed()
            .setAuthor({name: person.tag, iconURL: person.displayAvatarURL()})
            .setColor("GREEN")
            .addField("Created", `<t:${Math.round(person.createdTimestamp / 1000)}:R>`)
            .addField("Mention", `<@${person.id}>`);

        const member = i.guild?.members.cache.get(person.id);
        if(member) {
            embed.addField("Joined", `<t:${Math.round(member.joinedTimestamp / 1000)}:R>`);
        }

        i.reply({embeds: [embed]});
    }

    async guildInfoCmd(i: CommandInteraction) {
        const guild = i.guild;
        if(!guild) return i.reply({content: ":x: **You can only use this in a guild.**", ephemeral: true});

        const embed = new MessageEmbed()
            .setAuthor({name: guild.name, iconURL: guild.iconURL({dynamic: true})})
            .setColor("GREEN")
            .addField("Created", `<t:${Math.round(guild.createdTimestamp / 1000)}:R>`)
            .addField("Owner", `<@${guild.ownerId}>`);
        
        i.reply({embeds: [embed]});
    }

    async botInfoCmd(i: CommandInteraction) {
        const upSince: Date = global.upSince;
        const roundedUpSince = Math.round(upSince.getTime() / 1000);

        const embed = new MessageEmbed()
            .setTitle("CatBot")
            .setColor("GREEN")
            .addField("Up Since", `<t:${roundedUpSince}:R>`)
            .addField("Description", "CatBot is a bot that runs in bingus' dump truck.");

        i.reply({embeds: [embed]});
    }
}