const mongoose=require("mongoose");

const playerSchema=new mongoose.Schema({
    playerName: {
        type: String,
        required: true
    },
    Batch: {
        type: String,
        required: true
    },
    playerPosition: {
        type: String,
        required: true
    },
    playerPhoto: {
        type: String,
        default: ""
    },
 
    phone: {
        type: String,
        required: true
    },
    Payment_Method: {
        type: String,
        required: true
    },
    transaction: {
        type: String,
        required: true
    },
    status: {
    type: String,
    default: "Unsold"
},

playerCategory: { type: String, default: "Not Set" }, 

soldToTeam: { type: String, default: "Unassigned" },
    createdAt: {
        type: Date,
        default: Date.now
    }
   
});


module.exports = mongoose.model("Player", playerSchema);