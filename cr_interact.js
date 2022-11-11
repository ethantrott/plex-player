const config = require("./config.json");

const { Builder, Browser, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome'); 

const options = new chrome.Options();

let driver = new Builder().forBrowser(Browser.CHROME).setChromeOptions(options).build();

async function login(returnURL){
    //load login page
    await driver.get("https://www.crunchyroll.com/welcome/login");
    
    //wait for username and password fields to render
    await driver.wait(until.elementLocated(By.name('email')), 15 * 1000);
    await driver.wait(until.elementLocated(By.name('password')), 15 * 1000);
    
    //enter username and password
    await driver.findElement(By.name('email')).sendKeys(config.cr_username);
    await driver.findElement(By.name('password')).sendKeys(config.cr_password, Key.ENTER);

    //FIXME: sometimes Enter key is not working for submission (TODO: click LOG IN button if enter doesn't work)

    //make sure we're redirected to the "already premium page"
    await driver.wait(until.urlContains('already-premium'), 15 * 1000);

    console.log("Successfully logged in to Crunchyroll")

    //we can attempt to play the video again now
    playVideo(returnURL);
}


async function playVideo(videoURL) {
    try {
        //load the crunchyroll page
        await driver.get(videoURL);

        //TODO: Test for 404 ("Page not found" in title)

        //look for "Try Premium" button
        let premiumTag = await driver.findElements(By.className('erc-premium-header-link'));
        //if "Try Premium" button exists, we need to sign in...
        if (premiumTag.length > 0) {
            console.log("User not signed in with premium, attempting login...")
            login(videoURL);
        }
        else {
            console.log("No premium button, looks good to go");

            //TODO: click play, go fullscreen, trigger next episode after completion..
        }
    }
    catch (e) {
        console.log(e);
    }
    // finally {
    //     await driver.quit();
    // }
};

module.exports.playVideo = playVideo;