# Baaloo – Admin Backend API

This is the backend server for the Baaloo Admin Dashboard. It is a Node.js and Express application that provides a RESTful API for administrator authentication, management, and data retrieval.

---

## Table of Contents

1. [About The Project](#about-the-project)
2. [Built With](#built-with)
3. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
4. [Available Scripts](#available-scripts)
5. [API Endpoints](#api-endpoints)
6. [Environment Variables](#environment-variables)

---

## About The Project

This server handles all the core logic for the Baaloo admin panel.  
It manages user authentication via JWTs stored in `httpOnly` cookies, provides endpoints for managing administrator accounts, and serves statistical data for the dashboard.  
It connects to a MongoDB database to persist all application data.

---

## Built With

- **Node.js:** JavaScript runtime environment.  
- **Express:** Web application framework for Node.js.  
- **MongoDB:** NoSQL document-oriented database.  
- **Mongoose:** ODM library for MongoDB and Node.js.  
- **JWT:** For secure token-based authentication.  
- **Bcrypt.js:** For password hashing.  
- **Cookie-parser:** For handling cookies.

---

## Getting Started

To get a local copy of the backend running, follow these steps.

### Prerequisites

- **Node.js:** Version 18.x or later  
- **Package Manager:** `npm` or `yarn`  
- **MongoDB:** Local or hosted instance (e.g., MongoDB Atlas)

### Installation

1. **Navigate to the server directory**  
   From the project root:

   ```bash
   cd server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create an environment file**  
   Create a `.env` file in the `/server` directory.  
   See [Environment Variables](#environment-variables) for the required values.

4. **Run the development server**

   ```bash
   npm run dev
   ```

   The server starts on the port specified in `.env` (e.g., `http://localhost:5000`).

---

## Available Scripts

- `npm run dev`: Starts the development server with hot-reloading via Nodemon.

---

## Environment Variables

Required environment variables for this server:  
Create a `.env` file inside `/server` with the following values:

```env
PORT=5000
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret_key>
NODE_ENV=development
```

---
