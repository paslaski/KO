// clean up code
// https://www.sitepoint.com/delay-sleep-pause-wait/
// make github repo
// TODO: toggle button
// TODO: sound level adjustment

// alert('victory_status')

var volume;
var muted;

function isLichess() { return window.location.origin === 'https://lichess.org' }
function isChesscom() { return window.location.origin === 'https://www.chess.com' }

function queryVolume() {
    // stored as string, HTML accepts 0-1 range but slider runs 0-100
    chrome.runtime.sendMessage(
        {type: 'request_volume'},
        function (response) {
            console.log('Volume level: ')
            console.log(response);
            volume = response.volume;
        }
    );
}

function queryMuted() {
    // stored as string
    chrome.runtime.sendMessage(
        {type: 'request_mute_status'},
        function (response) {
            console.log('Mute status: ')
            console.log(response); 
            muted = response.muted;
        }
    );
}

function setVolume(vid_element) {
    queryVolume();
    vid_element.volume = volume;
    queryMuted();
    vid_element.muted = muted;
}

function assignWidthHeight(video_element) {
    if (isLichess()) {
        video_element.width = parseInt(document.getElementsByTagName('cg-container')[0].style.width, 10);
        video_element.height = parseInt(document.getElementsByTagName('cg-container')[0].style.height, 10);
    }

    if (isChesscom()) {
        video_element.width = parseInt(document.getElementById('board-layout-chessboard').style.width, 10);
        video_element.height = parseInt(document.getElementById('board-layout-chessboard').style.height, 10);
    }
}

function attachVideoToBoard(video_element) {
    if (isLichess()) {
        document.getElementsByTagName('cg-board')[0].appendChild(video_element);
    }
    if (isChesscom()) {
        document.querySelector('[id^="board-liveGame-"]').appendChild(video_element);
        console.log('board attached to');
        console.log(document.querySelector('[id^="board-dailyGame-"]'));
    }
}

function createVideoElement() {
    console.log('game won, creating video')

    // handler for event listener to remove video after play ends
    function deletionHandler(e) {
        // find KO video on page
        vid_element = document.getElementById("KO_vid");
        // cleanly remove without error
        vid_element.pause();
        vid_element.removeAttribute('src'); // empty source
        vid_element.load();
        vid_element.remove();
    }

    // create video and assign unique ID
    var vid_element = document.createElement("video");
    vid_element.id = "KO_vid";

    // set CSS properties to cover board, appear in front of pieces, be sufficiently large, aspect ratio
    assignWidthHeight(vid_element);
    vid_element.style.position = 'absolute';
    vid_element.style.zIndex = 1001; // lichess max=2, chesscom max=1000
    vid_element.style.justifyContent = 'center';
    vid_element.style.objectFit = 'contain';
    vid_element.style.transform = 'scale(1.2, 1.2)';

    // assign source from KO webm
    var vid_source = document.createElement("source");
    vid_source.type = "video/webm";
    var vid_url = chrome.runtime.getURL("Street_Fighter_KO.webm");
    vid_source.src = vid_url;

    // query settings from popup (stored in background) to meet user volume preferences
    // setVolume(vid_element);

    // attach source & deletion event listener to video 
    vid_element.appendChild(vid_source);
    vid_element.addEventListener('ended', deletionHandler);

    // add video element to board as child
    attachVideoToBoard(vid_element);

    // var canPlay_WEMB = vid_element.canPlayType('video/webm; codecs="vp8,vorbis"');
    // vid_element.muted = true;
    
    return vid_element;

    // style="position: absolute; z-index: 3; justify-content: center; 
    // object-fit: contain; transform: scale(1.2, 1.2)"
}

function getBoardElement() {
    var board_element;

    if (isLichess()) {
        board_element = document.getElementsByTagName('cg-board')[0];
    }

    if (isChesscom()) {
        board_element = document.getElementById('board-layout-chessboard');
    }

    return board_element;
}

function playVideo(video_element) {

}

function KO() {
 
    let vid_element = createVideoElement();

    chrome.runtime.sendMessage({'type': 'set_video_volume'}, function(response) {
        console.log('response from message: ');
        console.log(response);
        vid_element.volume = response.volume;
        vid_element.muted = response.muted;

        vid_element.play();
        console.log('played video');
    })

}

function getPlayerColor() {
    // only to be called on lichess.org

    // identify which color the user is playing
    var player_identifying_string = 'lichess.load.then(()=>{LichessRound.boot(';
    var scripts = document.getElementsByTagName('script');
    var player_color;

    for (let i = 0; i < scripts.length; i++) {
        if (!scripts[i].innerText.includes(player_identifying_string)) { continue; }
        
        player_color = JSON.parse(scripts[i].innerText.substring(player_identifying_string.length, scripts[i].innerText.length-3)).data.player.color;
        break;
    } 
    if (player_color === undefined) { console.log('Player color not found.') }

    return player_color;
}

function getVictoryStatus() {
    var victory_status = false;
    var victory_element;
    var v_idx = 0;

    // check for presence of "COLOR is victorious"
    if (isLichess()) {
        // returns HTMLCollection potentially containing win message
        victory_element = document.getElementsByClassName('status');
        if (victory_element === undefined) { return false; }

        var player_color = getPlayerColor();

        for (; v_idx < victory_element.length; v_idx++) 
        {
            if (victory_element[v_idx].textContent === undefined) { continue; }

            if (victory_element[v_idx].textContent.toLowerCase().includes(player_color.concat(' is victorious'))) 
            { 
                victory_status = true;
                break;
            }
        }
    }

    // check for presence of "You won!"
    if (isChesscom()) {
        // returns HTMLCollection potentially containing win message
        victory_element = document.getElementsByClassName('header-title-component');

        for (; v_idx < victory_element.length; v_idx++) 
        {
            if (victory_element[v_idx].textContent === undefined) { continue; }

            if (victory_element[v_idx].textContent.includes('You Won!')) 
            { 
                victory_status = true;
                break;
            }
        }
    }

    return victory_status;
}

// set up the mutation observer
var observer = new MutationObserver(function (mutations, observer) {
    // `mutations` is an array of mutations that occurred
    // `observer` is the MutationObserver instance
    var victory_status = getVictoryStatus();
    console.log('Victory Status: ' + toString(victory_status));
    if (victory_status) {
        KO();
        observer.disconnect();
        return;
    }

    }
);

// start observing
observer.observe(document, {
  childList: true,
  subtree: true
});