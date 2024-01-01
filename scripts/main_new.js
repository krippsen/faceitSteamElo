console.log("Working")
// Get steamID
const steamid = getSteamID();  // Get the SteamID from the page
// Load FaceIT profile using the obtained SteamID
loadFaceITProfile(steamid);

// Define global variables to store FaceIT profile data
let id,
    level,
    levelImg,
    username,
    country,
    banned,
    banReason,
    membership = '',
    elo = '',
    avgHS = '-',
    avgKD = '-',
    matches = '-',
    winrate = '-',
    avgKR = '-',
    avgKills = '-',
    registred = '';

// Function to load FaceIT profile
function loadFaceITProfile(steamid) {
    // Check if steamID was received successfully
    console.log("loadFaceitProfile: " + steamid)
    if (steamid === null) {
        return;
    }

    // Get FaceIT profile using Chrome extension API
    chrome.runtime.sendMessage('https://api.faceit.com/search/v1/?limit=3&query=' + steamid,
        result => onFaceITProfileLoaded(result)
    );
}

// Asynchronous function called when FaceIT profile is loaded
async function onFaceITProfileLoaded(result) {
    // Extract the main FaceIT profile data
    const profile = await getMainProfile(result);
    console.log("onFaceitProfileLoaded: " + profile + " Resulut: " + result)
    if (profile !== null) {
        // Extract and assign data from the FaceIT profile
        id = profile.guid;
        username = profile.nickname;
        country = profile.country;
        level = getLevel(profile.games, 'cs2');
        levelImg = chrome.runtime.getURL(`./img/levels/${level}.svg`);
        gift = chrome.runtime.getURL(`./img/gift/gift-card.svg`);


        // Update the DOM with the extracted data
        updateDOM();

        // Check for bans and update DOM accordingly
        chrome.runtime.sendMessage('https://api.faceit.com/sheriff/v1/bans/' + id,
            result => {
                if (result[0]) {
                    banned = true;
                    banReason = result[0].reason;
                    updateDOM();
                }
            }
        );

        // Get additional data and update DOM
        chrome.runtime.sendMessage('https://api.faceit.com/users/v1/nicknames/' + username,
            result => {
                membership = ((result.memberships.includes('cs2') || result.memberships.includes('premium')) ? 'Premium' : 'Free');
                elo = result.games.cs2.faceit_elo;
                registred = new Date(result.created_at).toLocaleString('en-us', { year: 'numeric', month: '2-digit', day: '2-digit' });
                updateDOM();
            }
        );

        // Get lifetime CS2 stats and update DOM
        chrome.runtime.sendMessage('https://api.faceit.com/stats/v1/stats/users/' + id + '/games/cs2',
            result => {
                matches = result.lifetime.m1;
                updateDOM();
            }
        );

        // Get last 20 game CS2 stats and calculate averages, then update DOM
        chrome.runtime.sendMessage(`https://api.faceit.com/stats/v1/stats/time/users/${id}/games/cs2?size=20`,
            json => {
                let kills = 0, HS = 0, divid = 0, KD = 0, KR = 0;
                for (let i = 0; i < json.length; i++) {
                    if (json[i].gameMode !== '5v5') {
                        length = length + 1;
                    } else {
                        divid = divid + 1;
                        kills = parseInt(json[i].i6) + kills;
                        HS = parseInt(json[i].c4 * 100) + HS;
                        KD = parseInt(json[i].c2 * 100) + KD;
                        KR = parseInt(json[i].c3 * 100) + KR;
                    }
                }

                avgKills = Math.round(kills / divid);
                avgHS = Math.round(HS / divid / 100);
                avgKD = (KD / divid / 100).toFixed(2);
                avgKR = (KR / divid / 100).toFixed(2);

                updateDOM();
            }
        );
    }
}

