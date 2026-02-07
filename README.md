# 🚗 DriveNow | Premium Car Rental Experience

DriveNow is a modern, full-stack car rental platform designed with a focus on **Visual Excellence**, **User-Centric Design**, and **System Resiliency**. It provides a seamless experience for users to find and book their perfect ride, whether for a quick trip or a long journey.

---

## ✨ Key Technical Highlights

### 🎨 Human-Centered Design System
Moving away from generic "techy" blue themes, DriveNow features a custom-engineered **"Earthy & Human" Design System**.
- **Warm Color Palette**: Utilizes Terracotta, Sage Green, and Sand tones to create an inviting, organic atmosphere.
- **Micro-Animations**: Purposeful CSS transitions and hover effects that enhance interaction without overwhelming the user.
- **Glassmorphism & Depth**: Modern UI elements with subtle background blurs and soft shadows.
- **Native Dark Mode**: A globally consistent, eye-strain-reducing dark mode using warm cocoa and gold accents.

### 🛡️ Resilient Architecture
Designed to be "Always Online," the application implements a multi-layer fallback system:
- **Graceful DB Fallbacks**: If MongoDB or Redis services are unreachable, the platform automatically switches to a high-speed local data layer to ensure users can still browse cars uninterrupted.
- **Smart Caching**: Implements a Redis-based caching strategy with TTL (Time-To-Live) management and cache-invalidation patterns to ensure high performance.
- **Robust Error Handling**: Centralized global error handling that categorizes and responds to issues gracefully without crashing the user interface.

### 🚗 Advanced Search & Filtering
- Dynamic filtering by Make, Model, Fuel Type, and Transmission.
- Real-time price range sliders with formatted currency outputs.
- Paginated results with server-side processing for performance.

---

## 🛠️ Technology Stack

- **Frontend**: EJS (Templating), Modern Vanilla CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Caching**: Redis (ioredis)
- **Background Tasks**: BullMQ (handling email queues and background jobs)
- **Real-time**: Socket.IO for live inventory updates

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16.x or higher)
- npm or yarn
- MongoDB & Redis (Optional - falls back to local data if unavailable)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rashmika0907/DriveNow.git
   cd DriveNow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory and add your configurations (refer to `.env.example` if available).

4. **Run the application**
   ```bash
   npm run dev
   ```
   *The application will be accessible at [http://localhost:3000](http://localhost:3000)*

---

## 📸 Screenshots

*(Add screenshots of your beautiful new UI here to really make the profile pop!)*

---

## 👨‍💻 Author

**Rashmika Sharma**
- GitHub: [@rashmika0907](https://github.com/rashmika0907)
