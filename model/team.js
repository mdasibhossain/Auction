const mongoose = require("mongoose");
const teamSchema = new mongoose.Schema({
   teamName: { type: String, required: true, unique: true },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    maxBudget: { type: Number, default: 0 },
    remainingBudget: { type: Number, default: 0 }
});
module.exports = mongoose.model("Team", teamSchema);