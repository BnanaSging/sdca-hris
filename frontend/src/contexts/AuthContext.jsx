import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock Authentication check via LocalStorage
    const fetchUser = async () => {
      const storedUserId = localStorage.getItem('mockUserId');
      if (storedUserId) {
        try {
          const docRef = doc(db, 'users', storedUserId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setCurrentUser({ uid: storedUserId, email: docSnap.data().email });
            setUserData(docSnap.data());
          } else {
            localStorage.removeItem('mockUserId');
          }
        } catch (error) {
          console.error("Error fetching user data", error);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (userId, data) => {
    localStorage.setItem('mockUserId', userId);
    setCurrentUser({ uid: userId, email: data.email });
    setUserData(data);

    try {
      await addDoc(collection(db, 'audit_logs'), {
        action: 'User Logged In',
        performedBy: data.name || data.email || 'Unknown User',
        timestamp: new Date().toISOString(),
        details: `User with email ${data.email} logged in successfully.`
      });
    } catch (e) {
      console.error('Failed to log audit:', e);
    }
  };

  const logout = async () => {
    const userName = userData?.name || currentUser?.email || 'Unknown User';
    
    localStorage.removeItem('mockUserId');
    setCurrentUser(null);
    setUserData(null);

    try {
      await addDoc(collection(db, 'audit_logs'), {
        action: 'User Logged Out',
        performedBy: userName,
        timestamp: new Date().toISOString(),
        details: `User logged out successfully.`
      });
    } catch (e) {
      console.error('Failed to log audit:', e);
    }
  };

  const value = {
    currentUser,
    userData,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
