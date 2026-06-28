const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Player = require("../model/player");
const Team = require("../model/team");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

//Picture upload location
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
exports.upload = multer({ storage: storage });



exports.getHome = (req, res) => {
    res.sendFile(path.join(__dirname, "..", "views", "Oction.html"));
};
exports.getlogin = (req, res) => {
    res.sendFile(path.join(__dirname, "..", "views", "AuctionUI.html"));
};
exports.getdashboard = async (req, res) => {
    try {
        const totalPlayersCount = await Player.countDocuments();
        const soldPlayersCount = await Player.countDocuments({ status: "Sold" });
        const unsoldPlayersCount = await Player.countDocuments({ status: "Unsold_Done" });
        const totalTeamsCount = await Team.countDocuments();

        
        let htmlContent = fs.readFileSync(path.join(__dirname, "..", "views", "auctionPanel.html"), "utf-8");
        htmlContent = htmlContent.replace("{{TOTAL_PLAYERS_COUNT}}", totalPlayersCount);
        htmlContent = htmlContent.replace("{{SOLD_PLAYERS_COUNT}}", soldPlayersCount);
        htmlContent = htmlContent.replace("{{UNSOLD_PLAYERS_COUNT}}", unsoldPlayersCount);
        htmlContent = htmlContent.replace("{{TOTAL_TEAMS_COUNT}}", totalTeamsCount);

        return res.send(htmlContent);
    }
    catch (error) {
        return res.status(500).send("ড্যাশবোর্ড লোড করতে সমস্যা হয়েছে: " + error.message);
    }
};



exports.postlogin = (req, res) => {
    const { email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        res.redirect("/dashboard");
    } else {
        res.status(401).json({ success: false, message: "Invalid Username or Password!" });
    }
};

exports.postdashboard = (req, res) => {
    res.json({ message: "Dashboard data submitted successfully!" })

};

// New Registration for save Database.
exports.postRegister = async (req, res) => {
    try {

        const newPlayer = new Player({
            playerName: req.body.playerName,
            Batch: req.body.Batch,
            playerPosition: req.body.playerPosition,
            phone: req.body.phone,
            playerPhoto: req.file ? req.file.filename : "",

            Payment_Method: req.body.Payment_Method,
            transaction: req.body.transaction
        });

        await newPlayer.save();

        
        return res.send("<h1>Registration Successful!</h1><a href='/'>Go Back to Home</a>");
    } catch (error) {
        return res.status(500).send("Error saving data: " + error.message);
    }
};

// Rest api get player details
exports.getTotalPlayersPage = async (req, res) => {

    try {
        const { position, category } = req.query;
        let query = {};
        if (position) {
            query.playerPosition = position;
        }
        if (category) {
            query.playerCategory = category;
        }

        const players = await Player.find(query);
        let htmlContent = fs.readFileSync(path.join(__dirname, "..", "views", "totalPlayers.html"), "utf-8");// for html file read 
        // for create a table
        let rows = "";
        players.forEach(player => {
            rows += `
                <tr>
                    <td><strong>${player.playerName}</strong></td>
                    <td>${player.Batch}</td>
                    <td><span style="background: #0f172a; padding: 4px 8px; border-radius:4px;">${player.playerPosition}</span></td>
                    <td><span style="background: #1e3a8a; color: #93c5fd; padding: 4px 8px; border-radius:4px; font-weight: bold;">${player.playerCategory || 'Unassigned'}</span></td>
                    <td>${player.phone}</td>
                </tr>
            `;
        });

        if (rows === "") {
            rows = `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding: 20px;">No players found matching the filters!</td></tr>`;
        }
        htmlContent = htmlContent.replace("{{TABLE_BODY}}", rows);
        return res.send(htmlContent);

    } catch (error) {
        return res.status(500).send(error.message);
    }
};




