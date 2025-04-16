import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCW-s9pHVSorciApkhQHBzAoNJgCcjML6U",
  authDomain: "parkspot-67c8c.firebaseapp.com",
  projectId: "parkspot-67c8c",
  storageBucket: "parkspot-67c8c.firebasestorage.app",
  messagingSenderId: "347423754616",
  appId: "1:347423754616:web:5befd1508b47e02010e08d",
  measurementId: "G-W43WHNN25D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only if supported
let analytics = null;
isSupported().then(yes => yes && (analytics = getAnalytics(app)));

const db = getFirestore(app);

// Collection references
const usersCollection = collection(db, 'users');
const parkingSpotsCollection = collection(db, 'parkingSpots');

// User functions
export const saveUser = async (user: { id: string; name: string }) => {
  try {
    const userDoc = doc(db, 'users', user.id);
    await setDoc(userDoc, user, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving user:', error);
    return false;
  }
};

export const getUser = async (userId: string) => {
  try {
    const userDoc = doc(db, 'users', userId);
    const userSnap = await getDoc(userDoc);
    return userSnap.exists() ? userSnap.data() : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

// Parking spot functions
export const saveParkingSpot = async (spot: {
  id: string;
  latitude: number;
  longitude: number;
  available: boolean;
  timestamp: number;
  userId: string;
  userName: string;
  description?: string;
}) => {
  try {
    const spotDoc = doc(db, 'parkingSpots', spot.id);
    await setDoc(spotDoc, spot, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving parking spot:', error);
    return false;
  }
};

export const getParkingSpots = async () => {
  try {
    const spotsSnap = await getDocs(parkingSpotsCollection);
    return spotsSnap.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error getting parking spots:', error);
    return [];
  }
};

export const getUserParkingSpots = async (userId: string) => {
  try {
    const q = query(parkingSpotsCollection, where('userId', '==', userId));
    const spotsSnap = await getDocs(q);
    return spotsSnap.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error getting user parking spots:', error);
    return [];
  }
};

export const updateParkingSpot = async (spotId: string, available: boolean) => {
  try {
    const spotDoc = doc(db, 'parkingSpots', spotId);
    await setDoc(spotDoc, {
      available,
      timestamp: Date.now()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error updating parking spot:', error);
    return false;
  }
};

export const deleteParkingSpot = async (spotId: string) => {
  try {
    const spotDoc = doc(db, 'parkingSpots', spotId);
    await deleteDoc(spotDoc);
    return true;
  } catch (error) {
    console.error('Error deleting parking spot:', error);
    return false;
  }
};

export { db }; 