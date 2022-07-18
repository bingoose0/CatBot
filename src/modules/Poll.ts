import { PartialRoleData } from "discord.js";
import { Document } from "mongoose";
import PollData from "../models/PollData";
import Module from "../Module";

const schema = PollData.schema;
export default class Poll extends Module {
    name = "Poll";

    async onReady() {
        this.info("Registering events");
        const polls = PollData.find().cursor();
        for(let doc = await polls.next(); doc != null; doc = await polls.next()) {
            this.registerEvent(doc.id, doc.endsAt, doc.channelId, doc.participants, doc.prize);
        }
    }

    registerEvent(pollId: string, endsAt: Date, channelId: string, participants: Array<string>, prize: string) {
        setTimeout(async () => {
            const channel = this.client.channels.cache.get(channelId);
            if(!channel) {
                return await PollData.findByIdAndDelete(pollId);
            }

            
        }, Date.now() - endsAt.getDate());
    }
}