import { Schema, model } from "mongoose";

const guildSettingsSchema = new Schema({
    guildId: String,
    modLogChannel: {type: String, required: false},
    welcomeChannel: {type: String, required: false},
    welcomeChannelMessage: {type: String, default: "Welcome, {mention}!"}
})

export default model("GuildSettings", guildSettingsSchema);