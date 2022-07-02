import { Schema, model } from "mongoose";

const accountSchema = new Schema({
    userID: String,
    balance: {type: Number, default: 1000},
    hoursWorked: Number
});

export default model("Account", accountSchema);