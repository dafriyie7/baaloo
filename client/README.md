<div align="center">
  <h1 align="center">Baaloo - Admin Dashboard Frontend</h1>
  <p align="center">
    The React-based client for the Baaloo Admin Management System.
    <br />
    <a href="#-features"><strong>Explore the features »</strong></a>
    <br />
    <br />
    <a href="https://github.com/dafriyie7/baaloo/issues">Report Bug</a>
    ·
    <a href="https://github.com/dafriyie7/baaloo/issues">Request Feature</a>
  </p>
</div>

---

## 📋 Table of Contents

1. [About The Project](#-about-the-project)
2. [Built With](#-built-with)
3. [Features](#-features)
4. [Getting Started](#-getting-started)
5. [Project Structure](#-project-structure)
6. [Available Scripts](#-available-scripts)
7. [Contributing](#-contributing)
8. [License](#-license)

---

## About The Project

This is the frontend for the Baaloo Admin Dashboard. It provides a secure and responsive interface for administrators to log in, view application statistics, and manage other administrator accounts. It communicates with the backend server to fetch data and perform actions.

## Built With

<p>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white" alt="React Router" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios" />
</p>

* **Framework**: [React](https://react.dev/)
* **Build Tool**: [Vite](https://vitejs.dev/)
* **Routing**: [React Router](https://reactrouter.com/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **HTTP Client**: [Axios](https://axios-http.com/)
* **State Management**: React Context API
* **Icons**: [Lucide React](https://lucide.dev/)
* **Notifications**: [React Hot Toast](https://react-hot-toast.com/)

## Features

* **Secure Admin Authentication**: JWT-based login system with session persistence.
* **Responsive Dashboard**: A central hub to monitor application activity with at-a-glance statistic cards.
* **Administrator Management**:
	-	View a list of all administrators.
    -   Invite new administrators with default credentials.
    -   Edit administrator details (name, email, phone).
    -   Reset passwords for other administrators.
    -   Securely remove administrators, with a safeguard against self-deletion.
* **Modern UI/UX**:
    -   Clean, responsive layout that adapts to screen size.
    -   Interactive modals for editing and management with "click outside" and "Escape key" to close.
    -   User feedback through toast notifications for all actions.
* **Dynamic Layout**: The main content area automatically adjusts to the navbar's height.
* **Global State**: A centralized `AppContext` provides user data and authentication status to the entire application.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

* Node.js (v18.x or later recommended)
* npm or yarn
* A running instance of the backend server.

### Installation & Setup

1. **Navigate to the client directory:**
    From the project root, run:
    ```bash
    cd client
    ```

2. **Install dependencies:**
    ```bash
    npm install
    ```

3. **Create an environment file:**
    Create a `.env` file in the `/client` directory and add the URL of your running backend server:
    ```env
    # URL of the running backend server
    VITE_BACKEND_API=http://localhost:5000
    ```

4. **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## Project Structure

```
src/
├── Components/   # Reusable components (Navbar, Modals, Cards)
├── Pages/        # Top-level page components (Login, Manage)
├── context/      # Global state management (AppContext.jsx)
├── lib/          # Utility libraries (api.js for Axios instance)
├── App.jsx       # Main application component with routing setup
└── main.jsx      # Application entry point
```

## Available Scripts

* `npm run dev`: Starts the Vite development server with hot-reloading.
* `npm run build`: Bundles the application for production.
* `npm run lint`: Runs the ESLint linter to check for code quality.
* `npm run preview`: Serves the production build locally for previewing.

---

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` in the project root for more information.

---

<p align="center">This README was generated with the assistance of Gemini Code Assist.</p>