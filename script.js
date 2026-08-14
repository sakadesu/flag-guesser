// Game Configuration
const POINTS_PER_CORRECT = 10;
const API_BASE_URL = 'http://localhost:5000/api';

// Game State
let gameState = {
    userId: null,
    username: null,
    userLocation: null,
    score: 0,
    currentStreak: 0,
    bestStreak: 0,
    currentQuestion: 0,
    gameActive: false,
    currentCountry: null,
};

// DOM Elements
const authSection = document.getElementById('auth-section');
const gameSection = document.getElementById('game-section');
const leaderboardSection = document.getElementById('leaderboard-section');
const usernameInput = document.getElementById('username');
const guestLoginBtn = document.getElementById('guest-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const backToGameBtn = document.getElementById('back-to-game-btn');
const usernameDisplay = document.getElementById('username-display');
const locationDisplay = document.getElementById('location-display');
const scoreDisplay = document.getElementById('score-display');
const streakDisplay = document.getElementById('streak-display');
const flagImage = document.getElementById('flag-image');
const optionsContainer = document.getElementById('options-container');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const resultsModal = document.getElementById('results-modal');
const gameoverModal = document.getElementById('gameover-modal');
const resultMessage = document.getElementById('result-message');
const resultAnswer = document.getElementById('result-answer');
const nextBtn = document.getElementById('next-btn');
const finishBtn = document.getElementById('finish-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const viewLeaderboardBtn = document.getElementById('view-leaderboard-btn');
const leaderboardBody = document.getElementById('leaderboard-body');
const filterBtns = document.querySelectorAll('.filter-btn');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    getUserLocation();
    checkExistingSession();
});

// Setup Event Listeners
function setupEventListeners() {
    guestLoginBtn.addEventListener('click', handleGuestLogin);
    logoutBtn.addEventListener('click', handleLogout);
    leaderboardBtn.addEventListener('click', showLeaderboard);
    backToGameBtn.addEventListener('click', showGame);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleGuestLogin();
    });
    nextBtn.addEventListener('click', loadNextQuestion);
    finishBtn.addEventListener('click', finishGame);
    playAgainBtn.addEventListener('click', startNewGame);
    viewLeaderboardBtn.addEventListener('click', showLeaderboard);
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            loadLeaderboard(e.target.dataset.filter);
        });
    });
}

// Get User Location
async function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();
                    gameState.userLocation = data.address.country || 'Unknown';
                } catch (error) {
                    console.error('Error getting location:', error);
                    gameState.userLocation = 'Unknown';
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                gameState.userLocation = 'Unknown';
            }
        );
    }
}

// Check Existing Session
function checkExistingSession() {
    const savedUser = localStorage.getItem('flagGuesserUser');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        gameState.userId = user.id;
        gameState.username = user.username;
        showGame();
        startNewGame();
    }
}

// Handle Google Sign-In
async function handleGoogleSignIn(response) {
    const token = response.credential;
    
    try {
        // Decode JWT (for basic info - in production, verify on backend)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const userData = JSON.parse(jsonPayload);
        
        // Save Google user data
        gameState.userId = userData.sub;
        gameState.username = userData.name;
        gameState.isGoogleAuth = true;
        gameState.googleToken = token;
        
        localStorage.setItem(
            'flagGuesserUser',
            JSON.stringify({ 
                id: gameState.userId, 
                username: gameState.username,
                isGoogleAuth: true,
                email: userData.email
            })
        );
        
        console.log('Google Sign-In successful:', gameState.username);
        showGame();
        startNewGame();
    } catch (error) {
        console.error('Google Sign-In error:', error);
        alert('Failed to sign in with Google. Please try again.');
    }
}

