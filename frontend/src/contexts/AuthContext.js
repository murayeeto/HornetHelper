import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL
} from 'firebase/storage';
import firebase from '../firebase';

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
      const result = await signInWithPopup(firebase.auth, provider);
      
      // Create or update user document
      const userRef = doc(firebase.db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
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
      setError(error.message);
      throw error;
    }
  }

  async function updateDisplayName(newDisplayName) {
    try {
      if (!user) throw new Error("No authenticated user");
      if (newDisplayName.length > 14) throw new Error("Display name must be 14 characters or less");
      
      await updateProfile(firebase.auth.currentUser, {
        displayName: newDisplayName
      });

      const userRef = doc(firebase.db, 'users', user.uid);
      await setDoc(userRef, {
        displayName: newDisplayName,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setUser(prevUser => ({
        ...prevUser,
        displayName: newDisplayName
      }));

      return true;
    } catch (error) {
      console.error("Error updating display name:", error);
      setError(error.message);
      throw error;
    }
  }

  async function updateProfilePicture(file) {
    try {
      console.log('Starting profile picture update...');
      
      if (!user) {
        throw new Error("No authenticated user");
      }
      
      if (!file) {
        throw new Error("No file provided");
      }

      console.log('File details:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Basic validation
      if (!file.type.startsWith('image/')) {
        throw new Error("Please upload an image file");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }

      // Create storage reference
      console.log('Creating storage reference...');
      const storageRef = ref(firebase.storage, `profile-pictures/${user.uid}`);
      console.log('Storage reference created:', storageRef);

      try {
        // Upload file
        console.log('Starting file upload...');
        const snapshot = await uploadBytes(storageRef, file);
        console.log('File uploaded successfully:', snapshot);

        // Get download URL
        console.log('Getting download URL...');
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log('Got download URL:', downloadURL);

        // Update auth profile
        console.log('Updating auth profile...');
        await updateProfile(firebase.auth.currentUser, {
          photoURL: downloadURL
        });
        console.log('Auth profile updated');

        // Update Firestore
        console.log('Updating Firestore...');
        const userRef = doc(firebase.db, 'users', user.uid);
        await setDoc(userRef, {
          photoURL: downloadURL,
          updatedAt: serverTimestamp()
        }, { merge: true });
        console.log('Firestore updated');

        // Update local state
        setUser(prevUser => ({
          ...prevUser,
          photoURL: downloadURL
        }));

        console.log('Profile picture update completed successfully');
        return true;
      } catch (uploadError) {
        console.error('Error during upload process:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
    } catch (error) {
      console.error('Error in updateProfilePicture:', error);
      setError(error.message);
      throw error;
    }
  }

  async function updateMajor(major) {
    try {
      if (!user) throw new Error("No authenticated user");
      
      const userRef = doc(firebase.db, 'users', user.uid);
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
      await signOut(firebase.auth);
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
      setError(error.message);
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebase.auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get additional user data from Firestore
          const userRef = doc(firebase.db, 'users', firebaseUser.uid);
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
    updateDisplayName,
    updateProfilePicture,
    error,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}