
---

# 🎬 The Movie Database - Full Stack Project

A comprehensive full-stack web application for movie enthusiasts to browse, search, and explore a vast collection of movies and actors. This project leverages modern front-end and back-end technologies to provide a dynamic and user-friendly experience.

![Project Screenshot](PFS%20(1).png)

## 📋 Table of Contents
1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Project Structure](#project-structure)
6. [Contributing](#contributing)
7. [License](#license)

## ✨ Features
- **User Registration & Authentication**: Register, log in, and log out as a user for a personalized experience, including creating watchlists and saving favorite movies.
    - ![Sign-Up Screenshot](PFS%20(2).png)
    - ![Login Screenshot](PFS%20(3).png)
- **Search with Autocomplete**: Quickly search for movies by title with an autocomplete feature to make finding movies easier and faster.
    - ![Autocomplete Feature](PFS%20(4).png)
- **"Know More" for Detailed Information**: View additional information about each movie, including cast, crew, genres, and ratings, by clicking the "Know More" button.
- **Pagination for Easy Browsing**: Easily navigate through multiple pages of movies using forward and backward buttons.
- **Movie Overview on Hover**: Get a quick summary of the movie's plot by simply hovering over the movie poster, enhancing the browsing experience.
- **Responsive Design**: Optimized for both desktop and mobile views.
- **Modern UI**: Clean and intuitive interface to improve user interaction.

## 🛠 Tech Stack
- **Frontend**: React, CSS, HTML
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JSON Web Tokens (JWT)
- **API**: External API integration (such as The Movie Database API)

## 🚀 Installation

To run the project locally, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/RoiAzrai/The-Movie-Data-Base-Full-Stack-Project.git
   cd The-Movie-Data-Base-Full-Stack-Project
   ```

2. **Install server dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Install client dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**:

   In the `backend` folder, create a `.env` file and add the following:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   API_KEY=your_external_api_key
   ```

5. **Run the application**:

   - Start the backend server:
     ```bash
     cd backend
     npm start
     ```

   - Start the frontend server:
     ```bash
     cd ../frontend
     npm start
     ```

6. **Access the app**: Open your browser and go to `http://localhost:3000`.

## 📂 Project Structure
Here's a quick overview of the project structure:
- **/frontend**: Contains all client-side files, including components, hooks, and styling.
- **/backend**: Contains server-side files such as routes, models, and middleware for handling API requests and database interactions.
- **/config**: Configuration files for database and JWT.
- **/models**: Database models for movies, users, etc.
- **/routes**: API endpoints and routes.

## 🤝 Contributing
Contributions are welcome! Feel free to submit issues, fork the repository, and create pull requests to suggest improvements.

## 📜 License
This project is licensed under the MIT License.

---

