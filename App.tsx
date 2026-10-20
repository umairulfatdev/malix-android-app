import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, SafeAreaView, ActivityIndicator, View, Text, Platform, StatusBar, BackHandler } from "react-native";
import { WebView } from "react-native-webview";

const WEBSITE_URL = "https://malix-fawn.vercel.app/"; 

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // 👇 NAYA: Back Button Handle karne ke liye
  useEffect(() => {
    const backAction = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true; // Event handle ho gaya
      }
      return false; // Event handle nahi hua (app minimize/exit)
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [canGoBack]);

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
        ref={webViewRef}
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
        // 👇 NAYA: Back button ke liye history track karo
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
        }}
        allowsFullscreenVideo={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        setSupportMultipleWindows={false}
        userAgent="Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        onShouldStartLoadWithRequest={(request) => {
          if (request.url.includes("drive.google.com") || request.url.includes("download")) {
            return false;
          }
          return true;
        }}
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