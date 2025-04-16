import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Alert, TextInput, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ParkingSpot, getParkingSpots, saveParkingSpot, updateParkingSpot, getCurrentUser, User } from '../utils/storage';
import { router } from 'expo-router';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '../utils/firebase';

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAddSpot, setShowAddSpot] = useState(false);
  const [spotDescription, setSpotDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<Region>({
    latitude: 21.1458, // Default to Nagpur coordinates
    longitude: 79.0882,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    setupLocationAndUser();
    setupRealtimeUpdates();
  }, []);

  const setupLocationAndUser = async () => {
    try {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        return;
      }

      // Get current location with high accuracy
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(location);
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      // Load user
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/profile');
        return;
      }
      setUser(currentUser);
      
      // Load initial parking spots
      const savedSpots = await getParkingSpots();
      setParkingSpots(savedSpots);
    } catch (error) {
      console.error('Error setting up location and user:', error);
      setErrorMsg('Error setting up the app');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeUpdates = () => {
    const parkingSpotsRef = collection(db, 'parkingSpots');
    const unsubscribe = onSnapshot(parkingSpotsRef, (snapshot) => {
      const spots = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as ParkingSpot[];
      setParkingSpots(spots);
    });

    return () => unsubscribe();
  };

  const addParkingSpot = async () => {
    if (location && user) {
      const newSpot: ParkingSpot = {
        id: Date.now().toString(),
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        available: true,
        timestamp: Date.now(),
        userId: user.id,
        userName: user.name,
        description: spotDescription.trim() || undefined,
      };
      
      const success = await saveParkingSpot(newSpot);
      if (success) {
        setShowAddSpot(false);
        setSpotDescription('');
        Alert.alert('Success', 'Parking spot added successfully!');
      } else {
        Alert.alert('Error', 'Failed to save parking spot');
      }
    }
  };

  const handleMarkerPress = async (spot: ParkingSpot) => {
    const isOwner = user?.id === spot.userId;
    const actions = [
      {
        text: spot.available ? 'Mark as Occupied' : 'Mark as Available',
        onPress: async () => {
          if (isOwner) {
            const success = await updateParkingSpot(spot.id, !spot.available);
            if (!success) {
              Alert.alert('Error', 'Failed to update parking spot');
            }
          } else {
            Alert.alert('Error', 'Only the owner can update this spot');
          }
        }
      },
      {
        text: 'Cancel',
        style: 'cancel'
      }
    ];

    Alert.alert(
      'Parking Spot',
      `Status: ${spot.available ? 'Available' : 'Occupied'}\nAdded by: ${spot.userName}\n${spot.description ? `Description: ${spot.description}\n` : ''}Last updated: ${new Date(spot.timestamp).toLocaleString()}`,
      actions
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsUserLocation
        showsMyLocationButton
      >
        {parkingSpots.map((spot) => (
          <Marker
            key={`${spot.id}-${spot.timestamp}`}
            coordinate={{
              latitude: spot.latitude,
              longitude: spot.longitude,
            }}
            title={spot.available ? "Available Parking" : "Occupied Parking"}
            description={`Added by: ${spot.userName}`}
            onPress={() => handleMarkerPress(spot)}
            pinColor={spot.available ? 'green' : 'red'}
          />
        ))}
      </MapView>
      <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')}>
        <Ionicons name="person-circle" size={40} color="#007AFF" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.addButton} onPress={() => setShowAddSpot(true)}>
        <Ionicons name="add-circle" size={50} color="#007AFF" />
      </TouchableOpacity>
      {showAddSpot && (
        <View style={styles.addSpotContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add description (optional)"
            value={spotDescription}
            onChangeText={setSpotDescription}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => {
              setShowAddSpot(false);
              setSpotDescription('');
            }}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={addParkingSpot}>
              <Text style={styles.buttonText}>Add Spot</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 5,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  profileButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 5,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addSpotContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#ff3b30',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  errorContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 5,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
  },
}); 