exports.getLiveAuctionPage = async (req, res) => {
    try {
        const { category } = req.query;
        let query = { status: "Unsold" };

        if (category && category.trim() !== "") {
            query.playerCategory = category;
        }

        const player = await Player.findOne(query);

        const teams = await Team.find();
        let teamOptions = teams.map(t => `<option value="${t.teamName}">${t.teamName}</option>`).join("");

        let htmlContent = fs.readFileSync(path.join(__dirname, "..", "views", "oction-card.html"), "utf-8");


        if (!player) {
            htmlContent = htmlContent.replace("{{TEAM_OPTIONS}}", "")
                .replace("__PLAYER_NAME__", "No Unsold Players!")
                .replace("__DISABLE_SOLD__", "disabled style='opacity: 0.5; cursor: not-allowed;'")
                .replace("__DISABLE_UNSOLD__", "disabled style='opacity: 0.5; cursor: not-allowed;'");
            return res.send(htmlContent);
        }

        const playerPhoto = player.playerPhoto ? player.playerPhoto : "default.png";
        const currentCategory = player.playerCategory || "Not Assigned Yet";

        htmlContent = htmlContent.replace("{{TEAM_OPTIONS}}", teamOptions)
            .replace("__PLAYER_NAME__", player.playerName)
            .replace("__PLAYER_POSITION__", player.playerPosition)
            .replace("__PLAYER_BATCH__", player.Batch)
            .replace("__PLAYER_CATEGORY__", currentCategory)
            .replace("__PLAYER_IMAGE__", playerPhoto)
            .replace("__FORM_ACTION__", `/live-auction/sold/${player._id}?category=${encodeURIComponent(category || '')}`)
            .replace("__FORM_UNSOLD_ACTION__", `/live-auction/unsold/${player._id}?category=${encodeURIComponent(category || '')}`)
            .replace("__DISABLE_SOLD__", "")
            .replace("__DISABLE_UNSOLD__", "");

        return res.send(htmlContent);
    } catch (error) {
        return res.status(500).send("লাইভ অকশন পেজ লোড করতে সমস্যা হয়েছে: " + error.message);
    }
};


exports.postMarkAsSold = async (req, res) => {
    try {
        const { id } = req.params;
        const { category } = req.query;
      
        const { teamName, bidPrice } = req.body; 

        await Player.findByIdAndUpdate(id, {
            status: "Sold",
            soldToTeam: teamName,
            soldPrice: bidPrice 
        });

    
        if (teamName) {
            const price = parseInt(bidPrice) || 0;
            
            await Team.findOneAndUpdate(
                { teamName: teamName }, 
                { 
                    $push: { players: id },
                    $inc: { remainingBudget: -price } 
                }
            );
        }

        if (category) {
            return res.redirect(`/live-auction?category=${encodeURIComponent(category)}`);
        }
        return res.redirect("/live-auction");
        
    } catch (error) {
        return res.status(500).send("প্লেয়ার Sold করতে সমস্যা হয়েছে: " + error.message);
    }
};

exports.postMarkAsUnsold = async (req, res) => {
    try {
        const { id } = req.params;
        const { category } = req.query;
        await Player.findByIdAndUpdate(id, { status: "Unsold_Done" });
        if (category) {
            return res.redirect(`/live-auction?category=${encodeURIComponent(category)}`);
        }
        return res.redirect("/live-auction");
    } catch (error) {
        return res.status(500).send("প্লেয়ার Unsold মার্ক করতে সমস্যা হয়েছে: " + error.message);
    }
};


