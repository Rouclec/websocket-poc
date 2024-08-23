import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

const DeliveryAgentApp = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [userID, setUserID] = useState<string>('user1');
  const [deliverID, setDeliverID] = useState<string>('delivery1');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [agentLocation, setAgentLocation] = useState<{ latitude: number; longitude: number }>({
    latitude: 37.7749, // Initial delivery agent location
    longitude: -122.4194,
  });
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number }>({
    latitude: 37.7749, // Fixed user location
    longitude: -122.4194,
  });

  useEffect(() => {
    const socket = new WebSocket(
      `ws://192.168.1.131:8080/ws?delivery_id=${deliverID}&user_id=${userID}`
    );

    socket.onopen = () => {
      setIsConnected(true);
      console.log('Connected to WebSocket server');
      startSendingLocation(socket);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setUserLocation(data);
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
  }, [userID, deliverID]);

  const startSendingLocation = (socket: WebSocket) => {
    let lat = 37.7749; // Starting latitude
    let lng = -122.4194; // Starting longitude

    const interval = setInterval(() => {
      if (lat < 37.8049) {
        lat += 0.0001; // Move north
        lng += 0.0001; // Move east
        const location = JSON.stringify({ latitude: lat, longitude: lng });
        socket.send(location);
        setAgentLocation({ latitude: lat, longitude: lng });
      } else {
        clearInterval(interval);
      }
    }, 10000); // Update every 10 seconds
  };

  const getMapRegion = () => {
    if (userLocation && agentLocation) {
      const latDelta = Math.abs(userLocation.latitude - agentLocation.latitude) * 1.5;
      const lngDelta = Math.abs(userLocation.longitude - agentLocation.longitude) * 1.5;

      return {
        latitude: (userLocation.latitude + agentLocation.latitude) / 2,
        longitude: (userLocation.longitude + agentLocation.longitude) / 2,
        latitudeDelta: latDelta || 0.1,
        longitudeDelta: lngDelta || 0.1,
      };
    }
    return {
      latitude: agentLocation.latitude,
      longitude: agentLocation.longitude,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery Agent App</Text>
      <Text style={styles.info}>Send Location:</Text>
      <MapView
        style={styles.map}
        region={getMapRegion()}
      >
        <Marker coordinate={userLocation} title="User Location" pinColor="blue" />
        <Marker coordinate={agentLocation} title="Delivery Agent" pinColor="red" />
        <Polyline
          coordinates={[agentLocation, userLocation]}
          strokeColor="red"
          strokeWidth={3}
        />
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

export default DeliveryAgentApp;
