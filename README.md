# Hornet Helper

A full-stack web application with a React frontend and Flask backend. The application features a responsive design with a navbar containing 5 categories and a home page. The color scheme is blue, red, and white, and it uses HashRouter for page navigation.

## Project Structure

```
hornet-helper/
├── backend/             # Flask backend
│   ├── app.py           # Main Flask application
│   ├── requirements.txt # Python dependencies
│   └── .gitignore       # Git ignore file for backend
│
└── frontend/            # React frontend
    ├── public/          # Public assets
    ├── src/             # Source code
    │   ├── components/  # React components
    │   ├── pages/       # Page components
    │   ├── App.js       # Main App component
    │   ├── App.css      # App styles
    │   ├── index.js     # Entry point
    │   └── index.css    # Global styles
    ├── package.json     # NPM dependencies
    └── .gitignore       # Git ignore file for frontend
```

## Getting Started

### Prerequisites

- Node.js and npm (for the frontend)
- Python 3.6+ (for the backend)
- Git

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/hornet-helper.git
   cd hornet-helper
   ```

2. Set up the backend:
   ```
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set up the frontend:
   ```
   cd ../frontend
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   python app.py
   ```
   The backend will run on http://localhost:5000

2. In a new terminal, start the frontend development server:
   ```
   cd frontend
   npm start
   ```
   The frontend will run on http://localhost:3001

## Deploying to GitHub Pages

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in to your account.
2. Click on the "+" icon in the top right corner and select "New repository".
3. Name your repository (e.g., "hornet-helper").
4. Choose whether to make it public or private.
5. Click "Create repository".

### Step 2: Push Your Code to GitHub

1. Initialize Git in your project folder (if not already done):
   ```
   cd hornet-helper
   git init
   ```

2. Add your files to Git:
   ```
   git add .
   ```

3. Commit your changes:
   ```
   git commit -m "Initial commit"
   ```

4. Link your local repository to the GitHub repository:
   ```
   git remote add origin https://github.com/yourusername/hornet-helper.git
   ```

5. Push your code to GitHub:
   ```
   git push -u origin main
   ```
   (Note: If your default branch is "master" instead of "main", use "master" instead)

### Step 3: Configure for GitHub Pages

1. Make sure your package.json has the following:
   - The "homepage" field is set to "." (as it already is in this project)
   - The "predeploy" and "deploy" scripts are included (already included in this project)

2. Install gh-pages package (already included in the dependencies):
   ```
   cd frontend
   npm install gh-pages --save-dev
   ```

### Step 4: Deploy to GitHub Pages

1. Build and deploy your React app:
   ```
   cd frontend
   npm run deploy
   ```

2. Go to your GitHub repository settings:
   - Navigate to your repository on GitHub
   - Click on "Settings"
   - Scroll down to the "GitHub Pages" section
   - In the "Source" dropdown, select "gh-pages branch"
   - Click "Save"

3. Your site will be published at: https://yourusername.github.io/hornet-helper

### Step 5: Backend Deployment (Optional)

For a full-stack application, you'll need to deploy the backend separately. Some options include:

- Heroku
- AWS
- Google Cloud Platform
- DigitalOcean

After deploying the backend, update the API endpoint URLs in your frontend code to point to your deployed backend instead of localhost.

## Features

- Responsive design that works on desktop and mobile
- Navigation with HashRouter
- 5 category pages plus a home page
- AI category with custom styling
- Blue, red, and white color scheme
- Flask backend with API endpoints
- React frontend with Axios for API calls

## Technologies Used

- Frontend:
  - React
  - React Router (HashRouter)
  - Axios
  - CSS (no Tailwind)

- Backend:
  - Flask
  - Flask-CORS

## License

This project is licensed under the MIT License.