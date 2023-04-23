// Plex Player
// 2023 Ethan Trott

var plex_interact = require("./plex_interact");
var control_api = require("./control_api.js");

const config = require("./config.json");

//plays random episode in crunchyroll
//then starts another once that episode finishes
async function play(){
    let link = config.playlist_link;

    console.log("Automating playback...")
    plex_interact.playVideo(link);
}

//init
play();