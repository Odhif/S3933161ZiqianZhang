/* DEFINITIONS & SETUP */

// first let's retrieve references to all the elements we'll need to use
// this is the video itself
let videoElement = document.getElementById("videoElement");
// the buttons for the controls
let playButton = document.getElementById("playButton");
let stopButton = document.getElementById("stopButton");
// the progress element
let progressBar = document.getElementById("progressBar");

// next we remove the controls attribute - we do this with JS rather than just not including it in the HTML tag as a fallback
// this way if the JS doesn't load for whatever reason the player will have the default built in controls
videoElement.removeAttribute("controls");
// then if the default controls are removed we can show our custom controls - we want to do this via JS so that if the JS doesn't
// load then they won't show
document.getElementById("controlsWrapper").style.display = "flex";

// then we listen for the loadedmetadata event to fire which means we'll be able to access exactly how long the piece of media is
// i'm using an arrow function here that updates the progress element's max attribute with the duration of the media
// this way when it comes to setting the progress bars value the number matches a percentage of the total duration
videoElement.addEventListener('loadedmetadata', () => {
    progressBar.setAttribute('max', videoElement.duration);
});

// some mobile devices won't fire a loadedmetadata event so we need a fallback to make sure the attribute is set in these cases - we
// can do this by also running a check whenever playback starts by using the playing event
videoElement.addEventListener("playing", () => {
    // we can then double check if the attribute has already been set - if not then set it here - ! inside of an if statement flips the
    // truth of what we're checking for - so (progressBar.getAttribute('max')) would check if there's a value and
    // (!progressBar.getAttribute('max')) checks if there is no value - ie false
    if (!progressBar.getAttribute('max')) {
        progressBar.setAttribute('max', videoElement.duration);
    }
});

/* LOADING */

// here we're adding some feedback to indicate when the video is loading - this is pretty similar to our last experiement in that we're
// applying an animation via a class. the real difference here is when that class gets added - by listening for the waiting event which
// fires when the media is waiting to load we can add the animation to the timeline via the .classList.add() method. when we want to
// stop the animation we listen for the canplay event which fires when the media player has buffered enough data to be able to playback the
// media then we use the .classList.remove() method - if we instead wanted to wait until it has actually loaded the whole file we could
// use the canplaythrough event
videoElement.addEventListener("waiting", () => {
    progressBar.classList.add("timeline-loading");
});
videoElement.addEventListener("canplay", () => {
    progressBar.classList.remove("timeline-loading");
});

/* MEDIA FINSIHED */

// when the media finishes we want to make sure that play icon switches back over from pause to indicate that the user can restart playback
videoElement.addEventListener("ended", () => {
    playButton.style.backgroundImage = "url('./icons/play.svg')";
});

/* PLAY/PAUSE */

// we can use the .play() and .pause() methods on our media element to play and pause playback - because I want this to be triggered by
// two different events (see below) i'm going to write it as a seperate function
// by combining play and pause into the same function i'm able to make sure it does what i want - if the media is already playing i only
// ever want use .pause() (as pausing an already paused video doesn't really make sense)
// the same goes if the media is paused or stopped i only want use .play()
function playPause() {
    // the following if statement checks to see if the media is currently paused OR if the media has finshed playing - || inside of an if
    // statement like this is how we write an OR conditional, if either of these things are true it'll trigger the block of code
    // the reason we check for both is that when the video finishes playing it'll be in an ended state not a paused state
    if (videoElement.paused || videoElement.ended) {
        // if it isn't already playing make it play
        videoElement.play();
        // then make sure the icon on the button changes to pause indicating what it does if you click it
        playButton.style.backgroundImage = "url('./icons/pause.svg')";
    } else {
        // if it is already playing make it pause
        videoElement.pause();
        // then make sure the icon on the button changes to play indicating what it does if you click it
        playButton.style.backgroundImage = "url('./icons/play.svg')";
    }
}

// now we have our function we need to attach it to two seperate events, the first is probably obvious - clicking on the play button
playButton.addEventListener('click', playPause);

// the second event we want is clicking on the video itself, a feature popularised by youtube that is now ubiquitous in online video players
videoElement.addEventListener('click', playPause);

// this feature is unfinished in my code - while it works it has no signifiers to let users know they can do this by clicking the video
// there is already an element appropriately placed as a signifier, the <img> with the id of videoPlayerOverlay however its CSS is currently
// set to display: none - try to complete this feature by doing the following
// first you'll need to remove display: none from its css ruleset
// then you'll need to add two new statements to the playPause() function above - each will need to first find the correct element using the
// document.getElementById() and then update that element's .style.display property to equal either "block" or "none" depending on the context
// if done correctly the play overlay will only appear over the video if paused, otherwise it should disappear when playing


