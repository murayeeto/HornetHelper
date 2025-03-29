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
  getDocs,
  collection,
  serverTimestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
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
      provider.addScope('profile');
      provider.addScope('email');
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(firebase.auth, provider)
        .catch(error => {
          if (error.code === 'auth/popup-blocked') {
            alert('Please allow popups for this website to sign in with Google');
          }
          throw error;
        });
      
      const photoURL = result.user.photoURL?.replace('s96-c', 's400-c') || null;
      
      const userRef = doc(firebase.db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: photoURL,
          major: '',
          gender: '',
          isHornet: false,
          createdAt: serverTimestamp()
        });
      } else {
        if (photoURL && userSnap.data().photoURL !== photoURL) {
          await setDoc(userRef, {
            photoURL: photoURL,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
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
      // Update user document
      await setDoc(userRef, {
        displayName: newDisplayName,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update sessions where user is a participant
      const sessionsRef = collection(firebase.db, 'sessions');
      const sessionsSnapshot = await getDocs(sessionsRef);
      
      const updatePromises = sessionsSnapshot.docs.map(async (doc) => {
        const sessionData = doc.data();
        const participants = sessionData.participants || [];
        const userIndex = participants.findIndex(p => p.uid === user.uid);
        
        if (userIndex !== -1) {
          participants[userIndex].displayName = newDisplayName;
          await setDoc(doc.ref, {
            participants,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }

        // Also update if user is the session creator
        if (sessionData.userId === user.uid) {
          await setDoc(doc.ref, {
            displayName: newDisplayName,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      });

      await Promise.all(updatePromises);

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
      if (!user) throw new Error("No authenticated user");
      if (!file) throw new Error("No file provided");

      if (!file.type.startsWith('image/')) {
        throw new Error("Please upload an image file");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }

      // First, try to delete the old profile picture
      const userRef = doc(firebase.db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.photoURL && userData.photoURL.includes('firebasestorage.googleapis.com')) {
          try {
            // Extract the old file path from the URL
            const oldUrl = new URL(userData.photoURL);
            const oldPath = decodeURIComponent(oldUrl.pathname.split('/o/')[1].split('?')[0]);
            const oldRef = ref(firebase.storage, oldPath);
            await deleteObject(oldRef);
            console.log('Old profile picture deleted successfully');
          } catch (deleteError) {
            console.log('Error deleting old profile picture:', deleteError);
            // Continue with upload even if delete fails
          }
        }
      }

      // Upload new image
      const timestamp = Date.now();
      const newImagePath = `images/${user.uid}/profile/${timestamp}_${file.name}`;
      const newRef = ref(firebase.storage, newImagePath);
      
      // Set proper metadata with CORS configuration
      const metadata = {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000',
        customMetadata: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      };

      // Upload the new file
      const uploadTask = await uploadBytes(newRef, file, metadata);
      console.log('New profile picture uploaded successfully');

      // Get the download URL
      const downloadURL = await getDownloadURL(uploadTask.ref);

      // Update Firestore first
      await setDoc(userRef, {
        photoURL: downloadURL,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update sessions where user is a participant or creator
      const sessionsRef = collection(firebase.db, 'sessions');
      const sessionsSnapshot = await getDocs(sessionsRef);
      
      const updatePromises = sessionsSnapshot.docs.map(async (doc) => {
        const sessionData = doc.data();
        const participants = sessionData.participants || [];
        const userIndex = participants.findIndex(p => p.uid === user.uid);
        
        if (userIndex !== -1) {
          participants[userIndex].photoURL = downloadURL;
          await setDoc(doc.ref, {
            participants,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }

        // Also update if user is the session creator
        if (sessionData.userId === user.uid) {
          await setDoc(doc.ref, {
            photoURL: downloadURL,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      });

      await Promise.all(updatePromises);

      // Update auth profile
      await updateProfile(firebase.auth.currentUser, {
        photoURL: downloadURL
      });

      // Force refresh the token to ensure new photoURL is included
      await firebase.auth.currentUser.reload();
      
      // Get fresh user data
      const freshUserSnap = await getDoc(userRef);
      const freshUserData = freshUserSnap.data();

      // Update local state with fresh data
      setUser(prevUser => ({
        ...prevUser,
        ...freshUserData,
        photoURL: downloadURL
      }));

      return downloadURL;
    } catch (error) {
      console.error('Error in updateProfilePicture:', error);
      setError(error.message);
      throw error;
    }
  }

  async function downgradeFromHornet() {
    try {
      if (!user) throw new Error("No authenticated user");
      
      const userRef = doc(firebase.db, 'users', user.uid);
      await setDoc(userRef, {
        isHornet: false,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setUser(prevUser => ({
        ...prevUser,
        isHornet: false
      }));
      
      return true;
    } catch (error) {
      console.error("Error downgrading from Hornet:", error);
      setError(error.message);
      throw error;
    }
  }

  async function upgradeToHornet() {
    try {
      if (!user) throw new Error("No authenticated user");
      
      const userRef = doc(firebase.db, 'users', user.uid);
      await setDoc(userRef, {
        isHornet: true,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setUser(prevUser => ({
        ...prevUser,
        isHornet: true
      }));
      
      return true;
    } catch (error) {
      console.error("Error upgrading to Hornet:", error);
      setError(error.message);
      throw error;
    }
  }

  async function updateMajor(newMajor) {
    try {
      if (!user) throw new Error("No authenticated user");
      
      const userRef = doc(firebase.db, 'users', user.uid);
      await setDoc(userRef, {
        major: newMajor,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setUser(prevUser => ({
        ...prevUser,
        major: newMajor
      }));
      
      return true;
    } catch (error) {
      console.error("Error updating major:", error);
      setError(error.message);
      throw error;
    }
  }

  async function updateGender(newGender) {
    try {
      if (!user) throw new Error("No authenticated user");
      if (!['male', 'female', 'other'].includes(newGender)) {
        throw new Error("Invalid gender value");
      }
      
      const userRef = doc(firebase.db, 'users', user.uid);
      // Update user document
      await setDoc(userRef, {
        gender: newGender,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update sessions where user is a participant or creator
      const sessionsRef = collection(firebase.db, 'sessions');
      const sessionsSnapshot = await getDocs(sessionsRef);
      
      const updatePromises = sessionsSnapshot.docs.map(async (doc) => {
        const sessionData = doc.data();
        const participants = sessionData.participants || [];
        const userIndex = participants.findIndex(p => p.uid === user.uid);
        
        if (userIndex !== -1) {
          participants[userIndex].gender = newGender;
          await setDoc(doc.ref, {
            participants,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }

        // Also update if user is the session creator
        if (sessionData.userId === user.uid) {
          await setDoc(doc.ref, {
            gender: newGender,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      });

      await Promise.all(updatePromises);
      
      setUser(prevUser => ({
        ...prevUser,
        gender: newGender
      }));
      
      return true;
    } catch (error) {
      console.error("Error updating gender:", error);
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
          const userRef = doc(firebase.db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const googlePhotoURL = firebaseUser.photoURL?.replace('s96-c', 's400-c');
            
            // Only update photoURL from Google if user hasn't set a custom one
            if (!userData.photoURL && googlePhotoURL) {
              await setDoc(userRef, {
                photoURL: googlePhotoURL,
                updatedAt: serverTimestamp()
              }, { merge: true });
              userData.photoURL = googlePhotoURL;
            }
            
            setUser({
              ...firebaseUser,
              ...userData,
              photoURL: userData.photoURL || googlePhotoURL || firebaseUser.photoURL,
              major: userData.major || '',
              gender: userData.gender || '',
              isHornet: userData.isHornet || false,
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
    updateGender,
    upgradeToHornet,
    downgradeFromHornet,
    error,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}