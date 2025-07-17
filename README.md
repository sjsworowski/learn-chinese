# 🎓 Chinese Vocabulary Learning App

A modern web application for learning Chinese vocabulary with interactive flashcards, progress tracking, and beautiful mobile-friendly UI.

## ✨ Features

- **Interactive Flashcards**: Learn Chinese characters with pinyin pronunciation and relevant images
- **Progress Tracking**: Mark words as learned and track your study sessions
- **Mobile Optimized**: Works perfectly on mobile browsers
- **Beautiful UI**: Modern design with Tailwind CSS and Chinese font support
- **User Authentication**: Secure login system with JWT tokens
- **Real-time Statistics**: Track your learning progress and study time

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Seed the database:**
   ```bash
   npm run seed
   ```

3. **Start the development servers:**
   ```bash
   npm run dev
   ```

### Demo Credentials
- **Email**: `test@example.com`
- **Password**: `password123`

## 🛠️ Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run start` | Start both frontend and backend (alternative) |
| `npm run dev:frontend` | Start only the React frontend |
| `npm run dev:backend` | Start only the NestJS backend |
| `npm run build` | Build both frontend and backend for production |
| `npm run seed` | Seed the database with demo data |
| `npm run clean` | Clean build directories |
| `npm run install:all` | Install dependencies for all packages |

### VS Code / Cursor Integration

This project includes VS Code/Cursor configurations for easy development:

#### 🎯 Launch Configurations
- **Launch Backend**: Debug the NestJS backend
- **Launch Frontend**: Debug the React frontend in Chrome
- **Launch Full Stack**: Debug both frontend and backend together
- **Full Stack Debug**: Compound configuration for debugging both simultaneously

#### 📋 Tasks
- **start-backend**: Start the NestJS development server
- **start-frontend**: Start the React development server
- **start-full-stack**: Start both servers in parallel
- **install-all**: Install all dependencies

#### 🔧 How to Use VS Code/Cursor Buttons

1. **Open Command Palette** (`Ctrl+Shift+P`)
2. **Run Task** → Select one of the available tasks
3. **Start Debugging** (`F5`) → Choose a launch configuration

#### 🎮 Quick Actions
- Press `Ctrl+Shift+P` → "Tasks: Run Task" → "start-full-stack"
- Press `F5` → Select "Launch Full Stack" for debugging

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: React Context API
- **HTTP Client**: Axios
- **UI Components**: Lucide React icons

### Backend (NestJS + TypeScript)
- **Framework**: NestJS
- **Database**: SQLite with TypeORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator
- **API Documentation**: Built-in Swagger support

### Database Schema
- **User**: Authentication and user management
- **Vocabulary**: Chinese words with translations and images
- **UserProgress**: Track learning progress per user

## 📱 Mobile Support

The app is fully responsive and optimized for mobile browsers:
- Touch-friendly interface
- Swipe gestures for flashcards
- Mobile-optimized navigation
- Progressive Web App features

## 🎨 UI/UX Features

- **Chinese Font Support**: Noto Sans SC for proper character display
- **Color Scheme**: Warm orange theme with accessibility in mind
- **Loading States**: Smooth transitions and loading indicators
- **Toast Notifications**: User feedback for actions
- **Progress Indicators**: Visual progress tracking

## 🔒 Security

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **CORS Configuration**: Proper cross-origin settings
- **Input Validation**: Server-side validation with class-validator

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user profile

### Vocabulary
- `GET /api/vocabulary` - Get all vocabulary words
- `POST /api/vocabulary/:id/learn` - Mark word as learned

### Statistics
- `GET /api/stats` - Get user learning statistics

## 🚀 Deployment

### Frontend Deployment
```bash
npm run build:frontend
# Deploy the frontend/dist folder to your hosting service
```

### Backend Deployment
```bash
npm run build:backend
# Deploy the backend/dist folder to your server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues:
1. Check the console for error messages
2. Ensure all dependencies are installed
3. Verify the database is seeded properly
4. Check that both servers are running on the correct ports

---

**Happy Learning! 学习愉快! 🎓** 