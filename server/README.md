# Baaloo - Admin Backend API

This is the backend server for the Baaloo Admin Dashboard. It is a Node.js and Express application that provides a RESTful API for administrator authentication, management, and data retrieval.

---

## Table of Contents

1.  [About The Project](#about-the-project)
2.  [Built With](#built-with)
3.  [Getting Started](#getting-started)
    -   [Prerequisites](#prerequisites)
    -   [Installation](#installation)
4.  [Available Scripts](#available-scripts)
5.  [API Endpoints](#api-endpoints)
6.  [Environment Variables](#environment-variables)

---

## About The Project

This server handles all the core logic for the Baaloo admin panel. It manages user authentication via JWTs stored in `httpOnly` cookies, provides endpoints for managing administrator accounts, and serves statistical data for the dashboard. It connects to a MongoDB database to persist all application data.

## Built With

*   **Node.js**: A JavaScript runtime environment.
*   **Express**: A web application framework for Node.js.
*   **MongoDB**: A NoSQL document-oriented database.
*   **Mongoose**: An Object Data Modeling (ODM) library for MongoDB and Node.js.
*   **JSON Web Tokens (JWT)**: For creating secure access tokens.
*   **Bcrypt.js**: For hashing passwords.
*   **Cookie-parser**: For handling cookies.

## Getting Started

To get a local copy of the backend up and running, follow these steps.

### Prerequisites

*   **Node.js**: Version 18.x or later is recommended.
*   **npm** or **yarn**.
*   **MongoDB**: A local instance or a cloud-hosted service like MongoDB Atlas.

### Installation

1.  **Navigate to the server directory:**
    From the project root, run:
    ```bash
    cd server
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create an environment file:**
    Create a `.env` file in the `/server` directory. See the Environment Variables section for the required values.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The server will start on the port specified in your `.env` file (e.g., `http://localhost:5000`).

## Available Scripts

*   `npm run dev`: Starts the development server using `nodemon` for hot-reloading.

## API Endpoints

All endpoints are prefixed with `/api`.

| Method   | Endpoint                        | Description                               |
| :------- | :------------------------------ | :---------------------------------------- |
| `POST`   | `/auth/register`                | Registers a new administrator.            |
| `POST`   | `/auth/login`                   | Logs in an administrator and sets a cookie. |
| `POST`   | `/auth/logout`                  | Logs out the current administrator.       |
| `GET`    | `/auth/check-auth`              | Checks if a user is authenticated via cookie. |
| `GET`    | `/auth/stats`                   | Retrieves dashboard statistics.           |
| `GET`    | `/auth/admins`                  | Gets a list of all administrators.        |
| `PATCH`  | `/auth/admins/:id`              | Updates a specific administrator's details. |
| `PATCH`  | `/auth/admins/:id/password`     | Resets a specific administrator's password. |
| `DELETE` | `/auth/admins/:id`              | Deletes a specific administrator.         |

## Environment Variables

The following environment variables are required for the server to run. Create a `.env` file in the `/server` directory to configure them.

*   `PORT`: The port for the backend server (e.g., `5000`).
*   `MONGO_URI`: Your MongoDB connection string.
*   `JWT_SECRET`: A secret key for signing JSON Web Tokens.
*   `NODE_ENV`: The application environment (e.g., `development` or `production`).

---