import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

const UserApp = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number }>({
    latitude: 37.7749, // Initial user location
    longitude: -122.4194,
  });
  const [agentLocation, setAgentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const socket = new WebSocket('ws://192.168.1.131:8080/ws?user_id=user1');

    socket.onopen = () => {
      setIsConnected(true);
      console.log('Connected to WebSocket server');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setAgentLocation(data);
    };

    socket.onclose = () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket server');
    };

    socket.onerror = (error) => {
      console.error('WebSocket Error: ', error);
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  const getMapRegion = () => {
    if (userLocation && agentLocation) {
      const latDelta = Math.abs(userLocation.latitude - agentLocation.latitude) * 1.5;
      const lngDelta = Math.abs(userLocation.longitude - agentLocation.longitude) * 1.5;

      return {
        latitude: (userLocation.latitude + (agentLocation.latitude || 0)) / 2,
        longitude: (userLocation.longitude + (agentLocation.longitude || 0)) / 2,
        latitudeDelta: latDelta || 0.1,
        longitudeDelta: lngDelta || 0.1,
      };
    }
    return {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User App</Text>
      <Text style={styles.info}>Delivery Agent Location:</Text>
      <MapView
        style={styles.map}
        region={getMapRegion()}
      >
        <Marker coordinate={userLocation} title="User Location" pinColor="blue" />
        {agentLocation && (
          <>
            <Marker coordinate={agentLocation} title="Delivery Agent" pinColor="red" />
            <Polyline
              coordinates={[userLocation, agentLocation]}
              strokeColor="red"
              strokeWidth={3}
            />
          </>
        )}
        <Marker coordinate={{ latitude: 37.7749, longitude: -122.4194 }} title="Start Point" />
        <Polyline
          coordinates={[{ latitude: 37.7749, longitude: -122.4194 }, userLocation]}
          strokeColor="black"
          strokeWidth={3}
        />
      </MapView>
      <Button
        title={isConnected ? 'Disconnect' : 'Connect'}
        onPress={() => {
          if (ws) {
            ws.close();
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 10,
  },
  info: {
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center',
  },
  map: {
    flex: 1,
  },
});

export default UserApp;
