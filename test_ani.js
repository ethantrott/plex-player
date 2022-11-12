var anilist = require("./anilist");

var linkCache = {links:[], uses:0};

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

function chooseLink(){
    linkCache.uses++;
    if (linkCache.uses > 10){
        linkCache.uses = 0;
        updateCache();
    }
    return linkCache.links[Math.floor(Math.random() * linkCache.links.length)];
}

async function playVideo(){
    return new Promise(resolve => setTimeout(resolve, 1000));
    //return new Promise(resolve => resolve());
}

async function getAndPlay(){
    console.log("Choosing episode...")
    let link = chooseLink();
    console.log("Chose: ", link);

    console.log("Automating episode playback...")
    playVideo().then(()=>{
        console.log("Video is finished, starting another..");
        getAndPlay();
    });
}

updateCache().then(()=>getAndPlay());