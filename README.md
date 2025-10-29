# Baaloo – Admin Dashboard & Management System

A full-stack web application featuring a comprehensive admin dashboard for managing a scratch card gaming platform.

**[Explore the features »](#-features)**  
**[View Demo](https://your-live-demo-url.com)** · **[Report Bug](https://github.com/dafriyie7/baaloo/issues)** · **[Request Feature](https://github.com/dafriyie7/baaloo/issues)**

---

## Table of Contents

1. [About The Project](#-about-the-project)
2. [Built With](#-built-with)
3. [Features](#-features)
4. [Getting Started](#-getting-started)
5. [Project Structure](#-project-structure)
6. [API Endpoints](#-api-endpoints)
7. [Available Scripts](#-available-scripts)
8. [Contributing](#-contributing)
9. [License](#-license)

---

## About The Project

**Baaloo** is a full-stack web application designed to provide an administrative interface for managing a scratch card gaming platform.  
It empowers administrators with robust tools for secure authentication, comprehensive user management, and insightful overview of key application statistics.

The application is structured as a monorepo, separating the frontend client (built with React and Vite) and the backend server (powered by Node.js and Express).  
Data persistence is handled by MongoDB.

---

## Built With

This project leverages a modern MERN-like stack for both its client and server components.

### Frontend

**Technologies:**

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
- [Axios](https://axios-http.com/)
- React Context API (State Management)
- [Lucide React](https://lucide.dev/) (Icons)
- [React Hot Toast](https://react-hot-toast.com/) (Notifications)

### Backend

**Technologies:**

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [JWT](https://jwt.io/) (Authentication)
- [Bcrypt.js](https://www.npmjs.com/package/bcryptjs)
- [Cookie-parser](https://www.npmjs.com/package/cookie-parser)

---

## Features

- **Secure Admin Authentication:** JWT-based login with `httpOnly` cookies.  
- **Responsive Dashboard:** Monitor key stats — total players, codes, batches, and admins.  
- **Admin Management:** View, invite, edit, reset passwords, and delete admins safely.  
- **Modern UI/UX:** Responsive layout, modal support, and toast notifications.  
- **Client-Side Routing:** Fast, smooth navigation via React Router.  
- **Global State Management:** Centralized authentication and user data via Context API.  
- **Dynamic Layout Adjustment:** Auto-adjusts frontend padding to navbar height.

---

## Getting Started

Follow these steps to run the project locally.

### Prerequisites

- **Node.js:** Version 18.x or later  
- **Package Manager:** `npm` or `yarn`  
- **MongoDB:** Local or hosted (e.g., MongoDB Atlas)

### Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/dafriyie7/baaloo.git
   cd baaloo
   ```

2. **Setup the Backend**

   ```bash
   cd server
   npm install
   ```

   Create `.env` inside `/server`:

   ```env
   PORT=5000
   MONGO_URI=<your_mongodb_connection_string>
   JWT_SECRET=<your_jwt_secret_key>
   NODE_ENV=development
   ```

3. **Setup the Frontend**

   ```bash
   cd ../client
   npm install
   ```

   Create `.env` inside `/client`:

   ```env
   VITE_BACKEND_API=http://localhost:5000
   ```

4. **Run the Application**

   ```bash
   # Backend
   cd ../server
   npm run dev

   # Frontend
   cd ../client
   npm run dev
   ```

   Access the app at: [http://localhost:5173](http://localhost:5173)

---

## Project Structure

```
baaloo/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── Components/
│   │   ├── Pages/
│   │   ├── context/
│   │   ├── lib/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   ├── package.json
│   └── vite.config.js
└── server/
    ├── controllers/
    ├── models/
    ├── routes/
    ├── middleware/
    ├── .env
    ├── package.json
    └── server.js
```

---

## Available Scripts

In both the `client` and `server` directories:

```bash
npm run dev
```

Starts the development server with hot reloading.

---

## Contributing

1. Fork the project  
2. Create a feature branch  

   ```bash
   git checkout -b feature/AmazingFeature
   ```

3. Commit your changes  

   ```bash
   git commit -m "Add some AmazingFeature"
   ```

4. Push to your branch  

   ```bash
   git push origin feature/AmazingFeature
   ```

5. Open a Pull Request

---
