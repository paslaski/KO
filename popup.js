// relevant elements in popup
var volume_slider = document.getElementById('volume_slider');
var mute_checkbox = document.getElementById('mute_checkbox');

// to store previously defined user preferences
let stored_volume;
let stored_mute_status;


// populate box with stored preferences
chrome.storage.sync.get(["volume", "mute_status"], function(response) {
    stored_volume = response.volume;
    stored_mute_status = response.mute_status;

    // if unavailable, use defaults
    if (stored_volume === undefined) {
        chrome.storage.sync.set({"volume": 50});
    }
    if (stored_mute_status === undefined) {
        chrome.storage.sync.set({"mute_status": false});
    }

    // must be placed in callback due to asynchronous storage queries
    volume_slider.value = (stored_volume !== undefined) ? stored_volume : 50;
    mute_checkbox.checked = (stored_mute_status !== undefined) ? stored_mute_status : false;
}) 



// update storage when user adjusts preferences
volume_slider.addEventListener('input', function() {
    chrome.storage.sync.set({"volume": volume_slider.value});
    // localStorage.setItem('volume', volume_slider.value);
    // console.log('adjusted slider volume to: ');
    // console.log(volume_slider.value);
    // console.log('stoerd value: ');
    // console.log(localStorage.getItem('volume'));
    // // chrome.runtime.sendMessage({type: 'update_volume', volume: volume_slider.value});
})

mute_checkbox.addEventListener('change', function() {
    chrome.storage.sync.set({"mute_status": mute_checkbox.checked})
    // localStorage.setItem('mute_status', mute_checkbox.checked ? 'true' : 'false');
    // chrome.runtime.sendMessage({type: 'update_mute_status', mute_status: mute_checkbox.checked});
})