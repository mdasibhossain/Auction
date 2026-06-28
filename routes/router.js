const express = require("express");
const router = express.Router();
const auctionController = require("../Controllers/controller");


router.get("/", auctionController.getHome);

router.post("/register", auctionController.upload.single("playerPhoto"), auctionController.postRegister);

router.get("/login", auctionController.getlogin);
router.post("/login", auctionController.postlogin);

router.get("/dashboard", auctionController.getdashboard);

router.get("/total-players", auctionController.getTotalPlayersPage);

router.get("/live-auction", auctionController.getLiveAuctionPage);
router.post("/live-auction/sold/:id", auctionController.postMarkAsSold);
router.post("/live-auction/unsold/:id", auctionController.postMarkAsUnsold);

router.get("/sold-players", auctionController.getSoldPlayersPage);
router.get("/unsold-players", auctionController.getUnsoldPlayersPage);
router.post("/unsold-players/bring-back/:id", auctionController.postBringBackToAuction);



router.post("/setup-tournament", auctionController.postSetupTournament);
router.get("/total-teams", auctionController.getTotalTeamsPage);
router.post("/delete-team/:id", auctionController.deleteTeam);

router.get('/team-budget', auctionController.getTeamBudgetPage);
router.post("/update-budget", auctionController.postUpdateBudget);

// routes/router.js ফাইলে এই অংশটি যোগ করুন
router.get("/logout", (req, res) => {
    res.redirect("/login"); 
});

module.exports = router;