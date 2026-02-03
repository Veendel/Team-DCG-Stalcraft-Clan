# ⚡ STALCRAFT Player Manager

A hobby web app for STALCRAFT players to track stats, equipment, and progress through the Zone.

> **Note:** This is a fan-made project and is not affiliated with EXBO or STALCRAFT official developers.

## 🎮 Features

- 🔐 User registration & login (JWT authentication)
- 📊 Player stats tracking (level, faction, money, K/D ratio)
- 🎒 Equipment management
- 👑 Admin panel for user management
- 🛡️ Role-based access control

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js + Express
- **Database:** SQLite
- **Authentication:** JWT + bcrypt

## 📦 Installation

1. **Clone the repository:**
```bash
   git clone https://github.com/YOUR-USERNAME/stalcraft-manager.git
   cd stalcraft-manager
```

2. **Install dependencies:**
```bash
   npm install
```

3. **Set up environment variables:**
```bash
   cp .env.example .env
```
   
   Edit `.env` and change the `JWT_SECRET` to a random secure string.

4. **Start the server:**
```bash
   npm start
```

5. **Open your browser:**
```
   http://localhost:3000
```

## 🔑 Default Login

**Admin Account:**
- Username: `admin`
- Password: `admin123`

⚠️ **Important:** Change the admin password after first login!

## 📚 Usage

1. Register a new account or use the default admin account
2. Login to access your dashboard
3. Update your player stats and equipment
4. Admins can manage all users from the admin panel

## 🗄️ Database Schema

- **users:** User accounts with authentication
- **player_stats:** Faction, level, money, kills, deaths
- **equipment:** Weapon, armor, helmet, artifact

## 🤝 Contributing

This is a hobby project, but contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

MIT License - Feel free to use this for your own projects!

## ⚠️ Disclaimer

This is an unofficial fan project and is not affiliated with, endorsed by, or connected to EXBO or the official STALCRAFT game.