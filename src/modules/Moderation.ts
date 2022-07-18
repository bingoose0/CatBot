import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CommandInteraction, Guild, GuildMember, Message, MessageEmbed } from "discord.js";
import Account from "../models/Account";
import GuildSettings from "../models/GuildSettings";
import Module from "../Module";

export default class Moderation extends Module {
    name = "Moderation";

    memberJoinListener = (m: GuildMember) => this.onMemberJoin(m);

    onReady() {
        this.client.on('guildMemberAdd', this.memberJoinListener);
        this.commands.push({
            name: "settings",
            builder: new SlashCommandSubcommandBuilder().setName("settings").setDescription("The guild settings")
                .addChannelOption(o => o.setName("welcome_channel").setDescription("The channel for welcome messages to show"))
                .addChannelOption(o => o.setName("modlog_channel").setDescription("The channel for moderation logs to be in"))
                .addStringOption(o => o.setName("welcome_message").setDescription("The welcome message to use. Example: \"Welcome, {mention}\"")),
            
            callback: (i) => this.settings(i)
        })
    }
    
    onDisabled(): void {
        this.client.removeListener("guildMemberAdd", this.memberJoinListener);
    }

    async settings(i: CommandInteraction) {
        await i.deferReply({ephemeral: true});
        if(!i.guild) return i.editReply({ content: "You must use this in a guild." });
        if(!i.memberPermissions.has('ADMINISTRATOR')) return i.editReply({ content: ":x: **You cannot use this command.**" });

        const wlcmMessage = i.options.getString("welcome_message", false);
        const welcomeChannel = i.options.get("welcome_channel", false);
        const modlogChannel = i.options.getChannel("modlog_channel", false);

        if(!welcomeChannel && !wlcmMessage && !modlogChannel) {
            const settings = await this.getGuildSettings(i.guild);
            if(!settings) return i.editReply({content: "You have not set anything yet. Please use the optional arguments to configure your settings."})
            const embed = new MessageEmbed()
                .setTitle(`${i.guild.name} settings`)
                .setColor("BLURPLE");
            
            if(settings.welcomeChannel) {
                embed.addField("Welcome Channel", `<#${settings.welcomeChannel}>`);
            }

            if(settings.modLogChannel) {
                embed.addField("Modlog Channel", `<#${settings.modLogChannel}>`);
            }

            return await i.editReply({ embeds: [embed] });
        }

        const modificationsToMake = { guildId: i.guild.id /* Because we also might be creating it */, modLogChannel: modlogChannel?.id, welcomeChannel: welcomeChannel?.id }

        if(wlcmMessage) {
            modificationsToMake['welcomeChannelMessage'] = wlcmMessage;
        }

        if(!await GuildSettings.exists(i.guild)) {
            const guildSettings = new GuildSettings(modificationsToMake);
            await guildSettings.save();
        } else {
            await GuildSettings.updateOne({guildId: i.guildId}, modificationsToMake);
        }

        await i.editReply({content: ":white_check_mark: **Success!**"})
    }

    async getGuildSettings(guild: Guild) {
        const id = guild.id;
        const account = await GuildSettings.findOne({guildId: id});
        
        if(!account) return null;
        return account;
    }

    async onMemberJoin(member: GuildMember) {
        const settings = await this.getGuildSettings(member.guild);
        if(!settings) return;

        const channelId = settings.welcomeChannel;
        if(!channelId) return;

        const channel = this.client.channels.cache.get(channelId);
        if(!channel || !channel.isText()) return;

        try {
            await channel.send(settings.welcomeChannelMessage.replace("{mention}", `<@${member.id}>`));
        } catch {
            return;
        }
    }

}