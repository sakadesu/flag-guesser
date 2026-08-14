# 🚩 Flag Guesser - Country Flag Guessing Game

A fun and engaging web-based game where players guess countries based on their flags. Features a global leaderboard, user location tracking, and point-based scoring system.

## Features

- 🎮 **Interactive Gameplay**: Guess the country from its flag
- 📍 **Location Tracking**: Automatic user location detection
- 🏆 **Global Leaderboard**: Compete with players worldwide
- 💯 **Scoring System**: 10 points per correct answer
- 📊 **Statistics**: Track your performance and streaks
- 🎯 **Multiple Filters**: View leaderboard by Global, Today, Week, or Month
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Project Structure

```
flag-guesser/
├── index.html              # Main game UI
├── styles.css              # Game styling
├── script.js               # Frontend logic
├── README.md               # This file
└── backend/
    ├── server.js           # Express server & API
    ├── package.json        # Node dependencies
    ├── game.db             # SQLite database (generated)
    └── README.md           # Backend setup
```

## Quick Start

### Frontend Setup

The frontend is a standalone HTML/CSS/JS application:

1. Open `index.html` in your web browser, or
2. Use a simple HTTP server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js (http-server)
   npx http-server
   ```

3. Open `http://localhost:8000` in your browser

### Backend Setup

The backend provides API endpoints for data persistence:

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

4. The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login/registration

### Game
- `GET /api/game/question` - Get a random flag question
- `POST /api/game/answer` - Submit an answer
- `POST /api/game/finish` - Finish a game session

### Leaderboard
- `GET /api/leaderboard?filter=global` - Get global leaderboard
- `GET /api/leaderboard/user/:userId` - Get user stats

### Stats
- `GET /api/stats/summary?userId=<id>` - Get user statistics

### Health
- `GET /api/health` - Check server status

## Scoring Rules

- **Correct Answer**: +10 points
- **Incorrect Answer**: 0 points (streak resets)
- **Streak**: Consecutive correct answers count as your streak
- **Best Streak**: Your highest consecutive correct answers

## How to Play

1. **Login**: Enter your username to start playing (or play as a guest)
2. **Guess**: Look at the flag and select the correct country from 4 options
3. **Score Points**: Earn 10 points for each correct answer
4. **Build Streak**: Keep your streak alive with consecutive correct answers
5. **Track Progress**: Check the leaderboard to see how you rank globally
6. **View Stats**: Your location and performance are tracked automatically

## Features Explained

### Scoring System
- Each correct answer awards **10 points**
- Questions are presented continuously
- Your streak shows consecutive correct answers
- Best streak is your personal record

### Global Leaderboard
- **Global**: All-time top players
- **Today**: Top players from today
- **This Week**: Top players from the last 7 days
- **This Month**: Top players from the last 30 days

### User Location
- Automatically detected using browser geolocation API
- Displayed on your profile and leaderboard
- Uses OpenStreetMap for reverse geocoding

## Technology Stack

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **Vanilla JavaScript**: No frameworks, lightweight and fast

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **SQLite3**: Lightweight database
- **CORS**: Cross-Origin Resource Sharing

## Database Schema

### Users Table
```sql
- id (TEXT, PRIMARY KEY)
- username (TEXT, UNIQUE)
- location (TEXT)
- created_at (DATETIME)
```

### Games Table
```sql
- id (TEXT, PRIMARY KEY)
- user_id (TEXT, FOREIGN KEY)
- score (INTEGER)
- streak (INTEGER)
- created_at (DATETIME)
```

### Answers Table
```sql
- id (TEXT, PRIMARY KEY)
- user_id (TEXT, FOREIGN KEY)
- game_id (TEXT, FOREIGN KEY)
- country (TEXT)
- is_correct (BOOLEAN)
- points (INTEGER)
- answered_at (DATETIME)
```

### Leaderboard Table
```sql
- id (TEXT, PRIMARY KEY)
- user_id (TEXT, FOREIGN KEY)
- username (TEXT)
- location (TEXT)
- total_score (INTEGER)
- best_streak (INTEGER)
- games_played (INTEGER)
- last_played (DATETIME)
```

## Troubleshooting

### Game not loading
- Check browser console for errors (F12)
- Ensure backend server is running on port 5000
- Check CORS settings if cross-origin issues occur

### Leaderboard not updating
- Make sure backend is running
- Check database file exists at `backend/game.db`
- Verify network tab shows API responses

### Location not showing
- Allow browser permission for geolocation
- Check if OpenStreetMap API is accessible
- Fallback location "Unknown" will be used if unavailable

### Database issues
- Delete `backend/game.db` to reset
- Backend will recreate tables on next startup
- Check SQLite installation: `sqlite3 --version`

## Future Enhancements

- [ ] User authentication with passwords
- [ ] Social features (friends, challenges)
- [ ] Difficulty levels (Easy, Medium, Hard)
- [ ] Achievement badges
- [ ] Dark/Light theme toggle
- [ ] Mobile app version
- [ ] Multiplayer competitive mode
- [ ] Country facts and information
- [ ] Seasonal tournaments
- [ ] Custom flag categories

## License

MIT License - Feel free to use this project for learning and personal use.

## Contributing

Pull requests are welcome! Feel free to fork and improve.

## Credits

- Flags: [flagcdn.com](https://flagcdn.com)
- Geolocation: [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org)
- Icons: Emoji ♻️

---

**Enjoy the game! 🚩** Can you guess them all?