// Handle Guest Login
async function handleGuestLogin() {
    const username = usernameInput.value.trim();
    if (!username) {
        alert('Please enter a username');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                location: gameState.userLocation,
            }),
        });

        const data = await response.json();
        if (data.success) {
            gameState.userId = data.user.id;
            gameState.username = data.user.username;
            gameState.isGuestAuth = false;
            localStorage.setItem(
                'flagGuesserUser',
                JSON.stringify({ id: data.user.id, username: data.user.username, isGuestAuth: false })
            );
            showGame();
            startNewGame();
        } else {
            // Fallback to guest mode
            loginAsGuest(username);
        }
    } catch (error) {
        console.error('Login error:', error);
        // Allow offline guest play
        loginAsGuest(username);
    }
}

// Helper: Login as Guest
function loginAsGuest(username) {
    gameState.userId = 'guest_' + Date.now();
    gameState.username = username;
    gameState.isGuestAuth = true;
    localStorage.setItem(
        'flagGuesserUser',
        JSON.stringify({ 
            id: gameState.userId, 
            username: gameState.username,
            isGuestAuth: true
        })
    );
    showGame();
    startNewGame();
}

// Handle Logout
function handleLogout() {
    gameState = {
        userId: null,
        username: null,
        userLocation: null,
        score: 0,
        currentStreak: 0,
        bestStreak: 0,
        currentQuestion: 0,
        gameActive: false,
        currentCountry: null,
    };
    localStorage.removeItem('flagGuesserUser');
    usernameInput.value = '';
    showAuthSection();
}

// Show Auth Section
function showAuthSection() {
    authSection.style.display = 'flex';
    gameSection.style.display = 'none';
    leaderboardSection.style.display = 'none';
}

// Show Game Section
function showGame() {
    authSection.style.display = 'none';
    gameSection.style.display = 'flex';
    leaderboardSection.style.display = 'none';
    usernameDisplay.textContent = `👤 ${gameState.username}`;
    locationDisplay.textContent = gameState.userLocation;
}

// Show Leaderboard Section
function showLeaderboard() {
    authSection.style.display = 'none';
    gameSection.style.display = 'none';
    leaderboardSection.style.display = 'flex';
    loadLeaderboard('global');
}

// Start New Game
function startNewGame() {
    gameState.score = 0;
    gameState.currentStreak = 0;
    gameState.currentQuestion = 0;
    gameState.gameActive = true;
    resultsModal.style.display = 'none';
    gameoverModal.style.display = 'none';
    updateScoreDisplay();
    loadNextQuestion();
}

// Load Next Question
async function loadNextQuestion() {
    resultsModal.style.display = 'none';
    gameState.currentQuestion++;
    updateProgressBar();

    try {
        const response = await fetch(`${API_BASE_URL}/game/question`);
        const data = await response.json();

        if (data.success) {
            gameState.currentCountry = data.question.country;
            displayQuestion(data.question);
        } else {
            // Fallback data if API fails
            loadOfflineQuestion();
        }
    } catch (error) {
        console.error('Error loading question:', error);
        loadOfflineQuestion();
    }
}

