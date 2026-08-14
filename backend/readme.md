# Flag Guesser Backend

Express.js API server for the Flag Guesser game with SQLite database.

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation

1. Install dependencies:
```bash
npm install
```

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Login or register a user
```json
Request:
{
  "username": "player_name",
  "location": "Country Name"
}

Response:
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "player_name",
    "location": "Country Name"
  }
}
```

### Game Endpoints

#### GET /api/game/question
Get a random flag question
```json
Response:
{
  "success": true,
  "question": {
    "country": "France",
    "flag": "https://flagcdn.com/w320/fr.png",
    "options": ["France", "Italy", "Spain", "Germany"]
  }
}
```

#### POST /api/game/answer
Submit an answer
```json
Request:
{
  "userId": "uuid",
  "country": "France",
  "isCorrect": true,
  "points": 10
}

Response:
{
  "success": true
}
```

#### POST /api/game/finish
Finish a game session and update leaderboard
```json
Request:
{
  "userId": "uuid",
  "username": "player_name",
  "score": 100,
  "streak": 10,
  "location": "Country Name"
}

Response:
{
  "success": true
}
```

### Leaderboard Endpoints

#### GET /api/leaderboard?filter=global
Get leaderboard with optional filter
```
Query Parameters:
- filter: 'global' (default), 'today', 'week', 'month'

Response:
{
  "success": true,
  "leaderboard": [
    {
      "username": "player_name",
      "location": "Country Name",
      "score": 100,
      "streak": 10
    }
  ]
}
```

#### GET /api/leaderboard/user/:userId
Get a specific user's stats
```json
Response:
{
  "success": true,
  "stats": {
    "user_id": "uuid",
    "username": "player_name",
    "location": "Country Name",
    "total_score": 100,
    "best_streak": 10,
    "games_played": 5,
    "last_played": "2024-01-15T10:30:00"
  }
}
```

### Statistics Endpoints

#### GET /api/stats/summary?userId=uuid
Get user statistics
```json
Response:
{
  "success": true,
  "stats": {
    "games_played": 5,
    "total_points": 100,
    "best_streak": 10,
    "accuracy": 85.5
  }
}
```

### Health Check

#### GET /api/health
Check server status
```json
Response:
{
  "success": true,
  "message": "Server is running"
}
```

## Database

The application uses SQLite3 with the following tables:

### users
- id: TEXT (PRIMARY KEY)
- username: TEXT (UNIQUE)
- location: TEXT
- created_at: DATETIME

### games
- id: TEXT (PRIMARY KEY)
- user_id: TEXT (FOREIGN KEY)
- score: INTEGER
- streak: INTEGER
- created_at: DATETIME

### answers
- id: TEXT (PRIMARY KEY)
- user_id: TEXT (FOREIGN KEY)
- game_id: TEXT (FOREIGN KEY)
- country: TEXT
- is_correct: BOOLEAN
- points: INTEGER
- answered_at: DATETIME

### leaderboard
- id: TEXT (PRIMARY KEY)
- user_id: TEXT (FOREIGN KEY)
- username: TEXT
- location: TEXT
- total_score: INTEGER
- best_streak: INTEGER
- games_played: INTEGER
- last_played: DATETIME

## Environment Variables

Create a `.env` file in the backend directory (optional):
```env
PORT=5000
DB_PATH=./game.db
NODE_ENV=development
```

## CORS Configuration

The server allows requests from any origin. To restrict it, modify the CORS settings in `server.js`:

```javascript
app.use(cors({
  origin: 'http://localhost:3000' // Specify your frontend URL
}));
```

## Troubleshooting

### Port 5000 already in use
Change the PORT variable in `server.js` and update the frontend API_BASE_URL.

### Database locked error
- Close any other instances of the application
- Delete `game.db` and restart the server

### Module not found errors
Reinstall dependencies:
```bash
rm -rf node_modules
npm install
```

### CORS errors
Ensure the frontend is making requests to `http://localhost:5000/api`

## Development

### File Structure
```
backend/
├── server.js       # Main server file with all routes
├── package.json    # Dependencies
├── game.db         # SQLite database (generated)
└── README.md       # This file
```

### Adding New Routes

Edit `server.js` to add new routes:

```javascript
app.post('/api/new-route', (req, res) => {
  // Your route logic
  res.json({ success: true, data: {} });
});
```

### Database Queries

Use the `db` object to execute queries:

```javascript
// Execute query without returning results
db.run(sql, parameters, callback);

// Execute query returning all results
db.all(sql, parameters, callback);

// Execute query returning one result
db.get(sql, parameters, callback);
```

## Performance Tips

1. **Indexing**: Add indexes on frequently queried columns
2. **Connection Pooling**: For higher traffic, consider using a connection pool
3. **Caching**: Implement caching for leaderboard queries
4. **Database**: Consider migrating to PostgreSQL for production

## Deployment

### Heroku
```bash
heroku create flag-guesser
git push heroku main
```

### Railway.app
```bash
railway login
railway init
railway up
```

### Docker
Create a `Dockerfile`:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## License

MIT License

## Support

For issues and questions, create an issue on the GitHub repository.
