import { User } from "discord.js";
import Command from "./Command";

export default interface Cooldown {
    user: User,
    use_after: number,
    command: Command
}