// Fallback: Load Offline Question
function loadOfflineQuestion() {
    const countries = [
        // Europe
        { country: 'France', flag: '🇫🇷', options: ['France', 'Italy', 'Spain', 'Germany'] },
        { country: 'Germany', flag: '🇩🇪', options: ['Germany', 'Austria', 'Switzerland', 'Netherlands'] },
        { country: 'Italy', flag: '🇮🇹', options: ['Italy', 'France', 'Greece', 'Spain'] },
        { country: 'Spain', flag: '🇪🇸', options: ['Spain', 'Portugal', 'France', 'Italy'] },
        { country: 'United Kingdom', flag: '🇬🇧', options: ['United Kingdom', 'Ireland', 'Australia', 'New Zealand'] },
        { country: 'Russia', flag: '🇷🇺', options: ['Russia', 'Ukraine', 'Belarus', 'Kazakhstan'] },
        { country: 'Poland', flag: '🇵🇱', options: ['Poland', 'Czech Republic', 'Slovakia', 'Hungary'] },
        { country: 'Netherlands', flag: '🇳🇱', options: ['Netherlands', 'Belgium', 'Luxembourg', 'Switzerland'] },
        { country: 'Switzerland', flag: '🇨🇭', options: ['Switzerland', 'Austria', 'Germany', 'Liechtenstein'] },
        { country: 'Sweden', flag: '🇸🇪', options: ['Sweden', 'Norway', 'Finland', 'Denmark'] },
        { country: 'Norway', flag: '🇳🇴', options: ['Norway', 'Sweden', 'Finland', 'Iceland'] },
        { country: 'Greece', flag: '🇬🇷', options: ['Greece', 'Turkey', 'Cyprus', 'Albania'] },
        { country: 'Portugal', flag: '🇵🇹', options: ['Portugal', 'Spain', 'France', 'Italy'] },
        { country: 'Ireland', flag: '🇮🇪', options: ['Ireland', 'United Kingdom', 'Iceland', 'Malta'] },
        { country: 'Austria', flag: '🇦🇹', options: ['Austria', 'Switzerland', 'Czech Republic', 'Slovakia'] },
        
        // Asia
        { country: 'Japan', flag: '🇯🇵', options: ['Japan', 'South Korea', 'Thailand', 'Vietnam'] },
        { country: 'China', flag: '🇨🇳', options: ['China', 'Taiwan', 'Mongolia', 'North Korea'] },
        { country: 'South Korea', flag: '🇰🇷', options: ['South Korea', 'North Korea', 'Japan', 'Mongolia'] },
        { country: 'India', flag: '🇮🇳', options: ['India', 'Pakistan', 'Bangladesh', 'Nepal'] },
        { country: 'Thailand', flag: '🇹🇭', options: ['Thailand', 'Vietnam', 'Cambodia', 'Laos'] },
        { country: 'Vietnam', flag: '🇻🇳', options: ['Vietnam', 'Thailand', 'Cambodia', 'Laos'] },
        { country: 'Indonesia', flag: '🇮🇩', options: ['Indonesia', 'Malaysia', 'Philippines', 'Singapore'] },
        { country: 'Philippines', flag: '🇵🇭', options: ['Philippines', 'Indonesia', 'Malaysia', 'Vietnam'] },
        { country: 'Singapore', flag: '🇸🇬', options: ['Singapore', 'Malaysia', 'Brunei', 'Thailand'] },
        { country: 'Malaysia', flag: '🇲🇾', options: ['Malaysia', 'Singapore', 'Brunei', 'Thailand'] },
        { country: 'Pakistan', flag: '🇵🇰', options: ['Pakistan', 'India', 'Afghanistan', 'Bangladesh'] },
        { country: 'Bangladesh', flag: '🇧🇩', options: ['Bangladesh', 'India', 'Pakistan', 'Myanmar'] },
        { country: 'Nepal', flag: '🇳🇵', options: ['Nepal', 'Bhutan', 'India', 'Tibet'] },
        { country: 'Sri Lanka', flag: '🇱🇰', options: ['Sri Lanka', 'India', 'Maldives', 'Indonesia'] },
        { country: 'Turkey', flag: '🇹🇷', options: ['Turkey', 'Greece', 'Syria', 'Iraq'] },
        { country: 'Saudi Arabia', flag: '🇸🇦', options: ['Saudi Arabia', 'UAE', 'Qatar', 'Oman'] },
        { country: 'United Arab Emirates', flag: '🇦🇪', options: ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Bahrain'] },
        { country: 'Israel', flag: '🇮🇱', options: ['Israel', 'Palestine', 'Jordan', 'Lebanon'] },
        
        // Africa
        { country: 'Egypt', flag: '🇪🇬', options: ['Egypt', 'Libya', 'Sudan', 'Ethiopia'] },
        { country: 'Nigeria', flag: '🇳🇬', options: ['Nigeria', 'Ghana', 'Cameroon', 'Ivory Coast'] },
        { country: 'South Africa', flag: '🇿🇦', options: ['South Africa', 'Namibia', 'Botswana', 'Zimbabwe'] },
        { country: 'Kenya', flag: '🇰🇪', options: ['Kenya', 'Uganda', 'Tanzania', 'Ethiopia'] },
        { country: 'Ethiopia', flag: '🇪🇹', options: ['Ethiopia', 'Kenya', 'Somalia', 'Sudan'] },
        { country: 'Ghana', flag: '🇬🇭', options: ['Ghana', 'Nigeria', 'Ivory Coast', 'Senegal'] },
        { country: 'Morocco', flag: '🇲🇦', options: ['Morocco', 'Algeria', 'Tunisia', 'Libya'] },
        { country: 'Algeria', flag: '🇩🇿', options: ['Algeria', 'Morocco', 'Tunisia', 'Libya'] },
        { country: 'Tunisia', flag: '🇹🇳', options: ['Tunisia', 'Algeria', 'Libya', 'Morocco'] },
        { country: 'Tanzania', flag: '🇹🇿', options: ['Tanzania', 'Kenya', 'Uganda', 'Mozambique'] },
        { country: 'Uganda', flag: '🇺🇬', options: ['Uganda', 'Kenya', 'Rwanda', 'Tanzania'] },
        { country: 'Cameroon', flag: '🇨🇲', options: ['Cameroon', 'Nigeria', 'Gabon', 'Chad'] },
        { country: 'Senegal', flag: '🇸🇳', options: ['Senegal', 'Mali', 'Mauritania', 'Guinea'] },
        { country: 'Rwanda', flag: '🇷🇼', options: ['Rwanda', 'Burundi', 'Uganda', 'Democratic Republic of Congo'] },
        
        // Americas - North America
        { country: 'Canada', flag: '🇨🇦', options: ['Canada', 'United States', 'Mexico', 'Greenland'] },
        { country: 'United States', flag: '🇺🇸', options: ['United States', 'Canada', 'Mexico', 'Australia'] },
        { country: 'Mexico', flag: '🇲🇽', options: ['Mexico', 'Costa Rica', 'Guatemala', 'Nicaragua'] },
        
        // Americas - Central America
        { country: 'Guatemala', flag: '🇬🇹', options: ['Guatemala', 'Honduras', 'El Salvador', 'Nicaragua'] },
        { country: 'Honduras', flag: '🇭🇳', options: ['Honduras', 'Guatemala', 'El Salvador', 'Nicaragua'] },
        { country: 'El Salvador', flag: '🇸🇻', options: ['El Salvador', 'Guatemala', 'Honduras', 'Nicaragua'] },
        { country: 'Nicaragua', flag: '🇳🇮', options: ['Nicaragua', 'Costa Rica', 'Honduras', 'Panama'] },
        { country: 'Costa Rica', flag: '🇨🇷', options: ['Costa Rica', 'Panama', 'Nicaragua', 'Belize'] },
        { country: 'Panama', flag: '🇵🇦', options: ['Panama', 'Costa Rica', 'Colombia', 'Belize'] },
        { country: 'Belize', flag: '🇧🇿', options: ['Belize', 'Guatemala', 'Mexico', 'Honduras'] },
        
        // Americas - Caribbean
        { country: 'Cuba', flag: '🇨🇺', options: ['Cuba', 'Dominican Republic', 'Haiti', 'Jamaica'] },
        { country: 'Dominican Republic', flag: '🇩🇴', options: ['Dominican Republic', 'Haiti', 'Cuba', 'Jamaica'] },
        { country: 'Jamaica', flag: '🇯🇲', options: ['Jamaica', 'Haiti', 'Bahamas', 'Trinidad and Tobago'] },
        { country: 'Haiti', flag: '🇭🇹', options: ['Haiti', 'Dominican Republic', 'Jamaica', 'Cuba'] },
        { country: 'Trinidad and Tobago', flag: '🇹🇹', options: ['Trinidad and Tobago', 'Barbados', 'Grenada', 'Dominica'] },
        
        // Americas - South America
        { country: 'Brazil', flag: '🇧🇷', options: ['Brazil', 'Mexico', 'Argentina', 'Colombia'] },
        { country: 'Argentina', flag: '🇦🇷', options: ['Argentina', 'Chile', 'Uruguay', 'Paraguay'] },
        { country: 'Colombia', flag: '🇨🇴', options: ['Colombia', 'Venezuela', 'Ecuador', 'Peru'] },
        { country: 'Peru', flag: '🇵🇪', options: ['Peru', 'Bolivia', 'Chile', 'Ecuador'] },
        { country: 'Chile', flag: '🇨🇱', options: ['Chile', 'Argentina', 'Peru', 'Bolivia'] },
        { country: 'Venezuela', flag: '🇻🇪', options: ['Venezuela', 'Colombia', 'Guyana', 'Suriname'] },
        { country: 'Ecuador', flag: '🇪🇨', options: ['Ecuador', 'Peru', 'Colombia', 'Bolivia'] },
        { country: 'Bolivia', flag: '🇧🇴', options: ['Bolivia', 'Paraguay', 'Argentina', 'Chile'] },
        { country: 'Paraguay', flag: '🇵🇾', options: ['Paraguay', 'Bolivia', 'Argentina', 'Brazil'] },
        { country: 'Uruguay', flag: '🇺🇾', options: ['Uruguay', 'Argentina', 'Paraguay', 'Chile'] },
        
        // Oceania
        { country: 'Australia', flag: '🇦🇺', options: ['Australia', 'New Zealand', 'Fiji', 'Papua New Guinea'] },
        { country: 'New Zealand', flag: '🇳🇿', options: ['New Zealand', 'Australia', 'Fiji', 'Samoa'] },
        { country: 'Fiji', flag: '🇫🇯', options: ['Fiji', 'Samoa', 'Tonga', 'Vanuatu'] },
        { country: 'Papua New Guinea', flag: '🇵🇬', options: ['Papua New Guinea', 'Solomon Islands', 'Vanuatu', 'Fiji'] },
        { country: 'Samoa', flag: '🇼🇸', options: ['Samoa', 'Tonga', 'Fiji', 'Kiribati'] },
        { country: 'Tonga', flag: '🇹🇴', options: ['Tonga', 'Samoa', 'Vanuatu', 'Fiji'] },
    ];

    const question = countries[Math.floor(Math.random() * countries.length)];
    displayQuestion(question);
}

// Display Question
function displayQuestion(question) {
    gameState.currentCountry = question.country;
    
    // Get country code and display flag image
    const countryCode = getCountryCode(question.country);
    console.log(`Loading flag for ${question.country}: code = ${countryCode}`);
    
    if (countryCode) {
        // Try multiple flag services for reliability
        flagImage.src = `https://flagcdn.com/w320/${countryCode}.png`;
        flagImage.alt = question.country;
        flagImage.style.display = 'block';
        
        flagImage.onerror = function() {
            console.error(`Failed to load flag for ${question.country} from flagcdn.com`);
            // Fallback to flags.fmcdn.net
            flagImage.src = `https://flags.fmcdn.net/${countryCode}.png`;
            
            flagImage.onerror = function() {
                console.error(`Failed to load flag for ${question.country} from all services`);
                // Final fallback to emoji
                if (question.flag && question.flag.length > 0) {
                    const flagDisplay = document.querySelector('.flag-display');
                    flagDisplay.innerHTML = `<span class="emoji-flag">${question.flag}</span>`;
                    flagImage.style.display = 'none';
                }
            };
        };
    } else {
        console.warn(`No country code found for ${question.country}`);
        // Fallback to emoji flag
        if (question.flag && question.flag.length > 0) {
            const flagDisplay = document.querySelector('.flag-display');
            flagDisplay.innerHTML = `<span class="emoji-flag">${question.flag}</span>`;
            flagImage.style.display = 'none';
        } else {
            flagImage.style.display = 'none';
            flagImage.src = '';
        }
    }

    // Display options
    optionsContainer.innerHTML = '';
    const options = question.options || [question.country];
    
    // Shuffle options
    const shuffledOptions = [...new Set(options)].sort(() => Math.random() - 0.5);

    shuffledOptions.forEach((option) => {
        const button = document.createElement('button');
        button.className = 'option';
        button.textContent = option;
        button.addEventListener('click', () => handleOptionClick(option, question.country));
        optionsContainer.appendChild(button);
    });
}

// Handle Option Click
async function handleOptionClick(selectedOption, correctCountry) {
    const isCorrect = selectedOption === correctCountry;

    // Disable all options
    document.querySelectorAll('.option').forEach((opt) => {
        opt.disabled = true;
        if (opt.textContent === correctCountry) {
            opt.classList.add('correct');
        } else if (opt.textContent === selectedOption && !isCorrect) {
            opt.classList.add('incorrect');
        }
    });

    // Update score and streak
    if (isCorrect) {
        gameState.score += POINTS_PER_CORRECT;
        gameState.currentStreak++;
        if (gameState.currentStreak > gameState.bestStreak) {
            gameState.bestStreak = gameState.currentStreak;
        }
    } else {
        gameState.currentStreak = 0;
    }

    updateScoreDisplay();

    // Show result
    resultMessage.textContent = isCorrect ? '✓ Correct!' : '✗ Incorrect!';
    resultMessage.style.color = isCorrect ? 'var(--success-color)' : 'var(--danger-color)';
    resultAnswer.textContent = `The country is ${correctCountry}`;
    document.getElementById('result-score').textContent = gameState.score;
    document.getElementById('result-streak').textContent = gameState.currentStreak;

    resultsModal.style.display = 'flex';

    // For endless game, always show both buttons
    nextBtn.style.display = 'block';
    finishBtn.style.display = 'block';

    // Save answer to backend
    try {
        await fetch(`${API_BASE_URL}/game/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: gameState.userId,
                country: correctCountry,
                isCorrect,
                points: isCorrect ? POINTS_PER_CORRECT : 0,
            }),
        });
    } catch (error) {
        console.error('Error saving answer:', error);
    }
}

// Finish Game
async function finishGame() {
    gameState.gameActive = false;

    try {
        await fetch(`${API_BASE_URL}/game/finish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: gameState.userId,
                username: gameState.username,
                score: gameState.score,
                streak: gameState.bestStreak,
                location: gameState.userLocation,
            }),
        });
    } catch (error) {
        console.error('Error finishing game:', error);
    }

    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('final-streak').textContent = gameState.bestStreak;
    gameoverModal.style.display = 'flex';
    resultsModal.style.display = 'none';
}

