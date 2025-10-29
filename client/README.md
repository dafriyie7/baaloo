# Baaloo - Admin Dashboard Frontend

The React-based client for the Baaloo Admin Management System.

[**Explore the features »**](#-features)

[Report Bug](https://github.com/dafriyie7/baaloo/issues) · [Request Feature](https://github.com/dafriyie7/baaloo/issues)

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

## 📖 About The Project

This is the frontend for the Baaloo Admin Dashboard. It provides a secure and responsive interface for administrators to log in, view application statistics, and manage other administrator accounts. It communicates with the backend server to fetch data and perform actions.

## 🛠️ Built With

- **Framework**: [React](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Routing**: [React Router](https://reactrouter.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **State Management**: React Context API
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/)

Badges (rendered automatically on GitHub):

- React  
- Vite  
- React Router  
- Tailwind CSS  
- Axios  

## ✨ Features

- **Secure Admin Authentication**: JWT-based login system with session persistence.  
- **Responsive Dashboard**: A central hub to monitor application activity with statistic cards.  
- **Administrator Management**:  
  - View a list of all administrators.  
  - Invite new administrators with default credentials.  
  - Edit administrator details (name, email, phone).  
  - Reset passwords for other administrators.  
  - Securely remove administrators, with a safeguard against self-deletion.  
- **Modern UI/UX**:  
  - Clean, responsive layout that adapts to screen size.  
  - Interactive modals for editing and management with "click outside" and "Escape key" to close.  
  - User feedback through toast notifications for all actions.  
- **Dynamic Layout**: Main content area automatically adjusts to the navbar height.  
- **Global State**: Centralized `AppContext` provides authentication and user data across the app.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.x or later)  
- npm or yarn  
- A running instance of the backend server

### Installation & Setup

1. **Navigate to the client directory:**

   ```bash
   cd client
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create an environment file:**

   ```bash
   # .env file in /client directory
   VITE_BACKEND_API=http://localhost:5000
   ```

4. **Run the development server:**

   ```bash
   npm run dev
   ```

   Access it at `http://localhost:5173`.

## 📁 Project Structure

```
src/
├── Components/   # Reusable components (Navbar, Modals, Cards)
├── Pages/        # Top-level page components (Login, Manage)
├── context/      # Global state management (AppContext.jsx)
├── lib/          # Utility libraries (api.js for Axios instance)
├── App.jsx       # Main app with routing setup
└── main.jsx      # Entry point
```

## 🧩 Available Scripts

- `npm run dev`: Start the Vite development server.  
- `npm run build`: Bundle for production.  
- `npm run lint`: Run ESLint for code checks.  
- `npm run preview`: Serve production build locally.

---

## 🤝 Contributing

1. Fork the project  
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)  
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)  
4. Push to your branch (`git push origin feature/AmazingFeature`)  
5. Open a Pull Request

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for details.

---