exports.getSoldPlayersPage = async (req, res) => {
    try {
        const { position, category } = req.query;
        let query = { status: "Sold" };

        if (position && position.trim() !== "") {
            query.playerPosition = position;
        }
        if (category && category.trim() !== "") {
            query.playerCategory = category;
        }
        const soldPlayers = await Player.find(query);

        let htmlContent = fs.readFileSync(path.join(__dirname, "..", "views", "totalPlayers.html"), "utf-8");

        htmlContent = htmlContent.replace("<th>Phone Number</th>", "<th>Phone Number</th><th>Status</th>")
            .replace("<th>Phone</th>", "<th>Phone</th><th>Status</th>");

        let rows = "";
        soldPlayers.forEach(player => {
            const playerCat = player.playerCategory || "Not Assigned";

            rows += `
                <tr>
                    <td><strong>${player.playerName}</strong></td>
                    <td>${player.Batch}</td>
                    <td><span style="background: #0f172a; padding: 4px 8px; border-radius:4px;">${player.playerPosition}</span></td>
                    <td><span style="background: #1e3a8a; color: #93c5fd; padding: 4px 8px; border-radius:4px; font-weight: bold;">${playerCat}</span></td>
                    <td>${player.phone}</td>
                    <td><span style="background: #15803d; color: #bbf7d0; padding: 4px 8px; border-radius:4px; font-weight: bold;">Sold</span></td>
                </tr>
            `;
        });


        if (rows === "") {
            rows = `<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding: 20px;">এখনো কোনো প্লেয়ার Sold করা হয়নি!</td></tr>`;
        }


        if (htmlContent.includes("{{TABLE_BODY}}")) {
            htmlContent = htmlContent.replace("{{TABLE_BODY}}", rows);
        } else {
            htmlContent = htmlContent.replace("<tbody></tbody>", `<tbody>${rows}</tbody>`);
        }

        htmlContent = htmlContent.replace("Total Registered Players", "Sold Players List");
        return res.send(htmlContent);

    } catch (error) {
        return res.status(500).send("Sold প্লেয়ারদের তালিকা লোড করতে সমস্যা হয়েছে: " + error.message);
    }
};


exports.getUnsoldPlayersPage = async (req, res) => {
    try {

        const { position, category } = req.query;
        let query = { status: "Unsold_Done" };

        if (position && position.trim() !== "") {
            query.playerPosition = position;
        }
        if (category && category.trim() !== "") {
            query.playerCategory = category;
        }
        const unsoldPlayers = await Player.find(query);
        let htmlContent = fs.readFileSync(path.join(__dirname, "..", "views", "totalPlayers.html"), "utf-8");
        htmlContent = htmlContent.replace("<th>Phone Number</th>", "<th>Phone Number</th><th>Status</th><th>Action</th>")
            .replace("<th>Phone</th>", "<th>Phone</th><th>Status</th><th>Action</th>");

        let rows = "";
        unsoldPlayers.forEach(player => {
            const playerCat = player.playerCategory || "Not Assigned";

            rows += `
                <tr>
                    <td><strong>${player.playerName}</strong></td>
                    <td>${player.Batch}</td>
                    <td><span style="background: #0f172a; padding: 4px 8px; border-radius:4px;">${player.playerPosition}</span></td>
                    <td><span style="background: #1e3a8a; color: #93c5fd; padding: 4px 8px; border-radius:4px; font-weight: bold;">${playerCat}</span></td>
                    <td>${player.phone}</td>
                    <td><span style="background: #991b1b; color: #fecaca; padding: 4px 8px; border-radius:4px; font-weight: bold;">Unsold</span></td>

                    <td>
                        <form action="/unsold-players/bring-back/${player._id}" method="POST" style="margin:0;">
                            <button type="submit" style="background: #2563eb; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">
                                Bring to Auction 🔄
                            </button>
                        </form>
                    </td>
                </tr>
            `;
        });

        if (rows === "") {
            rows = `<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding: 20px;">এখনো কোনো প্লেয়ার Unsold করা হয়নি!</td></tr>`;
        }

        if (htmlContent.includes("{{TABLE_BODY}}")) {
            htmlContent = htmlContent.replace("{{TABLE_BODY}}", rows);
        } else {
            htmlContent = htmlContent.replace("<tbody></tbody>", `<tbody>${rows}</tbody>`);
        }

        htmlContent = htmlContent.replace("Total Registered Players", "Unsold Players List");
        return res.send(htmlContent);

    } catch (error) {
        return res.status(500).send("Unsold প্লেয়ারদের তালিকা লোড করতে সমস্যা হয়েছে: " + error.message);
    }
};

