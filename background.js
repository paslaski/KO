// maintain volume & muted variables in background describing state of user options
let volume = 50;
let muted = false;

// support updates & queries to user options from popup + content script
chrome.runtime.onMessage.addListener( (msg, sender, sendResponse) => {
    console.log('button pressed, popup message received: ');
    console.log(msg);
    switch (msg.type) {
        case 'set_video_volume':
            chrome.storage.sync.get(["volume", "mute_status"], function(response) {
                if (response["volume"] !== undefined) {
                    volume = response["volume"]/100;
                } else {
                    volume = .5;
                }

                if (response["mute_status"] !== undefined) {
                    muted = response["mute_status"];
                } else {
                    muted = false;
                }
                console.log('data fetched from chrome.storage: ')
                console.log({volume: volume, muted: muted});
                console.log('sending message back...')
                sendResponse({volume: volume, muted: muted});
            })
            return true;
        case 'request_volume':
            // volume = parseInt(localStorage.getItem('volume'), 10)/100;
            chrome.storage.sync.get("volume", function(response) {
                if (response["volume"]) {
                    volume = response["volume"]/100;
                } else {
                    volume = .5;
                }

                sendResponse({volume: volume});
            });
            break;
        case 'request_mute_status':
            // muted = localStorage.getItem('mute_status') === 'true';
            chrome.storage.sync.get("mute_status", function(response) {
                if (response["mute_status"]) {
                    muted = response["mute_status"];
                } else {
                    muted = false;
                }

                sendResponse({muted: muted});
            });
            break;
        default:
            break;
    }
});

// allow user settings to persist by utilizing storage permissions

// chrome.runtime.onInstalled.addListener(() => {
//     chrome.storage.sync.set({ volume });
//     chrome.storage.sync.set({ muted });
// });