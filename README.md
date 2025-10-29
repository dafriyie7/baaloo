<div align="center">
  <!-- You can add a logo here if you have one -->
  <!-- <img src="path/to/your/logo.png" alt="Baaloo Logo" width="100" /> -->
  <h1 align="center">Baaloo - Admin Dashboard & Management System</h1>
  <p align="center">
    A full-stack web application featuring a comprehensive admin dashboard for managing a scratch card gaming platform.
    <br />
    <a href="#-features"><strong>Explore the features »</strong></a>
    <br />
    <br />
    <a href="https://your-live-demo-url.com">View Demo</a>
    ·
    <a href="https://github.com/dafriyie7/baaloo/issues">Report Bug</a>
    ·
    <a href="https://github.com/dafriyie7/baaloo/issues">Request Feature</a>
  </p>
</div>

---

## Table of Contents

1.  [About The Project](#-about-the-project)
2.  [Built With](#-built-with)
3.  [Features](#-features)
4.  [Getting Started](#-getting-started)
5.  [Project Structure](#-project-structure)
6.  [API Endpoints](#-api-endpoints)
7.  [Available Scripts](#-available-scripts)
8.  [Contributing](#-contributing)
9.  [License](#-license)

---

## About The Project

**Baaloo** is a full-stack web application designed to provide an administrative interface for managing a scratch card gaming platform. It empowers administrators with robust tools for secure authentication, comprehensive user management, and insightful overview of key application statistics.

The application is structured as a monorepo, separating the frontend client (built with React and Vite) and the backend server (powered by Node.js and Express). Data persistence is handled by MongoDB.

## Built With

This project leverages a modern MERN-like stack for both its client and server components.

### Frontend

<p>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white" alt="React Router" />
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios" />
</p>

*   **Framework**: [React](https://react.dev/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Routing**: [React Router](https://reactrouter.com/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **HTTP Client**: [Axios](https://axios-http.com/)
*   **State Management**: React Context API
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Notifications**: [React Hot Toast](https://react-hot-toast.com/)

### Backend

<p>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
</p>

*   **Runtime**: Node.js
*   **Framework**: Express
*   **Database**: MongoDB with Mongoose ODM
*   **Authentication**: JWT (JSON Web Tokens)
*   **Password Hashing**: Bcrypt.js
*   **Middleware**: Cookie-parser

## Features

*   **Secure Admin Authentication**: JWT-based login system with `httpOnly` cookies for secure session management.
*   **Responsive Admin Dashboard**: A central hub to monitor application activity with at-a-glance statistic cards (Total Players, Codes, Batches, Admins).
*   **Administrator Management**:
    *   View, invite, edit details (name, email, phone), and reset passwords for other administrators.
    *   Securely remove administrators, with a safeguard against self-deletion.
*   **Modern UI/UX**:
    *   Clean, responsive layout that adapts to various screen sizes.
    *   Interactive modals for editing and management, supporting "click outside" and "Escape key" to close.
    *   User feedback through toast notifications for all actions.
*   **Client-Side Routing**: Smooth, fast navigation without page reloads, powered by React Router.
*   **Global State Management**: Centralized application state (authentication status, user data) using React Context.
*   **Dynamic Layout Adjustment**: Frontend content dynamically adjusts its padding to respect the navbar's height.

## Getting Started

To get a local copy of the project up and running for development and testing, follow these steps.

### Prerequisites

*   **Node.js**: Version 18.x or later is recommended.
*   **Package Manager**: `npm` or `yarn`.
*   **MongoDB**: A local instance or a cloud-hosted service like MongoDB Atlas.

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/dafriyie7/baaloo.git
    cd baaloo
    ```

2.  **Setup the Backend (`/server`):**
    *   Navigate to the server directory: `cd server`
    *   Install dependencies: `npm install`
    *   Create a `.env` file in the `/server` directory and add the following variables:
        ```env
        # The port for the backend server
        PORT=5000
        # Your MongoDB connection string
        MONGO_URI=<your_mongodb_connection_string>
        # A secret key for signing JWTs
        JWT_SECRET=<your_jwt_secret_key>
        # Set to 'production' or 'development'
        NODE_ENV=development
        ```

3.  **Setup the Frontend (`/client`):**
    *   Open a new terminal and navigate to the client directory: `cd client`
    *   Install dependencies: `npm install`
    *   Create a `.env` file in the `/client` directory and add the backend API URL:
        ```env
        # URL of the running backend server
        VITE_BACKEND_API=http://localhost:5000
        ```

4.  **Run the application**:
    *   Start the backend server from the `/server` directory: `npm run dev`
    *   Start the frontend development server from the `/client` directory: `npm run dev`
    *   The application will be available at `http://localhost:5173`.

## Project Structure

```
baaloo/
├── client/         # React Frontend application
│   ├── public/
│   ├── src/
│   │   ├── Components/   # Reusable UI components
│   │   ├── Pages/        # Top-level page components (Login, Manage)
│   │   ├── context/      # Global state management (AppContext.jsx)
│   │   ├── lib/          # Utility libraries (api.js for Axios instance)
│   │   ├── App.jsx       # Main application component with routing
│   │   └── main.jsx      # Application entry point
│   ├── .env              # Frontend environment variables
│   ├── package.json
│   └── vite.config.js
└── server/         # Node.js/Express Backend API
    ├── controllers/  # Business logic for routes
    ├── models/       # Mongoose schemas for MongoDB
    ├── routes/       # API route definitions
    ├── middleware/   # Custom Express middleware
    ├── .env          # Backend environment variables
    ├── package.json
    └── server.js     # Main server entry point
```

## API Endpoints

All backend API endpoints are prefixed with `/api`.

| Method   | Endpoint                        | Description                                 |
| :------- | :------------------------------ | :------------------------------------------ |
| `POST`   | `/auth/register`                | Registers a new administrator.              |
| `POST`   | `/auth/login`                   | Logs in an administrator and sets a cookie.   |
| `POST`   | `/auth/logout`                  | Logs out the current administrator.         |
| `GET`    | `/auth/check-auth`              | Checks if a user is authenticated via cookie. |
| `GET`    | `/auth/stats`                   | Retrieves dashboard statistics.             |
| `GET`    | `/auth/admins`                  | Gets a list of all administrators.          |
| `PATCH`  | `/auth/admins/:id`              | Updates a specific administrator's details.   |
| `PATCH`  | `/auth/admins/:id/password`     | Resets a specific administrator's password.   |
| `DELETE` | `/auth/admins/:id`              | Deletes a specific administrator.           |

## Available Scripts

In both the `client` and `server` directories, you can run the following script:

*   `npm run dev`: Starts the development server with hot-reloading.

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">This README was generated with the assistance of Gemini Code Assist.</p>