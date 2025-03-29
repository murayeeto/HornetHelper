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
      
      const result = await signInWithPopup(firebase.auth, provider);
      
      const photoURL = result.user.photoURL?.replace('s96-c', 's400-c') || null;
      
      const userRef = doc(firebase.db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Create new user document
        await setDoc(userRef, {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: photoURL,
          major: '',
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
      if (!user) throw new Error("No authenticated user");
      if (!file) throw new Error("No file provided");

      if (!file.type.startsWith('image/')) {
        throw new Error("Please upload an image file");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }

      // Create a timestamp for unique filename
      const timestamp = Date.now();
      const newImagePath = `images/${user.uid}/profile/${timestamp}.jpg`;
      
      try {
        // Delete old profile picture if it exists
        const userRef = doc(firebase.db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().photoURL) {
          try {
            // Extract the path from the full URL
            const oldURL = userSnap.data().photoURL;
            if (oldURL.includes('firebasestorage')) {
              // Get the path after /o/ and before ?
              const pathStart = oldURL.indexOf('/o/') + 3;
              const pathEnd = oldURL.indexOf('?');
              const oldPath = decodeURIComponent(oldURL.substring(pathStart, pathEnd !== -1 ? pathEnd : undefined));
              
              // Delete the old file
              const oldRef = ref(firebase.storage, oldPath);
              await deleteObject(oldRef);
              console.log('Old profile picture deleted');
            }
          } catch (deleteError) {
            console.log('No old profile picture to delete or error deleting:', deleteError);
          }
        }

        // Upload new file
        const newRef = ref(firebase.storage, newImagePath);
        const metadata = {
          contentType: file.type,
        };

        // Upload the file and metadata
        const uploadTask = await uploadBytes(newRef, file, metadata);
        console.log('Upload successful:', uploadTask);

        // Get the download URL
        const downloadURL = await getDownloadURL(uploadTask.ref);
        console.log('File available at:', downloadURL);

        // Update auth profile
        await updateProfile(firebase.auth.currentUser, {
          photoURL: downloadURL
        });

        // Update Firestore
        await setDoc(userRef, {
          photoURL: downloadURL,
          updatedAt: serverTimestamp()
        }, { merge: true });

        // Update local state
        setUser(prevUser => ({
          ...prevUser,
          photoURL: downloadURL
        }));

        return true;
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
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
          const userRef = doc(firebase.db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const googlePhotoURL = firebaseUser.photoURL?.replace('s96-c', 's400-c');
            
            if (googlePhotoURL && userData.photoURL !== googlePhotoURL) {
              await setDoc(userRef, {
                photoURL: googlePhotoURL,
                updatedAt: serverTimestamp()
              }, { merge: true });
              userData.photoURL = googlePhotoURL;
            }
            
            setUser({
              ...firebaseUser,
              photoURL: userData.photoURL || firebaseUser.photoURL,
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