/* TIMELINE */

// there's two different things we want to do with our timeline - update the progress bar to display how much has already played and let the user
// click the progress bar to scrub the video to a specific place in the video
// to update the progress bar we need to listen for the timeupdate event which is fired everytime the current video time is updated - when the video
// is playing this repeatedly fires at a constant rate
videoElement.addEventListener('timeupdate', () => {
    // this statement is simple - we update the progress bar's value attribute with the currentTime property of the video, because timeupdate runs everytime
    // currentTime is changed it'll update both as the video plays and if we were to skip or stop the video
    progressBar.value = videoElement.currentTime;
});

// the simplest version of scrubbing would be to update the video's currentTime when the user clicks the timeline - however due to the interaction pattern
// established by youtube we should also account for a slightly different expression of user agency. the code below will work with a simple click on the
// timeline but will also allow for a user to drag their mouse on the timeline to continuously update currentTime and only end scrubbing when they release the
// mouse button. implementing this will take some more complex use of event listeners but i'll do my best to explain the design and technical implementation

// first thing we want to do is write a function that will take the current position of the the mouse in relation to the timeline and use it to change the
// currentTime property of the video element. each time this runs we'll need to know the position of the mouse so which we'll do using the event passed to it
// by the eventlistener - to access this we need to set it as a parameter, i've used the name e but it can be called whatever you like
function scrubToTime(e) {
    // this statement has a lot going on so let's step through each part:
    // the first thing we want to work out is the distance between the left side of the progress bar and the mouses current position - if we were just building
    // an interaction to work when the mouse is over the bar we could take this from the event, however as we want this to also work when we've held the mouse
    // down and moved it somewhere else on the page we need to work this out manually
    // e.clientX is the cursors current distance from the left edge of the page
    // we then want to minus (progressBar.getBoundingClientRect().left + window.scrollX) from this distance to account for any gap between the left edge of the
    // page and the start of the progress bar
    // videoElement.currentTime is the current position in the media file - we are setting it here to change the playback time
    // we then need to find a normalised 0-1 value based on how far along the bar the cursor is - the idea is that if i click the left most side it should return 0
    // and if i click the right most side it should return 1 - we get this value by dividing x by the total width of the progressBar
    // the value is then fed into our clampZeroOne() function - this is accounting for if our mouse is further left or further right than the ends of the progress bar
    // it works by essentially making the value always equal 1 if it is over 1 or always making it 0 if under 0 - this is commonly called a clamp, we're only allowing
    // a value to be in a certain range
    // finally we're using this clamped value to multiply with total duration of our video thus working out where we should scrub to
    let x = e.clientX - (progressBar.getBoundingClientRect().left + window.scrollX);
    videoElement.currentTime = clampZeroOne(x / progressBar.offsetWidth) * videoElement.duration;
}

// the click event fires only if the user presses the mouse down and then releases it on the same element. we can allow for a wider range of interactions by
// further breaking this down this into its discrete parts and listening to both the mousedown and mouseup events seperately

progressBar.addEventListener('mousedown', scrubToTime);
progressBar.addEventListener('mousedown', (e) => {
    // the behaviour here is to listen to the mousemove event (fired when the user moves their mouse) when the click is held down but then to stop listening to that
    // event when the mouse click is released
    window.addEventListener('mousemove', scrubToTime);
    window.addEventListener('mouseup', () => {
        window.removeEventListener('mousemove', scrubToTime);
    });
});


/* HELPER FUNCTIONS */

function clampZeroOne(input) {
    return Math.min(Math.max(input, 0), 1);
}

function logEvent(e) {
    console.log(e);
}

