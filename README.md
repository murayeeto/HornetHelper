# Hornet Helper

A full-stack web application with a React frontend, Flask backend, and Firebase authentication. The application features a responsive design with categories including Calendar and AI Solutions. The color scheme is blue, red, and white, and it uses HashRouter for page navigation.

## Project Structure

```
hornet-helper/
├── backend/             # Flask backend
│   ├── app.py           # Main Flask application
│   ├── firebase_service.py # Firebase Admin SDK service
│   ├── requirements.txt # Python dependencies
│   └── .gitignore      # Git ignore file for backend
│
├── firebase/           # Firebase configuration
│   ├── firestore.rules  # Firestore security rules
│   └── service-account.example.json # Template for Firebase admin credentials
│
└── frontend/           # React frontend
    ├── public/         # Public assets
    ├── src/            # Source code
    │   ├── components/ # React components
    │   ├── contexts/   # React contexts
    │   ├── pages/      # Page components
    │   ├── App.js      # Main App component
    │   ├── App.css     # App styles
    │   ├── firebase.js # Firebase client configuration
    │   ├── index.js    # Entry point
    │   └── index.css   # Global styles
    ├── .env.example    # Template for environment variables
    ├── package.json    # NPM dependencies
    └── .gitignore      # Git ignore file for frontend
```

## Getting Started

### Prerequisites

- Node.js and npm (for the frontend)
- Python 3.6+ (for the backend)
- Git
- Firebase account

### Firebase Setup

1. Create a new Firebase project:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the setup wizard
   - Enable Google Authentication in the Authentication section
   - Create a Firestore database

2. Get Firebase configuration:
   - In Project Settings > General, scroll to "Your apps"
   - Click the web icon (</>)
   - Register your app and copy the Firebase configuration

3. Set up Firebase Admin SDK:
   - In Project Settings > Service accounts
   - Click "Generate new private key"
   - Save the JSON file as `firebase/hornethelper-[your-project-id]-firebase-adminsdk.json`

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/hornet-helper.git
   cd hornet-helper
   ```

2. Set up environment variables:
   ```
   # In frontend directory
   cp .env.example .env
   ```
   Update .env with your Firebase configuration:
   ```
   REACT_APP_API_URL=http://localhost:8000
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
   PORT=4000
   ```

3. Set up the backend:
   ```
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. Set up the frontend:
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
   The backend will run on http://localhost:8000

2. In a new terminal, start the frontend development server:
   ```
   cd frontend
   npm start
   ```
   The frontend will run on http://localhost:4000

## Features

- User authentication with Google Sign-In
- Protected routes requiring authentication
- User profiles with major field
- Calendar functionality
- AI solutions category
- Responsive design that works on desktop and mobile
- Navigation with HashRouter
- Flask backend with API endpoints
- React frontend with Axios for API calls

## Technologies Used

- Frontend:
  - React
  - React Router (HashRouter)
  - Firebase Authentication
  - Axios
  - CSS

- Backend:
  - Flask
  - Flask-CORS
  - Firebase Admin SDK
  - Firestore

## Accessing from Other Devices

1. Update the frontend API URL:
   - If running on your local network, update REACT_APP_API_URL in .env to use your computer's local IP:
     ```
     REACT_APP_API_URL=http://your_local_ip:8000
     ```
   - If deployed, update to your backend server's URL

2. Update backend CORS settings:
   - The backend is configured to accept requests from http://localhost:4000
   - Add additional origins in app.py if needed:
     ```python
     CORS(app, resources={
         r"/api/*": {
             "origins": ["http://localhost:4000", "http://your_local_ip:4000"]
         }
     })
     ```

3. Firewall and Network Settings:
   - Ensure ports 8000 (backend) and 4000 (frontend) are accessible
   - Configure your firewall to allow incoming connections on these ports
   - For development, make sure devices are on the same network

## License

This project is licensed under the MIT License.