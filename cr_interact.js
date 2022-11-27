const config = require("./config.json");

const { Builder, Browser, By, Key, until, Origin } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome'); 

const options = new chrome.Options();

let driver = new Builder().forBrowser(Browser.CHROME).setChromeOptions(options).build();

let isPaused = false;

//this is the first login system I made. it uses the old crunchyroll login, which seems
//to have more bot protection, leaving here in case we need it, but really login() should be used instead..
async function loginExternal(returnURL){
    //load login page
    await driver.get("https://www.crunchyroll.com/welcome/login");
    
    let currentUrl = await driver.getCurrentUrl();
    if (!currentUrl.includes('already-premium')){
        //wait for username and password fields to render
        await driver.wait(until.elementLocated(By.name('email')), 15 * 1000);
        await driver.wait(until.elementLocated(By.name('password')), 15 * 1000);
        
        //enter username and password
        await driver.findElement(By.name('email')).sendKeys(config.cr_username);
        await driver.findElement(By.name('password')).sendKeys(config.cr_password, Key.ENTER);

        //FIXME: sometimes Enter key is not working for submission (TODO: click LOG IN button if enter doesn't work)

        //make sure we're redirected to the "already premium page"
        await driver.wait(until.urlContains('already-premium'), 15 * 1000);

        console.log("Successfully logged in to Crunchyroll");
    }
    else {
        console.log("Already logged in :)")
    }

    //we can attempt to play the video again now
    playVideo(returnURL);
}

//login function that navigates using the on-page account menu
async function login(returnURL){
    let videoTitle = await driver.getTitle();

    //click user menu
    let userMenu = await driver.findElements(By.className('erc-anonymous-user-menu'));
    await userMenu[0].click();

    //click login
    let signinOptions = await driver.findElements(By.className('nav-item-info'));
    await signinOptions[1].click();

    //wait for login page
    await driver.wait(until.titleContains('Login'), 15 * 1000);

    //wait for username and password fields to render
    await driver.wait(until.elementLocated(By.name('username')), 15 * 1000);
    await driver.wait(until.elementLocated(By.name('password')), 15 * 1000);
    
    //enter username and password
    await driver.findElement(By.name('username')).sendKeys(config.cr_username);
    await driver.findElement(By.name('password')).sendKeys(config.cr_password, Key.ENTER);

    //make sure we get sent back to the video. if we don't, try backup login..
    try{
        await driver.wait(until.titleIs(videoTitle), 15*1000);
        console.log("Logged in to Crunchyroll (primary method)")
    }
    catch(e){
        console.log("Did not get sent back from login sequence. Trying backup login method...");
        loginExternal(returnURL);
    }
}

// checks if we are in loading stage 1
// (element with id "loader-svg" exists)
// FIXME: pretty sure this can be cleaned up with `until.StalenessOf()`
async function loadingStage1() {
    try{
        //check for loading element 1
        await driver.findElement(By.id("loader-svg"));
        //if we get this far, loading element 1 exists
        return true;
    }
    catch(e){
        //if we get here, loading element 1 does not exist
        return false
    }
}

//checks if we are in loading stage 2
//loading stage 2 is done when either the play button appears or the video autoplays
//play button appears when navigating directly to the video page, autoplay happens when referred back by login system
//fun note: i was originally checking [data-testid='vilos-loading'] was present,
//          but that doesnt work because the loading svg stays existent
//          the entire time, its just hidden behind the video player lmao
async function loadingStage2() {
    try{
        //attempt to get play button
        await driver.findElement(By.css("[data-testid='vilos-large_play_pause_button']"));

        //if we get this far, the play button exists and loading has concluded
        return false;
    }
    catch(e){
        try{
            // if we get here, the play button does not exist, we need to check for the in-player video controls
            // to see if the video is autoplaying
            await driver.findElement(By.css("[data-testid='vilos-fullscreen_button']"))

            //if we get this far the fullscreen button exists and loading has concluded
            return false;
        }
        catch (e){
            //if we get here, neither the play or fullscreen button exist, loading continues
            return true;
        }
        
    }   
}