// Define multiplier parameters
// Obtaining the dom element through querySelector defines a parameter as the speed of the video, which is 1 times by default
// By binding the button (addEventListener()) to a click event, triggering the function, and performing conditional judgment, the maximum speed limit is set to 8 times
// When it exceeds eight times, it becomes 0.5 times, and a prompt for the current multiple is made in the video. Through the short hidden display of JS's setTimeout, there is an excessive effect that looks softer
// Display and hide by changing display 'none' and 'block'
let speed = 1
let speed_icon = document.querySelector(".speed_icon")
let speed_Num = document.querySelector(".speed_Num")
let speed_Num_text = document.querySelector(".speed_Num_text")
speed_icon.addEventListener('click', function () {
    if (speed < 8) {
        speed = speed * 2
    } else {
        speed = 0.5
    }
    speed_Num.style.display = 'block'
    speed_Num.style.opacity = '1'
    setTimeout(function () {
        speed_Num.style.opacity = '0'
    }, 300)
    setTimeout(function () {
        speed_Num.style.display = 'none'
    }, 500)
    speed_Num_text.innerHTML = speed
    videoElement.playbackRate = speed
})
// Define video muting
// Set a parameter here. By default, there is volume, so the parameter is true. Change the sound of the video by calling the muted attribute of the video, true/false
// At this point, the click event is also bound and bound through 'addEventListener'
let muteState = true
let mute_icon = document.querySelector(".mute_icon")
mute_icon.addEventListener('click', function () {
    if (muteState) {
        mute_icon.src = 'icons/unmute.svg'
        videoElement.muted = true;
    } else {
        mute_icon.src = 'icons/mute.svg'
        videoElement.muted = false;
    }
    muteState = !muteState
})

// Control video fast forward and rewind
// Here, the video button is used to fast forward and rewind the video. The current time attribute of the video can control the fast forward and rewind, and the common parameter here is 10 seconds
let time = 10
let imgLeft = document.querySelector(".imgLeft")
let imgRight = document.querySelector(".imgRight")
imgLeft.addEventListener('click', function () {

    videoElement.currentTime !== 0 ? videoElement.currentTime -= time : 1;
})
imgRight.addEventListener('click', function () {
    videoElement.volume !== videoElement.duration ? videoElement.currentTime += time : 1;
})
document.querySelector('.fullScreen').addEventListener('click',function () {
    videoElement.requestFullscreen()
})
// Control based on keyboard events
// Here, keyboard control is achieved through 'keydown'. When the keyboard is pressed, it will be triggered, and each keyboard button has its own number.
// The current pressed keyboard value is determined through 'if' as the unique judgment logic
// Execute the corresponding logical code accordingly
let vol = 10;
let volume_con = document.querySelector(".volume_con")
document.addEventListener('keydown', function (event) {
    let e = event || window.event || arguments.callee.caller.arguments[0];
    if (e && e.keyCode === 38) {
        // 按 向上键
        if (vol < 10) {
            vol = vol + 1
        } else {
            vol = 10
        }
        volume_con.style.display = 'block'
        volume_con.style.opacity = '1'
        setTimeout(function () {
            volume_con.style.opacity = '0'
        }, 300)
        setTimeout(function () {
            volume_con.style.display = 'none'
        }, 500)
        volume_con.innerHTML = "Volume:" + vol * 10
        videoElement.volume = vol / 10
    } else if (e && e.keyCode === 40) {
        // Press down key
        // Here, the height of the sound is controlled through the up and down keyboard. The video's 0 is muted, with a maximum value of 1. However, in JavaScript,
        // every time 0.1 is subtracted, it is found that after subtracting 0.4, the number will appear as a decimal point，
        // Therefore, it is defined here as 10, which completes the volume calculation of 0-1 by subtracting 1 each time and dividing by 10
        if (vol > 0) {
            vol = vol - 1
        } else {
            vol = 0
        }
        volume_con.style.display = 'block'
        volume_con.style.opacity = '1'
        setTimeout(function () {
            volume_con.style.opacity = '0'
        }, 300)
        setTimeout(function () {
            volume_con.style.display = 'none'
        }, 500)
        volume_con.innerHTML = "Volume:" + vol * 10
        videoElement.volume = vol / 10
    } else if (e && e.keyCode === 37) {
        videoElement.currentTime !== 0 ? videoElement.currentTime -= time : 1;
    } else if (e && e.keyCode === 39) {
        videoElement.volume !== videoElement.duration ? videoElement.currentTime += time : 1;
    }
})
// Whether to cycle
// Whether to loop is controlled by opening the loop of the video, and the corresponding value is true/false
let loopState = false
let loop_icon = document.querySelector(".loop_icon")
let loop_con = document.querySelector(".loop_con")

loop_icon.addEventListener('click', function () {
    loopState = !loopState
    if (loopState) {
        loop_icon.src = 'icons/loop.svg'
    } else {
        loop_icon.src = 'icons/loop.svg'
    }
    videoElement.loop = loopState
    loop_con.style.display = 'block'
    loop_con.style.opacity = '1'
    setTimeout(function () {
        loop_con.style.opacity = '0'
    }, 300)
    setTimeout(function () {
        loop_con.style.display = 'none'
    }, 500)
    loop_con.innerHTML = loopState ? 'Start loop' : 'Close loop'
})
