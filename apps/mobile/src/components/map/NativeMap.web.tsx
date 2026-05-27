import React from 'react';
import { View, Text } from 'react-native';

export const Marker = ({ children }: any) => <View>{children}</View>;
export const Polyline = () => <View />;
export const PROVIDER_DEFAULT = null;

const MapView = React.forwardRef(({ children }: any, ref) => {
  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 32 }}>🗺️</Text>
      </View>
      <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>Map view is not supported on Web</Text>
      <Text style={{ color: '#94a3b8', fontSize: 15, textAlign: 'center' }}>Please use the Bexiemart mobile app on an iOS or Android device to view the map.</Text>
      <View style={{ display: 'none' }}>{children}</View>
    </View>
  );
});

export default MapView;
