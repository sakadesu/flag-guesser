const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Setup
const dbPath = path.join(__dirname, 'game.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Database error:', err);
    else console.log('Connected to SQLite database');
});

// Initialize Database
function initializeDatabase() {
    // Users Table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            location TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Games Table
    db.run(`
        CREATE TABLE IF NOT EXISTS games (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            score INTEGER DEFAULT 0,
            streak INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Answers Table
    db.run(`
        CREATE TABLE IF NOT EXISTS answers (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            game_id TEXT,
            country TEXT NOT NULL,
            is_correct BOOLEAN NOT NULL,
            points INTEGER DEFAULT 0,
            answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (game_id) REFERENCES games(id)
        )
    `);

    // Leaderboard Table (for performance)
    db.run(`
        CREATE TABLE IF NOT EXISTS leaderboard (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            username TEXT NOT NULL,
            location TEXT,
            total_score INTEGER DEFAULT 0,
            best_streak INTEGER DEFAULT 0,
            games_played INTEGER DEFAULT 0,
            last_played DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id)
        )
    `);
}

// Initialize database on startup
initializeDatabase();

// Routes

// Auth Routes
app.post('/api/auth/login', (req, res) => {
    const { username, location } = req.body;

    if (!username) {
        return res.json({ success: false, message: 'Username required' });
    }

    const userId = uuidv4();
    const query = `INSERT OR IGNORE INTO users (id, username, location) VALUES (?, ?, ?)`;

    db.run(query, [userId, username, location], function (err) {
        if (err) {
            // User already exists, fetch their data
            db.get(
                `SELECT * FROM users WHERE username = ?`,
                [username],
                (err, user) => {
                    if (err || !user) {
                        return res.json({ success: false, message: 'User not found' });
                    }
                    res.json({ success: true, user });
                }
            );
        } else {
            res.json({
                success: true,
                user: { id: userId, username, location },
            });
        }
    });
});

// Game Routes
app.get('/api/game/question', (req, res) => {
    const questions = [
        {
            country: 'France',
            flag: 'https://flagcdn.com/w320/fr.png',
            options: ['France', 'Italy', 'Spain', 'Germany'],
        },
        {
            country: 'Japan',
            flag: 'https://flagcdn.com/w320/jp.png',
            options: ['Japan', 'South Korea', 'Thailand', 'Vietnam'],
        },
        {
            country: 'Brazil',
            flag: 'https://flagcdn.com/w320/br.png',
            options: ['Brazil', 'Mexico', 'Argentina', 'Colombia'],
        },
        {
            country: 'Canada',
            flag: 'https://flagcdn.com/w320/ca.png',
            options: ['Canada', 'United States', 'Australia', 'New Zealand'],
        },
        {
            country: 'Egypt',
            flag: 'https://flagcdn.com/w320/eg.png',
            options: ['Egypt', 'Libya', 'Sudan', 'Ethiopia'],
        },
        {
            country: 'India',
            flag: 'https://flagcdn.com/w320/in.png',
            options: ['India', 'Pakistan', 'Bangladesh', 'Nepal'],
        },
        {
            country: 'Australia',
            flag: 'https://flagcdn.com/w320/au.png',
            options: ['Australia', 'New Zealand', 'Fiji', 'Samoa'],
        },
        {
            country: 'Germany',
            flag: 'https://flagcdn.com/w320/de.png',
            options: ['Germany', 'Austria', 'Switzerland', 'Netherlands'],
        },
        {
            country: 'Mexico',
            flag: 'https://flagcdn.com/w320/mx.png',
            options: ['Mexico', 'Costa Rica', 'Guatemala', 'Nicaragua'],
        },
        {
            country: 'Russia',
            flag: 'https://flagcdn.com/w320/ru.png',
            options: ['Russia', 'Ukraine', 'Belarus', 'Kazakhstan'],
        },
        {
            country: 'United Kingdom',
            flag: 'https://flagcdn.com/w320/gb.png',
            options: ['United Kingdom', 'France', 'Netherlands', 'Belgium'],
        },
        {
            country: 'Italy',
            flag: 'https://flagcdn.com/w320/it.png',
            options: ['Italy', 'Spain', 'Portugal', 'Greece'],
        },
        {
            country: 'Spain',
            flag: 'https://flagcdn.com/w320/es.png',
            options: ['Spain', 'France', 'Portugal', 'Italy'],
        },
        {
            country: 'South Africa',
            flag: 'https://flagcdn.com/w320/za.png',
            options: ['South Africa', 'Kenya', 'Nigeria', 'Ghana'],
        },
        {
            country: 'Thailand',
            flag: 'https://flagcdn.com/w320/th.png',
            options: ['Thailand', 'Vietnam', 'Cambodia', 'Laos'],
        },
        {
            country: 'Greece',
            flag: 'https://flagcdn.com/w320/gr.png',
            options: ['Greece', 'Turkey', 'Cyprus', 'Bulgaria'],
        },
        {
            country: 'Sweden',
            flag: 'https://flagcdn.com/w320/se.png',
            options: ['Sweden', 'Norway', 'Finland', 'Denmark'],
        },
        {
            country: 'Netherlands',
            flag: 'https://flagcdn.com/w320/nl.png',
            options: ['Netherlands', 'Belgium', 'Luxembourg', 'Germany'],
        },
        {
            country: 'Argentina',
            flag: 'https://flagcdn.com/w320/ar.png',
            options: ['Argentina', 'Uruguay', 'Chile', 'Paraguay'],
        },
        {
            country: 'Chile',
            flag: 'https://flagcdn.com/w320/cl.png',
            options: ['Chile', 'Peru', 'Bolivia', 'Argentina'],
        },
    ];

    const question = questions[Math.floor(Math.random() * questions.length)];
    res.json({ success: true, question });
});

app.post('/api/game/answer', (req, res) => {
    const { userId, country, isCorrect, points } = req.body;
    const answerId = uuidv4();

    const query = `INSERT INTO answers (id, user_id, country, is_correct, points) VALUES (?, ?, ?, ?, ?)`;

    db.run(query, [answerId, userId, country, isCorrect, points], (err) => {
        if (err) {
            console.error('Error saving answer:', err);
            return res.json({ success: false, message: 'Error saving answer' });
        }
        res.json({ success: true });
    });
});

app.post('/api/game/finish', (req, res) => {
    const { userId, username, score, streak, location } = req.body;

    // Update leaderboard
    const leaderboardQuery = `
        INSERT OR REPLACE INTO leaderboard (id, user_id, username, location, total_score, best_streak, games_played, last_played)
        VALUES (
            (SELECT id FROM leaderboard WHERE user_id = ? LIMIT 1) OR ?,
            ?,
            ?,
            ?,
            COALESCE((SELECT total_score FROM leaderboard WHERE user_id = ?), 0) + ?,
            MAX(COALESCE((SELECT best_streak FROM leaderboard WHERE user_id = ?), 0), ?),
            COALESCE((SELECT games_played FROM leaderboard WHERE user_id = ?), 0) + 1,
            CURRENT_TIMESTAMP
        )
    `;

    db.run(
        leaderboardQuery,
        [userId, uuidv4(), userId, username, location, userId, score, userId, streak, userId],
        (err) => {
            if (err) {
                console.error('Error updating leaderboard:', err);
                return res.json({ success: false, message: 'Error finishing game' });
            }
            res.json({ success: true });
        }
    );
});

// Leaderboard Routes
app.get('/api/leaderboard', (req, res) => {
    const { filter = 'global' } = req.query;

    let query = `SELECT username, location, total_score as score, best_streak as streak FROM leaderboard ORDER BY total_score DESC LIMIT 100`;

    if (filter === 'today') {
        query = `
            SELECT username, location, total_score as score, best_streak as streak 
            FROM leaderboard 
            WHERE DATE(last_played) = DATE('now')
            ORDER BY total_score DESC LIMIT 100
        `;
    } else if (filter === 'week') {
        query = `
            SELECT username, location, total_score as score, best_streak as streak 
            FROM leaderboard 
            WHERE DATE(last_played) >= DATE('now', '-7 days')
            ORDER BY total_score DESC LIMIT 100
        `;
    } else if (filter === 'month') {
        query = `
            SELECT username, location, total_score as score, best_streak as streak 
            FROM leaderboard 
            WHERE DATE(last_played) >= DATE('now', '-30 days')
            ORDER BY total_score DESC LIMIT 100
        `;
    }

    db.all(query, (err, rows) => {
        if (err) {
            console.error('Error fetching leaderboard:', err);
            return res.json({ success: false, message: 'Error fetching leaderboard' });
        }
        res.json({ success: true, leaderboard: rows || [] });
    });
});

app.get('/api/leaderboard/user/:userId', (req, res) => {
    const { userId } = req.params;

    const query = `SELECT * FROM leaderboard WHERE user_id = ? LIMIT 1`;

    db.get(query, [userId], (err, row) => {
        if (err) {
            console.error('Error fetching user stats:', err);
            return res.json({ success: false, message: 'Error fetching stats' });
        }
        res.json({ success: true, stats: row || {} });
    });
});

// Stats Routes
app.get('/api/stats/summary', (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.json({ success: false, message: 'User ID required' });
    }

    const query = `
        SELECT 
            COUNT(*) as games_played,
            SUM(points) as total_points,
            MAX(streak) as best_streak,
            AVG(is_correct) * 100 as accuracy
        FROM answers
        WHERE user_id = ?
    `;

    db.get(query, [userId], (err, row) => {
        if (err) {
            console.error('Error fetching stats:', err);
            return res.json({ success: false, message: 'Error fetching stats' });
        }
        res.json({ success: true, stats: row });
    });
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🎮 Flag Guesser Server is running on http://localhost:${PORT}`);
    console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🗄️  Database: ${dbPath}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    db.close(() => {
        console.log('Database connection closed');
        process.exit(0);
    });
});
