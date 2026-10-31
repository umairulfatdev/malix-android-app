import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, SafeAreaView, ActivityIndicator, View, Text, Platform, StatusBar, BackHandler, TouchableOpacity } from "react-native";
import { WebView } from "react-native-webview";
import { WifiOff } from "lucide-react-native"; // Icon ke liye

const WEBSITE_URL = "https://malix-fawn.vercel.app/"; 

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // Back Button Handle
  useEffect(() => {
    const backAction = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [canGoBack]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {isLoading && !hasError && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EAB308" />
          <Text style={styles.loadingText}>Loading MALIX...</Text>
        </View>
      )}

      {hasError ? (
        <View style={styles.errorContainer}>
          <WifiOff size={60} color="#EAB308" style={{ marginBottom: 20 }} />
          <Text style={styles.errorTitle}>No Internet Connection</Text>
          <Text style={styles.errorText}>
            Please check your internet connection and try again.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setHasError(false);
              setIsLoading(true);
              webViewRef.current?.reload();
            }}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: WEBSITE_URL }}
          style={{ flex: 1, backgroundColor: '#000000' }}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
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
    top: 0, left: 0, right: 0, bottom: 0,
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
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
    padding: 20,
    zIndex: 20,
  },
  errorTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  errorText: {
    color: "#A1A1AA",
    textAlign: "center",
    fontSize: 14,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: "#EAB308",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: "#000000",
    fontWeight: "bold",
    fontSize: 16,
  },
});