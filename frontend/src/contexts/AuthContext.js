import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      // Configure custom parameters for the Google provider
      provider.setCustomParameters({
        prompt: 'select_account',
        // Add additional OAuth 2.0 scopes if needed
        // scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
      });

      const result = await signInWithPopup(auth, provider);
      
      // Create or update user document
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Create new user document
        await setDoc(userRef, {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          major: '',
          createdAt: serverTimestamp()
        });
      }
      
      return result.user;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      // Handle specific Firebase auth errors
      switch (error.code) {
        case 'auth/popup-blocked':
          setError('Please enable popups for this website to sign in with Google.');
          break;
        case 'auth/popup-closed-by-user':
          setError('Sign-in was cancelled. Please try again.');
          break;
        case 'auth/cancelled-popup-request':
          // This is a normal case when multiple popups are triggered quickly
          break;
        default:
          setError(error.message || 'Failed to sign in with Google');
      }
      throw error;
    }
  }

  async function updateMajor(major) {
    try {
      if (!user) throw new Error("No authenticated user");
      
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        major,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setUser(prevUser => ({
        ...prevUser,
        major
      }));
      
      return true;
    } catch (error) {
      console.error("Error updating major:", error);
      setError(error.message);
      throw error;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
      setError(error.message);
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get additional user data from Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUser({
              ...firebaseUser,
              major: userData.major,
              createdAt: userData.createdAt
            });
          } else {
            setUser(firebaseUser);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    signInWithGoogle,
    logout,
    updateMajor,
    error,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}