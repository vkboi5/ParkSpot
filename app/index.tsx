import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ParkingSpot, getParkingSpots, saveParkingSpot, updateParkingSpot } from '../utils/storage';

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      
      // Load saved parking spots
      const savedSpots = await getParkingSpots();
      setParkingSpots(savedSpots);
    })();
  }, []);

  const addParkingSpot = async () => {
    if (location) {
      const newSpot: ParkingSpot = {
        id: Date.now().toString(),
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        available: true,
        timestamp: Date.now(),
      };
      
      const success = await saveParkingSpot(newSpot);
      if (success) {
        setParkingSpots([...parkingSpots, newSpot]);
        Alert.alert('Success', 'Parking spot added successfully!');
      } else {
        Alert.alert('Error', 'Failed to save parking spot');
      }
    }
  };

  const handleMarkerPress = async (spot: ParkingSpot) => {
    Alert.alert(
      'Parking Spot',
      `Status: ${spot.available ? 'Available' : 'Occupied'}\nLast updated: ${new Date(spot.timestamp).toLocaleString()}`,
      [
        {
          text: spot.available ? 'Mark as Occupied' : 'Mark as Available',
          onPress: async () => {
            const success = await updateParkingSpot(spot.id, !spot.available);
            if (success) {
              setParkingSpots(parkingSpots.map(s => 
                s.id === spot.id ? { ...s, available: !s.available, timestamp: Date.now() } : s
              ));
            }
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {location && (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {parkingSpots.map((spot) => (
            <Marker
              key={spot.id}
              coordinate={{
                latitude: spot.latitude,
                longitude: spot.longitude,
              }}
              title={spot.available ? "Available Parking" : "Occupied Parking"}
              description={`Last updated: ${new Date(spot.timestamp).toLocaleString()}`}
              onPress={() => handleMarkerPress(spot)}
              pinColor={spot.available ? 'green' : 'red'}
            />
          ))}
        </MapView>
      )}
      <TouchableOpacity style={styles.addButton} onPress={addParkingSpot}>
        <Ionicons name="add-circle" size={50} color="#007AFF" />
      </TouchableOpacity>
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