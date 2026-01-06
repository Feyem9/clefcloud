import { createContext, useContext, useEffect, useState } from 'react';

// ========================================
// ANCIEN CODE FIREBASE (COMMENTÉ)
// Pour revenir à Firebase, décommentez ci-dessous et commentez la section AWS
// ========================================
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../firebase/config';

// ========================================
// NOUVEAU CODE AWS COGNITO
// ========================================
// import apiService from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// ========================================
// ANCIEN CODE FIREBASE (COMMENTÉ)
// ========================================
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    loginWithGoogle,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// ========================================
// NOUVEAU CODE AWS COGNITO
// ========================================
// export const AuthProvider = ({ children }) => {
//   const [currentUser, setCurrentUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//
//   // Charger l'utilisateur depuis le localStorage au démarrage
//   useEffect(() => {
//     const loadUser = async () => {
//       try {
//         const token = apiService.getAuthToken();
//         const userStr = localStorage.getItem('user');
//
//         if (token && userStr) {
//           const user = JSON.parse(userStr);
//           setCurrentUser(user);
//           
//           // Vérifier que le token est toujours valide
//           try {
//             const profile = await apiService.getProfile();
//             setCurrentUser(prev => ({ ...prev, ...profile }));
//           } catch (err) {
//             // Token invalide, déconnecter
//             if (err.status === 401) {
//               apiService.logout();
//               setCurrentUser(null);
//             }
//           }
//         }
//       } catch (err) {
//         console.error('Error loading user:', err);
//       } finally {
//         setLoading(false);
//       }
//     };
//
//     loadUser();
//   }, []);
//
//   /**
//    * Inscription avec email, password et téléphone
//    * ⚠️ IMPORTANT: Le téléphone est maintenant OBLIGATOIRE
//    */
//   const signup = async (email, password, phone) => {
//     try {
//       setError(null);
//       // Ne pas changer le loading global pour éviter de démonter les composants
//       
//       const data = await apiService.signup(email, password, phone);
//       
//       return {
//         success: true,
//         message: data.message,
//         userSub: data.userSub,
//         needsConfirmation: !data.userConfirmed
//       };
//     } catch (err) {
//       setError(err.message || 'Erreur lors de l\'inscription');
//       throw err;
//     }
//   };
//
//   /**
//    * Confirmer l'inscription avec le code reçu par email
//    * ⚠️ NOUVEAU: Cette étape est nécessaire après l'inscription
//    */
//   const confirmSignup = async (email, code) => {
//     try {
//       setError(null);
//       // Ne pas changer le loading global pour éviter de démonter les composants
//       
//       await apiService.confirmSignup(email, code);
//       
//       return {
//         success: true,
//         message: 'Email confirmé avec succès'
//       };
//     } catch (err) {
//       setError(err.message || 'Erreur lors de la confirmation');
//       throw err;
//     }
//   };
//
//   /**
//    * Connexion avec email et password
//    */
//   const login = async (email, password) => {
//     try {
//       setError(null);
//       setLoading(true);
//       
//       const data = await apiService.signin(email, password);
//       
//       if (data.user) {
//         setCurrentUser(data.user);
//       }
//       
//       return {
//         success: true,
//         user: data.user,
//         tokens: data.tokens
//       };
//     } catch (err) {
//       setError(err.message || 'Erreur lors de la connexion');
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   /**
//    * Déconnexion
//    */
//   const logout = async () => {
//     try {
//       setError(null);
//       await apiService.signout();
//     } catch (err) {
//       console.error('Logout error:', err);
//     } finally {
//       setCurrentUser(null);
//       apiService.logout();
//     }
//   };
//
//   /**
//    * Changer le mot de passe
//    * ⚠️ NOUVEAU: Fonction disponible
//    */
//   const changePassword = async (oldPassword, newPassword) => {
//     try {
//       setError(null);
//       await apiService.changePassword(oldPassword, newPassword);
//       return { success: true };
//     } catch (err) {
//       setError(err.message || 'Erreur lors du changement de mot de passe');
//       throw err;
//     }
//   };
//
//   /**
//    * Mot de passe oublié
//    * ⚠️ NOUVEAU: Fonction disponible
//    */
//   const forgotPassword = async (email) => {
//     try {
//       setError(null);
//       await apiService.forgotPassword(email);
//       return { success: true };
//     } catch (err) {
//       setError(err.message || 'Erreur lors de la réinitialisation');
//       throw err;
//     }
//   };
//
//   /**
//    * Renvoyer le code de confirmation
//    * ⚠️ NOUVEAU: Fonction disponible
//    */
//   const resendConfirmationCode = async (email) => {
//     try {
//       setError(null);
//       await apiService.resendConfirmationCode(email);
//       return { success: true };
//     } catch (err) {
//       setError(err.message || 'Erreur lors de l\'envoi du code');
//       throw err;
//     }
//   };
//
//   /**
//    * Rafraîchir le profil utilisateur
//    * ⚠️ NOUVEAU: Fonction disponible
//    */
//   const refreshProfile = async () => {
//     try {
//       const profile = await apiService.getProfile();
//       setCurrentUser(prev => ({ ...prev, ...profile }));
//       return profile;
//     } catch (err) {
//       console.error('Error refreshing profile:', err);
//       throw err;
//     }
//   };
//
//   const value = {
//     currentUser,
//     loading,
//     error,
//     signup,
//     confirmSignup,
//     login,
//     logout,
//     changePassword,
//     forgotPassword,
//     resendConfirmationCode,
//     refreshProfile,
//     // Alias pour compatibilité avec l'ancien code
//     user: currentUser,
//     // loginWithGoogle: Non implémenté (peut être ajouté plus tard)
//   };
//
//   return (
//     <AuthContext.Provider value={value}>
//       {!loading && children}
//     </AuthContext.Provider>
//   );
// };
