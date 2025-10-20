# Connect-4 Game

A real-time multiplayer Connect-4 game implementation with bot support and analytics features.

## Project Structure

```
connect4-analytics/    # Analytics service for game events
connect4-backend/      # Game server and logic
connect4-frontend/     # React-based web interface
```

## Features

- ⚡ Real-time multiplayer gameplay using WebSocket
- 🤖 AI Bot player for single-player mode
- 📊 Game analytics and event tracking
- 🏆 Leaderboard system
- 💾 Game state persistence
- 📱 Responsive design with Tailwind CSS

## Tech Stack

### Frontend

- React.js
- Tailwind CSS
- Vite
- WebSocket client

### Backend

- Node.js
- WebSocket server
- File-based storage
- Unit tests

### Analytics

- Kafka event streaming
- Data processing services

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository:

```bash
git clone https://github.com/gowthamnagisetti/connect-4.git
cd connect-4
```

2. Install Backend Dependencies:

```bash
cd connect4-backend
npm install
```

3. Install Frontend Dependencies:

```bash
cd ../connect4-frontend
npm install
```

4. Install Analytics Dependencies:

```bash
cd ../connect4-analytics
npm install
```

### Running the Application

1. Start the Backend Server:

```bash
cd connect4-backend
npm run dev
```

2. Start the Frontend Development Server:

```bash
cd connect4-frontend
npm run dev
```

3. Start the Analytics Service:

```bash
cd connect4-analytics
npm run start
```

Access the application at `http://localhost:5173`

## Game Rules

1. Players take turns dropping colored disks into a 7x6 grid
2. The first player to connect 4 disks in a row (horizontally, vertically, or diagonally) wins
3. If the grid fills up without a winner, the game is a draw

## Features in Detail

### Multiplayer Mode

- Real-time game updates using WebSocket
- Player matchmaking system
- Game state synchronization

### Single Player Mode

- Play against an AI bot
- Multiple difficulty levels
- Instant responses

### Analytics

- Game event tracking
- Player statistics
- Performance metrics

## Project Architecture

### Frontend Components

- Modular React components
- Custom hooks for game logic
- Real-time WebSocket integration
- Responsive UI with Tailwind CSS

### Backend Services

- WebSocket server for real-time communication
- Game state management
- Bot logic implementation
- Data persistence

### Analytics System

- Kafka event streaming
- Event processing and analysis
- Data storage and retrieval

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Gowtham Nagisetti

## Acknowledgments

- Special thanks to Emitrr for the project requirements
- Connect-4 game rules and strategies
- React and Node.js communities for excellent documentation
