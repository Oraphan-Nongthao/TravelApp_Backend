// LongdoMapView.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { LONGDO_MAP_API } from "../config";

type Props = {
  latitude: number;
  longitude: number;
};

const LongdoMapView = ({ latitude, longitude }: Props) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://api.longdo.com/map/?key=${LONGDO_MAP_API}"></script>
      <style>
        html, body {
          margin:0; padding:0; width:100%; height:100%;
        }
        #map {
          width:100%; height:100%;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = new longdo.Map({
          placeholder: document.getElementById('map'),
          zoom: 15,
          lastView: false,
          location: { lon: ${longitude}, lat: ${latitude} }
        });
        var marker = new longdo.Marker({ lon: ${longitude}, lat: ${latitude} });
        map.Overlays.add(marker);
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView source={{ html }} style={styles.webview} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
    overflow: 'hidden',
    borderRadius: 10,
  },
  webview: {
    flex: 1,
  },
});

export default LongdoMapView;
