const { watch } = require("fs");
var https = require("https");

const config = require("./config.json");

async function getLists() {
    var query = `
    query ($user: String) {
        MediaListCollection(userName: $user, type: ANIME) {
            lists {
                name
                entries {
                    media {
                        title {
                            english
                        }
                        streamingEpisodes {
                            title
                            url
                            site
                        }
                    }
                    progress
                    score
                }
            }
        }
    }
    `;

    var variables = {
        'user': config.anilist_username
    };

    const data = JSON.stringify({query: query, variables: variables});

    const options = {
        hostname: 'graphql.anilist.co',
        path: '/',
        port: 443,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
            'User-Agent': 'Node',
        }
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (d) => {
                data += d;
            });
            res.on('end', () => {
                try{
                    resolve(JSON.parse(data).data);
                }
                catch (e){
                    console.log("Got gibberish from anilist :(");
                    resolve();
                }
            });
        });

        req.on('error', (error) => {
            console.log(error);
            resolve();
        });

        req.write(data);
        req.end();
    });
}

function getEpisodes(lists){
    //maybe add Dropped?
    const weCareAboutThese = ["Completed", "Paused", "Watching"];

    var lists = lists.MediaListCollection.lists;
    var watchedLinks = [];
    lists.forEach((list) => {
        if (weCareAboutThese.indexOf(list.name) != -1){
            list.entries.forEach((entry)=>{
                //only care about the ones we have crunchroll links for
                if (entry.media.streamingEpisodes.length > 0){
                    //if theres more than one episode we should check to see if we've watched it or not
                    if (entry.media.streamingEpisodes.length > 1){
                        entry.media.streamingEpisodes.forEach((episode)=>{
                            if (episode.site === "Crunchyroll"){
                                //take our best guess at the episode number from the title
                                //anilist should really be better about this...
                                const numbersInTitle = episode.title.match(/[-+]?\d*(\.(?=\d))?\d+/g);
                                if (numbersInTitle){
                                    const episodeNum = numbersInTitle[0];
                                    if (entry.progress >= episodeNum){
                                        watchedLinks.push(episode.url);
                                    }
                                }
                            }
                        });
                    }
                    //if there's only one episode, no need to check progress
                    else{
                        const episode = entry.media.streamingEpisodes[0];
                        if (episode.site === "Crunchyroll") watchedLinks.push(episode.url);
                    }
                }
            });
        }
    });

    return watchedLinks;
}

function getLinks() {
    return new Promise((resolve) => {
        getLists().then((l)=>{
            if (l){
                resolve(getEpisodes(l));
            }
            else resolve();
        });
    });
}

module.exports.getLinks = getLinks;