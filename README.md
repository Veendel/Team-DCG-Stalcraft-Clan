# ⚡ Team DCG - STALCRAFT Clan Tracker

> A full-stack web application for managing STALCRAFT clan members, stats, equipment, and consumables inventory.

![Team DCG](https://img.shields.io/badge/Team-DCG-red?style=for-the-badge)
![Node.js](https://img.shields.io/badge/node.js-18+-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)

---

## 🎮 Features

- **🔐 Secure Authentication** - JWT-based login with bcrypt password hashing
- **📊 Player Stats** - Track kills, deaths, K/D ratios, in-game names, and Discord IDs
- **🎒 Equipment Management** - Manage weapons, armors, and artifact builds with image uploads
- **💊 Consumables Tracker** - Full inventory system for grenades, enhancements, mobility items, and more
- **👑 Admin Dashboard** - Complete clan oversight with stats view and consumables view
- **📥 Data Export** - Export all clan data to CSV for analysis
- **🛡️ Security Features** - Rate limiting, input validation, SQL injection protection, XSS protection
- **🎨 Dark Theme** - Professional black & grey Team DCG design

---

## 🛠️ Tech Stack

**Frontend:**
- HTML5
- CSS3 (Custom Dark Theme)
- Vanilla JavaScript

**Backend:**
- Node.js
- Express.js
- PostgreSQL
- JWT (JSON Web Tokens)
- Bcrypt

**Security:**
- Helmet.js
- Express Rate Limit
- Express Validator
- Content Security Policy (CSP)

---
## 🗂️ Project Structure
```
team-dcg-tracker/
├── database/
│   └── db.js                 # Database setup and initialization
├── middleware/
│   ├── auth.js               # JWT authentication middleware
│   └── security.js           # Security middleware (rate limiting, validation)
├── routes/
│   ├── auth.js               # Authentication routes (login, register)
│   └── admin.js              # Admin routes (stats, equipment, consumables)
├── public/
│   ├── index.html            # Landing page
│   ├── login.html            # Login page
│   ├── register.html         # Registration page
│   ├── dashboard.html        # Member dashboard
│   ├── admin.html            # Admin panel
│   ├── css/
│   │   └── style.css         # Team DCG dark theme styles
│   └── js/
│       ├── auth.js           # Client-side auth logic
│       ├── dashboard.js      # Dashboard functionality
│       └── admin.js          # Admin panel functionality
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore file
├── package.json              # Dependencies
├── server.js                 # Express server entry point
└── README.md                 # You are here!
```

---

## 🔒 Security Features

- ✅ **Password Hashing** - Bcrypt with salt rounds
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Rate Limiting** - Prevents brute force attacks
- ✅ **Input Validation** - SQL injection and XSS protection
- ✅ **Account Lockout** - Auto-lock after failed login attempts
- ✅ **Request Size Limits** - Prevents payload attacks
- ✅ **Security Headers** - Helmet.js protection
- ✅ **CORS Configuration** - Controlled cross-origin requests

---

## 📊 Database Schema

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| username | TEXT | Unique username |
| password | TEXT | Bcrypt hashed password |
| role | TEXT | 'user' or 'admin' |
| created_at | DATETIME | Registration timestamp |

### Player Stats Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| user_id | INTEGER | Foreign key → users.id |
| ingame_name | TEXT | STALCRAFT in-game name |
| discord_name | TEXT | Discord username |
| kills | INTEGER | Total kills |
| deaths | INTEGER | Total deaths |

### Equipment Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| user_id | INTEGER | Foreign key → users.id |
| weapons | TEXT | Weapon loadout |
| armors | TEXT | Armor loadout |
| artifact_builds | TEXT | Artifact setup description |
| artifact_image | TEXT | Base64 encoded screenshot |

### Consumables Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| user_id | INTEGER | Foreign key → users.id |
| nade_* | INTEGER | Grenade counts |
| enh_* | INTEGER | Enhancement counts |
| mob_* | INTEGER | Mobility item counts |
| short_* | INTEGER | Short-term item counts |
| bonus_* | BOOLEAN | Bonus items (STOMP, Strike) |


---

- Safari may have CSP-related console warnings (non-breaking)

---

## ⚠️ Disclaimer

This is an **unofficial fan-made project** and is **NOT affiliated with, endorsed by, or connected to EXBO or the official STALCRAFT game**.

This tool is created by fans, for fans, to help manage clan activities.

---

## 🙏 Acknowledgments

- STALCRAFT game by EXBO
- Node.js and Express.js communities
- All Team DCG members

---

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/YOUR-USERNAME/team-dcg-tracker/issues) page
2. Open a new issue if yours isn't already listed
3. Contact on Discord: [veendel]

---


**⚡ Good hunting, Stalkers! ⚡**

