// GoogleMapView.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

type Props = {
  latitude: number;
  longitude: number;
};

const GoogleMapView = ({ latitude, longitude }: Props) => {
  const mapHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        html, body, #map {
          height: 100%;
          width: 100%;
          margin: 0;
          padding: 0;
        }
      </style>
      <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY"></script>
    </head>
    <body>
      <div id="map"></div>
      <script>
        function initMap() {
          const location = { lat: ${latitude}, lng: ${longitude} };
          const map = new google.maps.Map(document.getElementById("map"), {
            zoom: 16,
            center: location,
          });
          const marker = new google.maps.Marker({
            position: location,
            map: map,
          });
        }
        window.onload = initMap;
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView source={{ html: mapHtml }} style={styles.webview} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 200,
    overflow: "hidden",
    borderRadius: 10,
  },
  webview: {
    flex: 1,
  },
});

export default GoogleMapView;
