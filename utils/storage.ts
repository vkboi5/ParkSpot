import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ParkingSpot {
  id: string;
  latitude: number;
  longitude: number;
  available: boolean;
  timestamp: number;
}

const STORAGE_KEY = '@parking_spots';

export const saveParkingSpot = async (spot: ParkingSpot) => {
  try {
    const existingSpots = await getParkingSpots();
    const updatedSpots = [...existingSpots, spot];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSpots));
    return true;
  } catch (error) {
    console.error('Error saving parking spot:', error);
    return false;
  }
};

export const getParkingSpots = async (): Promise<ParkingSpot[]> => {
  try {
    const spots = await AsyncStorage.getItem(STORAGE_KEY);
    return spots ? JSON.parse(spots) : [];
  } catch (error) {
    console.error('Error getting parking spots:', error);
    return [];
  }
};

export const updateParkingSpot = async (spotId: string, available: boolean) => {
  try {
    const spots = await getParkingSpots();
    const updatedSpots = spots.map(spot => 
      spot.id === spotId ? { ...spot, available, timestamp: Date.now() } : spot
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSpots));
    return true;
  } catch (error) {
    console.error('Error updating parking spot:', error);
    return false;
  }
};

export const deleteParkingSpot = async (spotId: string) => {
  try {
    const spots = await getParkingSpots();
    const updatedSpots = spots.filter(spot => spot.id !== spotId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSpots));
    return true;
  } catch (error) {
    console.error('Error deleting parking spot:', error);
    return false;
  }
}; 