// Function to update the DOM with FaceIT profile data
function updateDOM() {
    // Select the element where FaceIT profile data will be displayed
    const customize = (document.querySelector('.profile_customization_area') ?? document.querySelector('.profile_leftcol'));

    if (customize) {
        // Create a new HTML element to display FaceIT profile data
        let textNode = document.createElement("div");
        textNode.id = 'krippFaceit';
        textNode.innerHTML = `
        <div class="profile_customization">
            <div class="profile_customization_header">Faceit Elo Check <span style="color:#4b4b4b">by <a href="https://steamcommunity.com/profiles/76561199032450934" style="color:#4b4b4b">Krippsen</a></span>
            &nbsp
            <a href="https://steamcommunity.com/tradeoffer/new/?partner=1072185206&token=25MTwFpc"><img class="krippFaceit_donate" src="${gift}" title="Donation appreciated <3"></a>
            </div>
            <div class="krippFaceit_block profile_customization_block">
                <div class="favoritegroup_showcase">
                    <div class="showcase_content_bg">
                        <div class="krippFaceit_content favoritegroup_showcase_group showcase_slot">                  
                            <div class="favoritegroup_content">
                                <div class="krippFaceit_namerow favoritegroup_namerow ellipsis" style="min-width:220px;float:left;margin-top: 10px;overflow:unset">
                                    <img class="krippsFaceit_levelbox" src="${levelImg}">
                                    <a class="favoritegroup_name whiteLink" target="_blank" href="https://www.faceit.com/en/players/`+ username + `">
                                        <img class="krippFaceit_country" title="${country}" src="https://cdn-frontend.faceit.com/web/112-1536332382/src/app/assets/images-compress/flags/${country}.png">
                                        ` + username + ` 
                                    </a>
                                    <br>
                                    <span class="krippFaceit_description favoritegroup_description">
                                    ` + ((banned) ? `<span alt="${banReason}" class="krippsFaceit_banned">${banReason}</span> ` : `<strong>${membership} - ${registred}</strong>`) + `
                                    </span>
                                </div>
                                <div class="krippFaceit_stats_block">
                                    <div class="krippFaceit_stats_row2 favoritegroup_stats showcase_stats_row">
                                        <div class="krippFaceit_stat showcase_stat favoritegroup_online">
                                            <div class="value">${elo}</div>
                                            <div class="label">ELO</div>
                                        </div>
                                        <div class="krippFaceit_stat showcase_stat favoritegroup_online">
                                            <div class="value">${matches}</div>
                                            <div class="label">Matches</div>
                                        </div>
                                        <div class="krippFaceit_stat showcase_stat favoritegroup_online">
                                            <div class="value">${avgKills}</div>
                                            <div class="label">AVG kills</div>
                                        </div>
                                        <div class="krippFaceit_stat showcase_stat favoritegroup_online">
                                            <div class="value">${avgKD}</div>
                                            <div class="label">AVG K/D</div>
                                        </div>
                                        <div class="krippFaceit_stat showcase_stat favoritegroup_online">
                                            <div class="value">${avgKR}</div>
                                            <div class="label">AVG K/R</div>
                                        </div>
                                        <br>
                                        <div style="clear: left;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

        // Check if the element already exists, then update it; otherwise, prepend the new element
        if (document.getElementById('krippFaceit')) {
            document.getElementById('krippFaceit').innerHTML = textNode.innerHTML;
        } else {
            customize.prepend(textNode);
        }
    } else {
        console.error("Element with class 'profile_customization_area' or 'profile_leftcol' not found");
    }
}

// Function to get the skill level for a specific game
function getLevel(games, searchGame) {
    let level = 1;
    games.map((game) => {
        if (game.name === searchGame) {
            level = game.skill_level;
        }
    });

    return level;
}

/**
 * CS2 profile
 * @param {*} result 
 * @returns 
 */
// Asynchronous function to extract the main FaceIT profile data
async function getMainProfile(result) {
    let profile = null;
    const allPlayers = result.players.results;
    if (allPlayers.length > 1) {
        allPlayers.map(async (user, index) => {
            if (user.games.length > 0) {
                user.games.map(async (game) => {
                    if (game.name == 'cs2') {
                        profile = allPlayers[index];
                    }
                });
            }
        });
    } else {
        profile = allPlayers[0];
    }

    return profile;
}

/**
 * Gets steamID from page report popup
 * @returns string
 */
// Function to get SteamID from the page report popup
function getSteamID() {
    // Getting steamID from report popup
    if (document.getElementsByName("abuseID") && document.getElementsByName("abuseID")[0]) {
        console.log("func getSteamID: " + document.getElementsByName("abuseID")[0].value)
        return document.getElementsByName("abuseID")[0].value;
    }

    // If steamID somehow is not found, then try the second method to get it (user is not logged in)
    else {
        return document.querySelector('.responsive_page_template_content').innerHTML.split('script')[2].split('"')[8] ?? null;
    }
}


