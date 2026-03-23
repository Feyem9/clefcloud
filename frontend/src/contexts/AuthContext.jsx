import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  deleteUser
} from 'firebase/auth';
import { auth } from '../firebase/config';
import apiService from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inscription
  const signup = async (email, password) => {
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Envoyer un mail de vérification immédiatement
      await sendEmailVerification(userCredential.user);
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Connexion
  const login = async (email, password) => {
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Stocker le token pour le backend
      const token = await userCredential.user.getIdToken();
      apiService.setAuthToken(token);

      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Connexion Google
  const loginWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const token = await userCredential.user.getIdToken();
      apiService.setAuthToken(token);
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Mot de passe oublié
  const forgotPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Déconnexion
  const logout = () => {
    apiService.logout();
    return signOut(auth);
  };

  // Mise à jour de profil
  const updateUserProfile = async (displayName) => {
    setError(null);
    try {
      if (!currentUser) throw new Error('Utilisateur non connecté');

      // Update Firebase
      await updateProfile(currentUser, { displayName });
      // Update Postgres
      await apiService.updateProfile({ name: displayName });

      // Actualiser le currentUser localement
      setCurrentUser({ ...currentUser, displayName });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Suppression de profil
  const deleteAccount = async () => {
    setError(null);
    try {
      if (!currentUser) throw new Error('Utilisateur non connecté');

      // Delete from Postgres first (needs the active Firebase token)
      await apiService.deleteProfile();
      // Delete from Firebase
      await deleteUser(currentUser);

      apiService.logout();
      setCurrentUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Surveillance de l'état de l'utilisateur
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Rafraîchir le token Bearer pour les appels API backend
        const token = await user.getIdToken();
        apiService.setAuthToken(token);

        // Synchroniser immédiatement avec le backend PostgreSQL
        try {
          await apiService.validateToken(token);
        } catch (err) {
          console.error('Erreur lors de la synchronisation backend de firebase:', err);
        }

        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        apiService.setAuthToken(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    user: currentUser, // Alias pour compatibilité
    signup,
    login,
    loginWithGoogle,
    logout,
    forgotPassword,
    updateUserProfile,
    deleteAccount,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
