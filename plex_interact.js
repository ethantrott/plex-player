const config = require("./config.json");

const { Builder, Browser, By, Key, until, Origin } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome'); 

const options = new chrome.Options();
options.addArguments(["--disable-infobars", "--disable-automation"]);
options.excludeSwitches(["enable-automation"]);

let driver = new Builder().forBrowser(Browser.CHROME).setChromeOptions(options).build();

let isPaused = false;

//this is the first login system I made. it uses the old crunchyroll login, which seems
//to have more bot protection, leaving here in case we need it, but really login() should be used instead..
async function loginExternal(returnURL){
    //load login page
    await driver.get("https://app.plex.tv/desktop/#!/login");
    
    //wait a second to allow page to load
    await new Promise(resolve => setTimeout(resolve, 5000));

    //it took me embarrasingly long to realize they do all their auth in an iframe..
    await driver.switchTo().frame(driver.findElement(By.css("[title='Plex Authentication']")));

    console.log("Looking for email button");
    await driver.wait(until.elementLocated(By.css("[data-testid='signIn--email']")), 15 * 1000);
    await driver.findElement(By.css("[data-testid='signIn--email']")).click();
    console.log("Email button found");

    //wait for username and password fields to render
    await driver.wait(until.elementLocated(By.name('email')), 15 * 1000);
    await driver.wait(until.elementLocated(By.name('password')), 15 * 1000);
    
    //enter username and password
    await driver.findElement(By.name('email')).sendKeys(config.plex_username);
    await driver.findElement(By.name('password')).sendKeys(config.plex_password, Key.ENTER);

    console.log("Successfully logged in to Plex");

    //wait a second to allow page to load
    await new Promise(resolve => setTimeout(resolve, 5000));

    //we can attempt to play the video again now
    await driver.get(returnURL);
}

async function playVideo(videoURL) {
    //load the crunchyroll page
    await driver.get(videoURL);

    //wait a second to allow page to load
    await new Promise(resolve => setTimeout(resolve, 5000));

    //look for "Sign In" button
    let signInButton = await driver.findElements(By.css("[data-testid='signInButton']"));
    let currentURL = await driver.getCurrentUrl();

    //if "Sign In" button exists or we are brought to the login page, we need to sign in...
    if (signInButton.length > 0 || currentURL.indexOf("auth")!=-1) {
        // console.log(signInButton.length);
        // console.log(currentURL);
        console.log("User not signed in, attempting login...")
        await loginExternal(videoURL);
    }
    else console.log("Already signed in, looks good to go");

    //click shuffle button
    await driver.wait(until.elementLocated(By.css("[data-testid='toolbarShuffle")), 15 * 1000);
    await driver.findElement(By.css("[data-testid='toolbarShuffle']")).click();

    //click the fullscreen button
    await driver.wait(until.elementLocated(By.css("[data-testid='fullscreenButton']")), 15 * 1000);
    await driver.findElement(By.css("[data-testid='fullscreenButton']")).click();
    console.log("Entered fullscreen");
    
    isPaused = false;
};

async function clickPauseToggle(){
    await moveMouse();

    if (!isPaused){
        //click the pause button
        await driver.wait(until.elementLocated(By.css("[data-testid='pauseButton']")), 15 * 1000);
        await driver.findElement(By.css("[data-testid='pauseButton']")).click();
    }
    else{
         //click the pause button
         await driver.wait(until.elementLocated(By.css("[data-testid='resumeButton']")), 15 * 1000);
         await driver.findElement(By.css("[data-testid='resumeButton']")).click();
    }

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
    await driver.wait(until.elementLocated(By.css("[data-testid='nextButton']")), 15 * 1000);
    await driver.findElement(By.css("[data-testid='nextButton']")).click();

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