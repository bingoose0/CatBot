import { Schema, model } from "mongoose";

const pollDataSchema = new Schema({
    endsAt: Date,
    channelId: String,
    participants: {type: Array<String>, default: []},
    prize: String // The prize to make
});

export default model("PollData", pollDataSchema);