exports.postBringBackToAuction = async (req, res) => {
    try {
        const { id } = req.params;

        await Player.findByIdAndUpdate(id, { status: "Unsold" });


        return res.redirect("/unsold-players");
    } catch (error) {
        return res.status(500).send("প্লেয়ার পুনরায় অকশনে ফেরাতে সমস্যা হয়েছে: " + error.message);
    }
};




exports.postSetupTournament = async (req, res) => {
    try {
        const { teamNames } = req.body;
        if (teamNames && teamNames.trim() !== "") {
            await Team.create({ teamName: teamNames });
        }


        res.redirect('/total-teams');
    } catch (error) {
        res.status(500).send("টিম সেটআপে সমস্যা: " + error.message);
    }
};



exports.getTotalTeamsPage = async (req, res) => {
    try {
        const teams = await Team.find().populate('players');
        let htmlContent = fs.readFileSync(path.join(__dirname, "..", "views", "totalTeams.html"), "utf-8");

        let allTeamsHtml = "";

        teams.forEach(team => {
            let playerRows = team.players.length > 0
                ? team.players.map(p => `
        <tr>
            <td>${p.playerName || 'N/A'}</td>
            <td>${p.playerPosition || 'N/A'}</td>
            <td>${p.playerCategory || 'Not Set'}</td>
            <td>${p.phone || 'N/A'}</td>
        </tr>
    `).join("")
                : "<tr><td colspan='4' style='text-align:center;'>No players assigned yet.</td></tr>";

           
            allTeamsHtml += `
                <div class="team-container">
                    <div class="team-header">
                        <h2>Team: ${team.teamName}</h2>
                        <form action="/delete-team/${team._id}" method="POST" onsubmit="return confirm('আপনি কি নিশ্চিত? এই টিমটি ডিলিট করতে চান?');">
                            <button type="submit" class="delete-btn">Delete Team</button>
                        </form>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Player Name</th>
                                <th>Position</th>
                                <th>Category</th>
                                <th>Phone</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${playerRows}
                        </tbody>
                    </table>
                </div>
            `;
        });

   
        htmlContent = htmlContent.replace("{{TEAM_DATA_ROWS}}", allTeamsHtml);
        res.send(htmlContent);

    } catch (error) {
        res.status(500).send("টিম লিস্ট লোড করতে সমস্যা: " + error.message);
    }
};



exports.deleteTeam = async (req, res) => {
    try {
        const teamId = req.params.id;
        await Team.findByIdAndDelete(teamId);
        res.redirect('/total-teams');
    } catch (error) {
        res.status(500).send("টিম ডিলিট করতে সমস্যা হয়েছে: " + error.message);
    }
};


exports.getTeamBudgetPage = async (req, res) => {
    try {
        const teams = await Team.find();
        
    
        let teamOptions = teams.map(t => `<option value="${t._id}">${t.teamName}</option>`).join("");
        

        let teamRows = teams.map(t => `
            <tr>
                <td>${t.teamName}</td>
                <td>${t.maxBudget || 0}</td>
                <td>${t.remainingBudget !== undefined ? t.remainingBudget : (t.maxBudget || 0)}</td>
            </tr>
        `).join("");

        let htmlContent = fs.readFileSync(path.join(__dirname, "..", "views", "teamBudget.html"), "utf-8");
        htmlContent = htmlContent.replace("{{TEAM_OPTIONS}}", teamOptions)
                                 .replace("{{TEAM_SUMMARY_ROWS}}", teamRows);
        
        return res.send(htmlContent);
    } catch (error) {
        return res.status(500).send("বাজেট পেজ লোড করতে সমস্যা: " + error.message);
    }
};

exports.postUpdateBudget = async (req, res) => {
    try {
        const { teamId, budget } = req.body;
   
        await Team.findByIdAndUpdate(teamId, { 
            maxBudget: budget, 
            remainingBudget: budget 
        });
        res.redirect('/team-budget');
    } catch (error) {
        res.status(500).send("বাজেট আপডেট করতে সমস্যা: " + error.message);
    }
};