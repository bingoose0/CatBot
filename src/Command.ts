import { SlashCommandSubcommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

export default interface Command {
    name: string,
    builder: SlashCommandSubcommandBuilder,
    executor(i: CommandInteraction);
}