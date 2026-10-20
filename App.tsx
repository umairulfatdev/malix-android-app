import React, { useState, useEffect } from "react";
import { StyleSheet, SafeAreaView, ActivityIndicator, View, Text, Platform, StatusBar } from "react-native";
import { WebView } from "react-native-webview";

// 👇 YAHAN APNI VERCEL WALI LIVE WEBSITE KA URL DAALO
const WEBSITE_URL = "https://malix-umairulfatdev.vercel.app"; 

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EAB308" />
          <Text style={styles.loadingText}>Loading MALIX...</Text>
        </View>
      )}

      <WebView
        source={{ uri: WEBSITE_URL }}
        style={{ flex: 1, backgroundColor: '#000000' }}
        onLoadStart={() => {
          setIsLoading(true);
          setHasError(false);
        }}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        // Video play karne ke liye zaroori hai
        allowsFullscreenVideo={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        // File download handle karne ke liye
        startInLoadingState={true}
        // Status bar text hide karna
        setSupportMultipleWindows={false}
      />

      {hasError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Website se connect nahi ho paya. Please check your internet connection.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
    zIndex: 10,
  },
  loadingText: {
    color: "#EAB308",
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
  errorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
    padding: 20,
    zIndex: 20,
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
    fontSize: 16,
  },
});