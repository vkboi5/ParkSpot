import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveUser as saveUserToFirebase,
  getUser as getUserFromFirebase,
  saveParkingSpot as saveParkingSpotToFirebase,
  getParkingSpots as getParkingSpotsFromFirebase,
  getUserParkingSpots as getUserParkingSpotsFromFirebase,
  updateParkingSpot as updateParkingSpotInFirebase,
  deleteParkingSpot as deleteParkingSpotFromFirebase
} from './firebase';

export interface ParkingSpot {
  id: string;
  latitude: number;
  longitude: number;
  available: boolean;
  timestamp: number;
  userId: string;
  userName: string;
  description?: string;
}

const STORAGE_KEY = '@parking_spots';
const USER_KEY = '@current_user';

export interface User {
  id: string;
  name: string;
}

export const saveCurrentUser = async (user: User) => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    await saveUserToFirebase(user);
    return true;
  } catch (error) {
    console.error('Error saving user:', error);
    return false;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const localUser = await AsyncStorage.getItem(USER_KEY);
    if (localUser) {
      const user = JSON.parse(localUser);
      await saveUserToFirebase(user);
      return user;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const saveParkingSpot = async (spot: ParkingSpot) => {
  try {
    return await saveParkingSpotToFirebase(spot);
  } catch (error) {
    console.error('Error saving parking spot:', error);
    return false;
  }
};

export const getParkingSpots = async (): Promise<ParkingSpot[]> => {
  try {
    return await getParkingSpotsFromFirebase();
  } catch (error) {
    console.error('Error getting parking spots:', error);
    return [];
  }
};

export const getUserParkingSpots = async (userId: string): Promise<ParkingSpot[]> => {
  try {
    return await getUserParkingSpotsFromFirebase(userId);
  } catch (error) {
    console.error('Error getting user parking spots:', error);
    return [];
  }
};

export const updateParkingSpot = async (spotId: string, available: boolean) => {
  try {
    return await updateParkingSpotInFirebase(spotId, available);
  } catch (error) {
    console.error('Error updating parking spot:', error);
    return false;
  }
};

export const deleteParkingSpot = async (spotId: string) => {
  try {
    return await deleteParkingSpotFromFirebase(spotId);
  } catch (error) {
    console.error('Error deleting parking spot:', error);
    return false;
  }
}; 