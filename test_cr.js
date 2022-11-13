var cr_interact = require("./cr_interact")


//plays random episode in crunchyroll
//then starts another once that episode finishes
async function getAndPlay(){
    console.log("Choosing episode...")
    let link = "https://www.crunchyroll.com/watch/G6491JPVY/duel-identity-part-1";
    console.log("Chose: ", link);

    console.log("Automating episode playback...")
    cr_interact.playVideo(link).then(()=>{
        console.log("Video is finished, starting another..");
        getAndPlay();
    });
}

//init
getAndPlay();