// Aniplayer
// 2022 Ethan Trott

var anilist = require("./anilist");
var cr_interact = require("./cr_interact")

var linkCache = {links:[], uses:0};

//populate cache with anime links
function updateCache(){
    console.log("Updating anilist cache..")
    return new Promise((resolve)=>{
        anilist.getLinks().then((links)=>{
            if (links){
                linkCache.links = links;
                console.log(`Anilist cache updated, ${linkCache.links.length} videos found.`);
            }
            else{
                //if we get here, anilist is unavailable or rejecting our request
                //if we have an existing cache, that's fine
                if (linkCache.links.length > 0){
                    console.log("Cache update failed, using existing cache...");
                }
                //otherwise, sadness :(
                else{
                    console.log("Cannot get links from anilist :(");
                    process.exit();
                }
            }
            resolve();
        });
    });
}

//returns a random link from the cache
function chooseLink(){
    linkCache.uses++;
    if (linkCache.uses > 10){
        linkCache.uses = 0;
        updateCache();
    }
    return linkCache.links[Math.floor(Math.random() * linkCache.links.length)];
}

//plays random episode in crunchyroll
//then starts another once that episode finishes
async function getAndPlay(){
    console.log("Choosing episode...")
    let link = chooseLink();
    console.log("Chose: ", link);

    console.log("Automating episode playback...")
    cr_interact.playVideo(link).then(()=>{
        console.log("Video is finished, starting another..");
        console.log("---------------------")
        getAndPlay();
    });
}

//init
updateCache().then(()=>getAndPlay());