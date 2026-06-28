const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const auctionRoute = require("./routes/router");
const Player = require("./model/player");
const Team = require("./model/team");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const projectRoot = path.resolve(__dirname);
const viewsPath = path.join(projectRoot, "views");
const uploadsPath = path.join(projectRoot, "uploads");

// connect Database
const connectDB = async () => {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL;

    if (!mongoUri) {
        console.warn("MONGODB_URI not set. Skipping database connection.");
        return;
    }

    try {
        await mongoose.connect(mongoUri);
        console.log("db is connected");
    } catch (error) {
        console.log("db is not connected");
        console.log(error.message);
    }
};
connectDB();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.use("/uploads", express.static(uploadsPath));
app.use(express.static(viewsPath));


app.use(auctionRoute);

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`server is runing http://localhost:${PORT}`);
    });
}

module.exports = app;