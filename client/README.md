<div align="center">
  <h1 align="center">Baaloo - Admin Dashboard Frontend</h1>
  <p align="center">
    The client-side application for the Baaloo Admin Management System, built with React and Vite.
  </p>
</div>

---

## 📋 Table of Contents

1.  [About The Project](#-about-the-project)
2.  [Built With](#-built-with)
3.  [Features](#-features)
4.  [Getting Started](#-getting-started)
5.  [Project Structure](#-project-structure)
6.  [Available Scripts](#-available-scripts)

---

## 📖 About The Project

This is the frontend for the Baaloo Admin Dashboard. It provides a secure and responsive interface for administrators to log in, view application statistics, and manage other administrator accounts. It communicates with the backend server to fetch data and perform actions.

## 🛠️ Built With

This project is built with a modern frontend stack:

<p>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white" alt="React Router" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios" />
</p>

*   **React**: For building the user interface.
*   **Vite**: As the fast, next-generation build tool.
*   **React Router**: For all client-side routing and navigation.
*   **Tailwind CSS**: For utility-first styling.
*   **Axios**: For making HTTP requests to the backend API.
*   **React Context API**: For global state management (auth status, user data).
*   **Lucide React**: For icons.
*   **React Hot Toast**: For user-friendly notifications.

## ✨ Features

*   **Secure Admin Login**: Authenticates administrators and maintains session state.
*   **Responsive Dashboard (`/admin`)**:
    *   Displays key statistics (Total Players, Codes, Admins, etc.).
    *   Provides a form to invite/add new administrators.
    *   Lists all current administrators with an option to manage them.
*   **Administrator Management Modal**:
    *   Update an admin's profile details (name, email, phone).
    *   Reset an admin's password.
    *   Remove an admin from the system (with a confirmation prompt).
*   **Dynamic Layout**: The main content area automatically adjusts its padding to respect the height of the dynamic navigation bar.
*   **Global State**: `AppContext` provides user, authentication status, and loading state to the entire application.

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   **Node.js**: Version 18.x or later.
*   **npm** or **yarn**.
*   A running instance of the backend server.

### Installation & Setup

1.  **Navigate to the client directory:**
    From the project root, run:
    ```bash
    cd client
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create an environment file:**
    Create a `.env` file in the `/client` directory and add the URL of your running backend server:
    ```env
    # URL of the running backend server
    VITE_BACKEND_API=http://localhost:5000
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## 📁 Project Structure

```
src/
├── Components/   # Reusable components (Navbar, Modals, Cards)
├── Pages/        # Top-level page components (Login, Manage)
├── context/      # Global state management (AppContext.jsx)
├── lib/          # Utility libraries (api.js for Axios instance)
├── App.jsx       # Main application component with routing setup
└── main.jsx      # Application entry point
```

## 📜 Available Scripts

*   `npm run dev`: Starts the Vite development server with hot-reloading.
*   `npm run build`: Bundles the application for production.
*   `npm run lint`: Runs the ESLint linter to check for code quality.
*   `npm run preview`: Serves the production build locally for previewing.

---

This README was generated with the assistance of Gemini Code Assist.