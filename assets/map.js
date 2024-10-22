var map = L.map('map').setView([0, 0], 2); // Center the map globally

// Adding the OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var marker = null; // Initialize the marker variable
var isGuessSubmitted = false; // Track if the guess has been submitted
var isWaitingForNext = false; // Track if waiting for the next question
var countdownTimer; // Timer variable
var countdownTime = 60; // Countdown time in seconds

// Dummy locations with associated images
var locations = [
    { lat: 35.6762, lng: 139.6503, image: 'assets/images/tokyo.jpg', name: "Tokyo" },
    { lat: 52.5200, lng: 13.4050, image: 'assets/images/berlin.jpg', name: "Berlin" },
    { lat: 30.0331, lng: 31.2336, image: 'assets/images/cairo.jpg', name: "Cairo" },
    { lat: -6.2088, lng: 106.8456, image: 'assets/images/jakarta.jpg', name: "Jakarta" },
    { lat: 40.7128, lng: -74.0060, image: 'assets/images/newyork.jpg', name: "New York" },
    { lat: 48.8566, lng: 2.3522, image: 'assets/images/paris.jpg', name: "Paris" },
    { lat: 1.3521, lng: 103.8198, image: 'assets/images/singapore.jpg', name: "Singapore" },
    { lat: -33.8688, lng: 151.2093, image: 'assets/images/sydney.jpg', name: "Sydney" }
];

var currentIndex = 0; // Track the current location index

function updateImage() {
    document.getElementById('location-image').src = locations[currentIndex].image;
}

function startCountdown() {
    countdownTime = 60; // Reset countdown time
    document.getElementById('countdown').innerText = `Time left: ${countdownTime} seconds`;

    clearInterval(countdownTimer); // Clear any existing timer
    countdownTimer = setInterval(function() {
        countdownTime--;
        document.getElementById('countdown').innerText = `Time left: ${countdownTime} seconds`;

        if (countdownTime <= 0) {
            clearInterval(countdownTimer);
            handleTimeout();
        }
    }, 1000);
}

function handleTimeout() {
    isWaitingForNext = true; // Set the flag that we're waiting for the next question
    resetMarkers(); // Reset all markers

    // Show timeout notification
    Swal.fire({
        title: "Time's Up!",
        text: "Your time to guess has expired.",
        icon: 'warning',
        confirmButtonText: 'OK'
    }).then(() => {
        displayResult(true); // Show the result even if time runs out

        // Start countdown to the next location after a timeout
        startNextCountdown(15); // Start 15 seconds countdown
    });
}

function startNextCountdown(duration) {
    countdownTime = duration; // Set duration for countdown
    document.getElementById('countdown').innerText = `Countdown to next question: ${countdownTime} seconds`;

    clearInterval(countdownTimer); // Clear any existing timer
    countdownTimer = setInterval(function() {
        countdownTime--;
        document.getElementById('countdown').innerText = `Countdown to next question: ${countdownTime} seconds`;

        if (countdownTime <= 0) {
            clearInterval(countdownTimer);
            nextLocation(); // Move to the next location after countdown ends
        }
    }, 1000);
}

function resetMarkers() {
    // Remove all markers and polylines
    if (marker) {
        map.removeLayer(marker);
        marker = null; // Reset marker reference
    }
    
    // Clear any existing polylines
    if (window.polyline) {
        map.removeLayer(window.polyline);
        window.polyline = null; // Reset polyline reference
    }

    // Clear actual location marker if exists
    if (window.markerActual) {
        map.removeLayer(window.markerActual);
        window.markerActual = null; // Reset actual location marker reference
    }
}

function displayResult(isTimeout = false) {
    let resultMessage;
    if (isTimeout) {
        resultMessage = "Time's up! Your last guess was not submitted.";
    } else {
        var guessLatLng = marker.getLatLng();
        var trueLocation = L.latLng(locations[currentIndex].lat, locations[currentIndex].lng);
        var distance = guessLatLng.distanceTo(trueLocation) / 1000; // Distance in kilometers
        resultMessage = `Your guess is ${distance.toFixed(2)} km away from the correct location.`;

        // Draw a line between the guess and the true location
        window.polyline = L.polyline([guessLatLng, trueLocation], { color: 'red' }).addTo(map);
        window.polyline.bindTooltip(`Distance: ${distance.toFixed(2)} km`).openTooltip();
    }

    // Show the actual location marker
    window.markerActual = L.marker([locations[currentIndex].lat, locations[currentIndex].lng], {
        icon: L.icon({
            iconUrl: 'https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2.png',
            iconSize: [25, 41]
        })
    }).addTo(map).bindTooltip("Actual Location").openTooltip();

    // Show result notification
    Swal.fire({
        title: "Result",
        text: resultMessage,
        icon: isTimeout ? 'error' : 'success',
        confirmButtonText: 'Next Question'
    }).then(() => {
        // Disable the guess button until next location
        document.getElementById('submit-guess').disabled = true;

        // Start countdown to the next question after a 15 second delay
        startNextCountdown(15); // Start 15 seconds countdown
    });
}

function nextLocation() {
    currentIndex++;
    if (currentIndex < locations.length) {
        resetMarkers(); // Clear all markers and lines before the next question
        updateImage();
        startCountdown(); // Reset the countdown for the new question
        isGuessSubmitted = false; // Allow new guess
        document.getElementById('submit-guess').disabled = false; // Enable the guess button
        document.getElementById('result').innerHTML = ""; // Clear previous result
        isWaitingForNext = false; // Reset waiting flag
    } else {
        Swal.fire({
            title: "Game Over!",
            text: "You've completed all locations.",
            icon: 'info',
            confirmButtonText: 'Restart'
        }).then(() => {
            // Reset the game
            currentIndex = 0;
            resetMarkers(); // Clear all markers and lines
            updateImage();
            startCountdown(); // Start the countdown for the new game
            document.getElementById('result').innerHTML = ""; // Clear previous result
            document.getElementById('submit-guess').disabled = false; // Enable the guess button
        });
    }
}

// Click event for the map
map.on('click', function(e) {
    if (!isGuessSubmitted && !isWaitingForNext) { // Allow guessing if not submitted and not waiting
        // Remove the existing marker if it exists
        if (marker) {
            map.removeLayer(marker);
        }

        // Create a new marker at the clicked location
        marker = L.marker(e.latlng).addTo(map);
    }
});

// Submit guess button event
document.getElementById('submit-guess').addEventListener('click', function() {
    if (!isWaitingForNext) {
        if (marker) {
            isGuessSubmitted = true; // Mark guess as submitted
            clearInterval(countdownTimer); // Clear the countdown
            displayResult(); // Show the result based on the guess
        } else {
            Swal.fire({
                title: "No Guess Made!",
                text: "Please click on the map to make a guess.",
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }
});

// Start the game initially
updateImage();
startCountdown(); // Start countdown for the first question
