const config = require("./config.json");

const { Builder, Browser, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome'); 

const options = new chrome.Options();

let driver = new Builder().forBrowser(Browser.CHROME).setChromeOptions(options).build();

//this is the first login system I made. it uses the old crunchyroll login, which seems
//to have more bot protection, leaving here in case we need it, but really login() should be used instead..
async function loginExternal(returnURL){
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
    //TODO: catch timeout error here
    //may need to login clicking the login button (different url with authid parameter...)
    await driver.wait(until.urlContains('already-premium'), 15 * 1000);

    console.log("Successfully logged in to Crunchyroll")

    //we can attempt to play the video again now
    playVideo(returnURL);
}

async function login(returnURL){
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

            //have to switch to video player frame. why? idk, selenium.
            await driver.wait(until.elementLocated(By.className('video-player')), 15 * 1000);
            await driver.switchTo().frame(driver.findElement(By.className("video-player")));

            //wait for video to buffer so play button appears, then click it
            console.log("Looking for play button...")
            await driver.wait(until.elementLocated(By.css("[data-testid='vilos-large_play_pause_button']")), 60 * 1000);
            await driver.findElement(By.css("[data-testid='vilos-large_play_pause_button']")).click();
            console.log("Clicked play button, video now playing...")

            //click the fullscreen button
            await await driver.findElement(By.css("[data-testid='vilos-fullscreen_button']")).click();
            console.log("Entered fullscreen")

            //TODO: trigger next episode after completion..
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