// Update Score Display
function updateScoreDisplay() {
    scoreDisplay.textContent = gameState.score;
    streakDisplay.textContent = gameState.currentStreak;
}

// Update Progress Bar
function updateProgressBar() {
    // For endless game, show questions answered
    progressText.textContent = `Questions Answered: ${gameState.currentQuestion}`;
    // Animated progress bar
    progressFill.style.width = '100%';
}

// Load Leaderboard
async function loadLeaderboard(filter = 'global') {
    try {
        const response = await fetch(`${API_BASE_URL}/leaderboard?filter=${filter}`);
        const data = await response.json();

        if (data.success) {
            displayLeaderboard(data.leaderboard);
        } else {
            loadOfflineLeaderboard();
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        loadOfflineLeaderboard();
    }
}

// Display Leaderboard
function displayLeaderboard(leaderboard) {
    leaderboardBody.innerHTML = '';
    leaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.username}</td>
            <td>${entry.location || 'Unknown'}</td>
            <td>${entry.score}</td>
            <td>${entry.streak}</td>
        `;
        leaderboardBody.appendChild(row);
    });
}

// Fallback: Load Offline Leaderboard
function loadOfflineLeaderboard() {
    const mockLeaderboard = [
        { username: 'FlagMaster', location: 'USA', score: 450, streak: 15 },
        { username: 'GeographyNerd', location: 'UK', score: 420, streak: 12 },
        { username: 'WorldTraveler', location: 'France', score: 390, streak: 10 },
        { username: gameState.username, location: gameState.userLocation, score: gameState.score, streak: gameState.bestStreak },
        { username: 'QuizQueen', location: 'Canada', score: 350, streak: 8 },
    ];
    displayLeaderboard(mockLeaderboard.sort((a, b) => b.score - a.score));
}

// Utility: Get Country Code
function getCountryCode(countryName) {
    const countryMap = {
        'Afghanistan': 'af',
        'Albania': 'al',
        'Algeria': 'dz',
        'Andorra': 'ad',
        'Angola': 'ao',
        'Antigua and Barbuda': 'ag',
        'Argentina': 'ar',
        'Armenia': 'am',
        'Australia': 'au',
        'Austria': 'at',
        'Azerbaijan': 'az',
        'Bahamas': 'bs',
        'Bahrain': 'bh',
        'Bangladesh': 'bd',
        'Barbados': 'bb',
        'Belarus': 'by',
        'Belgium': 'be',
        'Belize': 'bz',
        'Benin': 'bj',
        'Bhutan': 'bt',
        'Bolivia': 'bo',
        'Bosnia and Herzegovina': 'ba',
        'Botswana': 'bw',
        'Brazil': 'br',
        'Brunei': 'bn',
        'Bulgaria': 'bg',
        'Burkina Faso': 'bf',
        'Burundi': 'bi',
        'Cambodia': 'kh',
        'Cameroon': 'cm',
        'Canada': 'ca',
        'Cape Verde': 'cv',
        'Central African Republic': 'cf',
        'Chad': 'td',
        'Chile': 'cl',
        'China': 'cn',
        'Colombia': 'co',
        'Comoros': 'km',
        'Congo': 'cg',
        'Democratic Republic of Congo': 'cd',
        'Costa Rica': 'cr',
        'Croatia': 'hr',
        'Cuba': 'cu',
        'Cyprus': 'cy',
        'Czech Republic': 'cz',
        'Denmark': 'dk',
        'Djibouti': 'dj',
        'Dominica': 'dm',
        'Dominican Republic': 'do',
        'Ecuador': 'ec',
        'Egypt': 'eg',
        'El Salvador': 'sv',
        'Equatorial Guinea': 'gq',
        'Eritrea': 'er',
        'Estonia': 'ee',
        'Eswatini': 'sz',
        'Ethiopia': 'et',
        'Fiji': 'fj',
        'Finland': 'fi',
        'France': 'fr',
        'Gabon': 'ga',
        'Gambia': 'gm',
        'Georgia': 'ge',
        'Germany': 'de',
        'Ghana': 'gh',
        'Greece': 'gr',
        'Greenland': 'gl',
        'Grenada': 'gd',
        'Guatemala': 'gt',
        'Guinea': 'gn',
        'Guinea-Bissau': 'gw',
        'Guyana': 'gy',
        'Haiti': 'ht',
        'Honduras': 'hn',
        'Hungary': 'hu',
        'Iceland': 'is',
        'India': 'in',
        'Indonesia': 'id',
        'Iran': 'ir',
        'Iraq': 'iq',
        'Ireland': 'ie',
        'Israel': 'il',
        'Italy': 'it',
        'Ivory Coast': 'ci',
        'Jamaica': 'jm',
        'Japan': 'jp',
        'Jordan': 'jo',
        'Kazakhstan': 'kz',
        'Kenya': 'ke',
        'Kiribati': 'ki',
        'Korea': 'kr',
        'North Korea': 'kp',
        'South Korea': 'kr',
        'Kosovo': 'xk',
        'Kuwait': 'kw',
        'Kyrgyzstan': 'kg',
        'Laos': 'la',
        'Latvia': 'lv',
        'Lebanon': 'lb',
        'Lesotho': 'ls',
        'Liberia': 'lr',
        'Libya': 'ly',
        'Liechtenstein': 'li',
        'Lithuania': 'lt',
        'Luxembourg': 'lu',
        'Madagascar': 'mg',
        'Malawi': 'mw',
        'Malaysia': 'my',
        'Maldives': 'mv',
        'Mali': 'ml',
        'Malta': 'mt',
        'Marshall Islands': 'mh',
        'Mauritania': 'mr',
        'Mauritius': 'mu',
        'Mexico': 'mx',
        'Micronesia': 'fm',
        'Moldova': 'md',
        'Monaco': 'mc',
        'Mongolia': 'mn',
        'Montenegro': 'me',
        'Morocco': 'ma',
        'Mozambique': 'mz',
        'Myanmar': 'mm',
        'Namibia': 'na',
        'Nauru': 'nr',
        'Nepal': 'np',
        'Netherlands': 'nl',
        'New Zealand': 'nz',
        'Nicaragua': 'ni',
        'Niger': 'ne',
        'Nigeria': 'ng',
        'North Macedonia': 'mk',
        'Norway': 'no',
        'Oman': 'om',
        'Pakistan': 'pk',
        'Palau': 'pw',
        'Palestine': 'ps',
        'Panama': 'pa',
        'Papua New Guinea': 'pg',
        'Paraguay': 'py',
        'Peru': 'pe',
        'Philippines': 'ph',
        'Poland': 'pl',
        'Portugal': 'pt',
        'Qatar': 'qa',
        'Romania': 'ro',
        'Russia': 'ru',
        'Rwanda': 'rw',
        'Saint Kitts and Nevis': 'kn',
        'Saint Lucia': 'lc',
        'Saint Vincent and the Grenadines': 'vc',
        'Samoa': 'ws',
        'San Marino': 'sm',
        'Sao Tome and Principe': 'st',
        'Saudi Arabia': 'sa',
        'Senegal': 'sn',
        'Serbia': 'rs',
        'Seychelles': 'sc',
        'Sierra Leone': 'sl',
        'Singapore': 'sg',
        'Slovakia': 'sk',
        'Slovenia': 'si',
        'Solomon Islands': 'sb',
        'Somalia': 'so',
        'South Africa': 'za',
        'South Sudan': 'ss',
        'Spain': 'es',
        'Sri Lanka': 'lk',
        'Sudan': 'sd',
        'Suriname': 'sr',
        'Sweden': 'se',
        'Switzerland': 'ch',
        'Syria': 'sy',
        'Taiwan': 'tw',
        'Tajikistan': 'tj',
        'Tanzania': 'tz',
        'Thailand': 'th',
        'Timor-Leste': 'tl',
        'Togo': 'tg',
        'Tonga': 'to',
        'Trinidad and Tobago': 'tt',
        'Tunisia': 'tn',
        'Turkey': 'tr',
        'Turkmenistan': 'tm',
        'Tuvalu': 'tv',
        'Uganda': 'ug',
        'Ukraine': 'ua',
        'United Arab Emirates': 'ae',
        'United Kingdom': 'gb',
        'United States': 'us',
        'Uruguay': 'uy',
        'Uzbekistan': 'uz',
        'Vanuatu': 'vu',
        'Vatican City': 'va',
        'Venezuela': 've',
        'Vietnam': 'vn',
        'Yemen': 'ye',
        'Zambia': 'zm',
        'Zimbabwe': 'zw',
    };
    return countryMap[countryName] || null;
}
