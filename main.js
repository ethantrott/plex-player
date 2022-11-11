// Aniplayer
// 2022 Ethan Trott

var anilist = require("./anilist");
var cr_interact = require("./cr_interact")

async function getAndPlay(){
    console.log("Choosing episode...")
    anilist.randLink.then((link)=>{
        console.log("Chose: "+ link);
        console.log("Automating episode playback...")
        cr_interact.playVideo(link);
    });
}

getAndPlay();