// completes when player is done loading
// the Crunchyroll player has two loading stages
// stage 1: loading the player itself
// stage 2: buffering the content inside the player
async function playerIsDoneLoading(){
    // currently we only monitor stage 2
    // we used to monitor loading stage 1, but I decided to scrap it because
    // it served no purpose and will probably only break things in the future :)

    // let isLoadingStage1 = true;
    // while (isLoadingStage1){
    //     isLoadingStage1 = await loadingStage1();
    //     console.log(isLoadingStage1)
    //     if (!isLoadingStage1) console.log("Loading stage 1 complete.")
    // }

    console.log("Waiting for player load...")

    //wait for video player element to be created
    //FIXME:    this times out if we're getting rate-limited
    //          (they redirect back to a 404 from login)
    await driver.wait(until.elementLocated(By.className('video-player')), 15 * 1000);

    //need to be in the iframe for this (ugh)
    await driver.switchTo().frame(driver.findElement(By.className("video-player")))

    //wait for loading stage 2 to finish
    let isLoadingStage2 = true;
    while (isLoadingStage2) isLoadingStage2 = await loadingStage2();

    console.log("Player finished loading.")

    //exit iframe
    await driver.switchTo().defaultContent();
}

// completes when the video is finished
// completion conditions:
// - time left is <1 second (video finishes naturally)
// - webdriver url changes (user skips video or we miss the time check before crunchyroll autoplays another video)
async function videoIsFinished(){
    let done = false;
    let videoUrl = await driver.getCurrentUrl();
    while (!done){
        let currentUrl = await driver.getCurrentUrl();
        if (videoUrl !== currentUrl){
            console.log("Video URL changed, video must be done.")
            done = true;
        }
        else{
            //get time left in episode
            let duration = await driver.findElement(By.css("video")).getAttribute("duration");
            let progress = await driver.findElement(By.css("video")).getAttribute("currentTime");
            let remaining = duration-progress;

            if (remaining < 1) {
                console.log("Episode has no runtime left.")
                done = true;
            }
        }
    }

}

async function playVideo(videoURL) {
    //load the crunchyroll page
    await driver.get(videoURL);

    //wait a second to allow title + premium button to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    //if we get a 404 page, immediately return so we can try a different video
    const badTitles = ["Watch Popular Anime", "Page not found", "Error occurred"];
    let videoTitle = await driver.getTitle();
    let error = false;
    badTitles.forEach((t)=>{
        if (videoTitle.includes(t)) {
            console.log("404'd")
            error = true;
            return;
        }
    }); 
    if (error) return Promise.resolve();

    //look for "Try Premium" button
    let premiumTag = await driver.findElements(By.className('erc-premium-header-link'));
    //if "Try Premium" button exists, we need to sign in...
    if (premiumTag.length > 0) {
        console.log("User not signed in with premium, attempting login...")
        await login(videoURL);
    }
    else console.log("No premium button, looks good to go");

    //wait for player to load
    await playerIsDoneLoading();

    //have to switch to video player frame. why? idk, selenium.
    await driver.switchTo().frame(driver.findElement(By.className("video-player")));

    //click play button if present
    try{
        let playButton = await driver.findElement(By.css("[data-testid='vilos-large_play_pause_button']"));
        console.log("Found play button, clicking..");
        await playButton.click();
    } catch(e) {
        console.log("No play button present, probably autoplayed");
    }

    //click the fullscreen button
    await driver.wait(until.elementLocated(By.css("[data-testid='vilos-fullscreen_button']")), 15 * 1000);
    await driver.findElement(By.css("[data-testid='vilos-fullscreen_button']")).click();
    console.log("Entered fullscreen");
    
    isPaused = false;

    return new Promise((resolve) => {
        resolve(videoIsFinished());
    });
};

async function clickPauseToggle(){
    await moveMouse();

    //click the play/pause button
    await driver.wait(until.elementLocated(By.css("[data-testid='vilos-play_pause_button']")), 15 * 1000);
    await driver.findElement(By.css("[data-testid='vilos-play_pause_button']")).click();

    resetMouse();

    isPaused = !isPaused;
    console.log("Toggled video pause.");
}

async function pauseVideo(){
    if (!isPaused) clickPauseToggle();
    else console.log("video is already paused")
}

async function resumeVideo(){
    if (isPaused) clickPauseToggle();
    else console.log("video is already playing")
}

async function skipVideo(){
    await moveMouse();

    //click the skip button
    await driver.wait(until.elementLocated(By.css("[data-testid='vilos-next_episode_button']")), 15 * 1000);
    await driver.findElement(By.css("[data-testid='vilos-next_episode_button']")).click();

    resetMouse();

    isPaused = false;
    console.log("Skipped episode");
}

async function moveMouse(){
    driver.actions().move({
        origin: 'pointer',
        x: 20,
        y: 20
    }).perform();
}

async function resetMouse(){
    driver.actions().move({
        origin: 'viewport',
        x: 20,
        y: 20
    }).perform();
}

module.exports.playVideo = playVideo;
module.exports.pauseVideo = pauseVideo;
module.exports.resumeVideo = resumeVideo;
module.exports.skipVideo = skipVideo;