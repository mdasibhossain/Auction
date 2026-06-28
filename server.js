const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const auctionRoute = require("./routes/router");
const Player = require("./model/player");
const Team = require("./model/team");
require('dotenv').config();

const app = express();
const PORT = 3000;

// connect Database
const conectDB = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/futsalDB');
        console.log("db is coneccted");
    } catch (error) {
        console.log("db is not connected");
        console.log(error.message);
        process.exit(1);
    }
};
conectDB();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "views")));





app.use(auctionRoute);

app.listen(PORT, () => {
    console.log(`server is runing http://localhost:${PORT}`);
});