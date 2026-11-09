import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  BackHandler,
  Platform,
  Modal,
  TextInput,
  ScrollView,
  Share,
  StatusBar as RNStatusBar,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import type {
  WebViewNavigation,
  WebViewProgressEvent,
} from "react-native-webview/lib/WebViewTypes";
import { LinearGradient } from "expo-linear-gradient";
import * as ScreenOrientation from "expo-screen-orientation";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import {
  Home,
  Film,
  Tv,
  Clapperboard,
  Music,
  ShieldCheck,
  Bookmark,
  Search,
  Share2,
  RotateCw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  WifiOff,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  Palette,
  X,
  CheckCircle2,
  Clock,
} from "lucide-react-native";

const BASE_URL = "https://malix-fawn.vercel.app";
const USER_AGENT =
  "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36 MalixStreamingApp/2.0 ExpertEdition";

const WATCHLIST_KEY = "@malix_user_watchlist_v1";

// Theme presets definition
interface ThemeConfig {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  gradient: [string, string, string];
}

const THEMES: ThemeConfig[] = [
  {
    id: "violet",
    name: "Cyber Violet",
    primary: "#A855F7",
    secondary: "#6366F1",
    accent: "#EC4899",
    gradient: ["#030712", "#0F172A", "#1E1B4B"],
  },
  {
    id: "gold",
    name: "Gold Flame",
    primary: "#EAB308",
    secondary: "#F97316",
    accent: "#EF4444",
    gradient: ["#050505", "#18181B", "#27272A"],
  },
  {
    id: "cyan",
    name: "Neon Cyan",
    primary: "#06B6D4",
    secondary: "#3B82F6",
    accent: "#8B5CF6",
    gradient: ["#02131D", "#082F49", "#0F172A"],
  },
  {
    id: "emerald",
    name: "Matrix Green",
    primary: "#10B981",
    secondary: "#059669",
    accent: "#34D399",
    gradient: ["#022C22", "#064E3B", "#02131D"],
  },
];

interface WatchlistItem {
  id: string;
  title: string;
  url: string;
  addedAt: string;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <MainScreen />
    </SafeAreaProvider>
  );
}

// ==========================================
// CINEMATIC SPLASH SCREEN COMPONENT
// ==========================================
function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const splashFade = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [loadingStep, setLoadingStep] = useState("Initializing MALIX Engine...");

  useEffect(() => {
    // Light vibration on splash start
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    // Elastic scale & fade in animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3.5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();

    // Pulse loop animation for glowing outer ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Dynamic text status updates
    const t1 = setTimeout(() => {
      setLoadingStep("Connecting Ultra-Fast Servers...");
    }, 900);

    const t2 = setTimeout(() => {
      setLoadingStep("Loading Cinema Player Engine...");
    }, 1800);

    const t3 = setTimeout(() => {
      setLoadingStep("Ready to Stream! 🚀");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, 2400);

    // Transition to main screen
    const timer = setTimeout(() => {
      Animated.timing(splashFade, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(timer);
    };
  }, [fadeAnim, onFinish, progressAnim, pulseAnim, scaleAnim, splashFade]);

  return (
    <Animated.View style={[styles.splashContainer, { opacity: splashFade }]}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#030712", "#0F172A", "#1E1B4B"]}
        style={styles.splashGradient}
      >
        <Animated.View
          style={[
            styles.splashContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Animated Glow Logo Ring */}
          <Animated.View
            style={[
              styles.logoGlowWrapper,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <LinearGradient
              colors={["#A855F7", "#6366F1", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoCircle}
            >
              <Image
                source={require("./assets/android-icon-foreground.png")}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </LinearGradient>
          </Animated.View>

          {/* App Title */}
          <Text style={styles.splashTitle}>MALIX STREAM</Text>

          {/* Subtitle */}
          <Text style={styles.splashSubtitle}>
            Movies, Series & Anime Streaming Platform
          </Text>

          {/* Progress Track */}
          <View style={styles.splashProgressTrack}>
            <Animated.View
              style={[
                styles.splashProgressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>

          {/* Loading status text */}
          <Text style={styles.splashStatusText}>{loadingStep}</Text>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

// ==========================================
// MAIN SCREEN COMPONENT
// ==========================================
function MainScreen() {
  const webViewRef = useRef<any>(null);
  const [currentUrl, setCurrentUrl] = useState(`${BASE_URL}/`);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [loadingPercentage, setLoadingPercentage] = useState(0);
  const [isLandscape, setIsLandscape] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(THEMES[0]);

  // Modals & Drawers state
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [watchlistModalVisible, setWatchlistModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastFade = useRef(new Animated.Value(0)).current;

  // Load Watchlist from AsyncStorage on mount
  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    try {
      const data = await AsyncStorage.getItem(WATCHLIST_KEY);
      if (data) {
        setWatchlist(JSON.parse(data));
      }
    } catch (e) {
      console.error("Failed to load watchlist", e);
    }
  };

  const saveWatchlist = async (items: WatchlistItem[]) => {
    try {
      setWatchlist(items);
      await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save watchlist", e);
    }
  };

  // Show Toast Popup
  const showToast = (msg: string) => {
    setToastMessage(msg);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.sequence([
      Animated.timing(toastFade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastFade, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastMessage(null);
    });
  };

  // Add current page to Watchlist
  const toggleCurrentPageWatchlist = async () => {
    const pageTitle = extractTitleFromUrl(currentUrl);
    const existingIndex = watchlist.findIndex((item) => item.url === currentUrl);

    if (existingIndex >= 0) {
      // Remove
      const updated = watchlist.filter((item) => item.url !== currentUrl);
      await saveWatchlist(updated);
      showToast("Removed from Watchlist 🗑️");
    } else {
      // Add
      const newItem: WatchlistItem = {
        id: Date.now().toString(),
        title: pageTitle,
        url: currentUrl,
        addedAt: new Date().toLocaleDateString(),
      };
      const updated = [newItem, ...watchlist];
      await saveWatchlist(updated);
      showToast("Saved to Watchlist! ⭐");
    }
  };

  const extractTitleFromUrl = (url: string) => {
    if (url === `${BASE_URL}/` || url === BASE_URL) return "MALIX Home";
    const path = url.replace(BASE_URL, "");
    if (path.includes("/movies")) return "MALIX Movies";
    if (path.includes("/series")) return "MALIX Series";
    if (path.includes("/anime")) return "MALIX Anime";
    if (path.includes("/music")) return "MALIX Music";
    if (path.includes("/admin")) return "MALIX Admin Panel";
    if (path.includes("/search")) return "MALIX Search";
    const parts = path.split("/").filter(Boolean);
    if (parts.length > 0) {
      return (
        parts[parts.length - 1].charAt(0).toUpperCase() +
        parts[parts.length - 1].slice(1).replace(/-/g, " ")
      );
    }
    return "MALIX Stream";
  };

  const isCurrentPageInWatchlist = watchlist.some(
    (item) => item.url === currentUrl
  );

  // Hardware Back Button Handler
  useEffect(() => {
    const backAction = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, [canGoBack]);

  // Clean up orientation on unmount
  useEffect(() => {
    return () => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    };
  }, []);

  // Toggle Orientation Mode
  const toggleOrientation = async () => {
    Haptics.selectionAsync().catch(() => {});
    if (isLandscape) {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
      setIsLandscape(false);
      showToast("Portrait Mode 📱");
    } else {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
      setIsLandscape(true);
      showToast("Cinema Widescreen Mode 🎬");
    }
  };

  // Navigate to target URL inside WebView
  const navigateTo = (pathOrUrl: string) => {
    Haptics.selectionAsync().catch(() => {});
    const targetUrl = pathOrUrl.startsWith("http")
      ? pathOrUrl
      : `${BASE_URL}${pathOrUrl}`;
    setHasError(false);
    setLoadingPercentage(0);
    setCurrentUrl(targetUrl);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `window.location.href = '${targetUrl}'; true;`
      );
    }
  };

  // Perform Search
  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    setSearchModalVisible(false);
    navigateTo(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery("");
  };

  // Native Share Feature
  const handleShareCurrentPage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await Share.share({
        title: "MALIX STREAM",
        message: `Check out ${extractTitleFromUrl(currentUrl)} on MALIX Stream: ${currentUrl}`,
        url: currentUrl,
      });
    } catch (e) {
      console.error("Share error", e);
    }
  };

  // Selected tab indicators
  const isHomeSelected =
    currentUrl === `${BASE_URL}/` || currentUrl === BASE_URL;
  const isMoviesSelected = currentUrl.includes("/movies");
  const isSeriesSelected = currentUrl.includes("/series");
  const isAnimeSelected = currentUrl.includes("/anime");
  const isAdminSelected = currentUrl.includes("/admin");

  return (
    <SafeAreaView style={styles.mainContainer} edges={["top", "left", "right"]}>
      <StatusBar style="light" />

      {/* Top Glassmorphic App Bar */}
      <View style={styles.appBar}>
        {/* Left Side: Logo & Online Indicator */}
        <TouchableOpacity
          style={styles.appBarTitleContainer}
          onPress={() => navigateTo("/")}
          activeOpacity={0.8}
        >
          <View style={styles.logoWrapper}>
            <Image
              source={require("./assets/android-icon-foreground.png")}
              style={styles.appBarLogo}
              resizeMode="cover"
            />
            <View style={styles.onlineDot} />
          </View>
          <Text style={[styles.appBarTitle, { color: currentTheme.primary }]}>
            MALIX
          </Text>
        </TouchableOpacity>

        {/* Right Side: Pro Actions */}
        <View style={styles.appBarActions}>
          {/* Quick Search */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setSearchModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Search size={19} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Watchlist Toggle */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={toggleCurrentPageWatchlist}
            activeOpacity={0.7}
          >
            <Bookmark
              size={19}
              color={isCurrentPageInWatchlist ? currentTheme.primary : "#FFFFFF"}
              fill={isCurrentPageInWatchlist ? currentTheme.primary : "transparent"}
            />
          </TouchableOpacity>

          {/* Native Share */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShareCurrentPage}
            activeOpacity={0.7}
          >
            <Share2 size={19} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Theme Selector */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setThemeModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Palette size={19} color={currentTheme.primary} />
          </TouchableOpacity>

          {/* Orientation Toggle */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={toggleOrientation}
            activeOpacity={0.7}
          >
            {isLandscape ? (
              <Minimize2 size={19} color={currentTheme.primary} />
            ) : (
              <Maximize2 size={19} color={currentTheme.primary} />
            )}
          </TouchableOpacity>

          {/* Back */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => canGoBack && webViewRef.current?.goBack()}
            disabled={!canGoBack}
            activeOpacity={0.7}
          >
            <ChevronLeft
              size={20}
              color={canGoBack ? "#FFFFFF" : "rgba(255,255,255,0.3)"}
            />
          </TouchableOpacity>

          {/* Refresh */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setHasError(false);
              setLoadingPercentage(0);
              webViewRef.current?.reload();
            }}
            activeOpacity={0.7}
          >
            <RotateCw size={19} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        {/* Top Loading Progress Bar */}
        {loadingPercentage < 100 && (
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${loadingPercentage}%`,
                  backgroundColor: currentTheme.primary,
                },
              ]}
            />
          </View>
        )}
      </View>

      {/* Category Filter Chips Bar */}
      <View style={styles.categoryBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          <CategoryChip
            label="All"
            icon={<Home size={13} color={isHomeSelected ? "#000000" : "#FFFFFF"} />}
            isSelected={isHomeSelected}
            accentColor={currentTheme.primary}
            onPress={() => navigateTo("/")}
          />
          <CategoryChip
            label="Movies"
            icon={<Film size={13} color={isMoviesSelected ? "#000000" : "#FFFFFF"} />}
            isSelected={isMoviesSelected}
            accentColor={currentTheme.primary}
            onPress={() => navigateTo("/movies")}
          />
          <CategoryChip
            label="Series"
            icon={<Tv size={13} color={isSeriesSelected ? "#000000" : "#FFFFFF"} />}
            isSelected={isSeriesSelected}
            accentColor={currentTheme.primary}
            onPress={() => navigateTo("/series")}
          />
          <CategoryChip
            label="Anime"
            icon={<Clapperboard size={13} color={isAnimeSelected ? "#000000" : "#FFFFFF"} />}
            isSelected={isAnimeSelected}
            accentColor={currentTheme.primary}
            onPress={() => navigateTo("/anime")}
          />
          <CategoryChip
            label="Watchlist"
            icon={<Bookmark size={13} color="#FFFFFF" />}
            isSelected={false}
            accentColor={currentTheme.primary}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setWatchlistModalVisible(true);
            }}
          />
          <CategoryChip
            label="Admin"
            icon={<ShieldCheck size={13} color={isAdminSelected ? "#000000" : "#FFFFFF"} />}
            isSelected={isAdminSelected}
            accentColor={currentTheme.primary}
            onPress={() => navigateTo("/admin")}
          />
        </ScrollView>
      </View>

      {/* Main WebView Content Area */}
      {hasError ? (
        <View style={styles.errorContainer}>
          <WifiOff size={60} color={currentTheme.primary} style={{ marginBottom: 20 }} />
          <Text style={styles.errorTitle}>No Internet Connection</Text>
          <Text style={styles.errorText}>
            Please check your internet connection and try again.
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: currentTheme.primary }]}
            onPress={() => {
              setHasError(false);
              setLoadingPercentage(0);
              webViewRef.current?.reload();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: currentUrl }}
          userAgent={USER_AGENT}
          style={styles.webView}
          containerStyle={{ backgroundColor: "#0F172A" }}
          onLoadProgress={({ nativeEvent }: WebViewProgressEvent): void => {
            setLoadingPercentage(Math.round(nativeEvent.progress * 100));
          }}
          onNavigationStateChange={(navState: WebViewNavigation): void => {
            setCanGoBack(navState.canGoBack);
            setCanGoForward(navState.canGoForward);
            if (navState.url) {
              setCurrentUrl(navState.url);
            }
          }}
          onError={(): void => setHasError(false)}
          onHttpError={(): void => setHasError(true)}
          allowsFullscreenVideo={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          setSupportMultipleWindows={false}
          cacheEnabled={true}
          androidLayerType="hardware"
        />
      )}

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNavBar}>
        <NavButton
          icon={<Home size={21} color={isHomeSelected ? currentTheme.primary : "rgba(255,255,255,0.54)"} />}
          label="Home"
          isSelected={isHomeSelected}
          accentColor={currentTheme.primary}
          onPress={() => navigateTo("/")}
        />
        <NavButton
          icon={<Film size={21} color={isMoviesSelected ? currentTheme.primary : "rgba(255,255,255,0.54)"} />}
          label="Movies"
          isSelected={isMoviesSelected}
          accentColor={currentTheme.primary}
          onPress={() => navigateTo("/movies")}
        />
        <NavButton
          icon={<Tv size={21} color={isSeriesSelected ? currentTheme.primary : "rgba(255,255,255,0.54)"} />}
          label="Series"
          isSelected={isSeriesSelected}
          accentColor={currentTheme.primary}
          onPress={() => navigateTo("/series")}
        />
        <NavButton
          icon={<Clapperboard size={21} color={isAnimeSelected ? currentTheme.primary : "rgba(255,255,255,0.54)"} />}
          label="Anime"
          isSelected={isAnimeSelected}
          accentColor={currentTheme.primary}
          onPress={() => navigateTo("/anime")}
        />
        <NavButton
          icon={<ShieldCheck size={21} color={isAdminSelected ? currentTheme.primary : "rgba(255,255,255,0.54)"} />}
          label="Admin"
          isSelected={isAdminSelected}
          accentColor={currentTheme.primary}
          onPress={() => navigateTo("/admin")}
        />
      </View>

      {/* Toast Notification Overlay */}
      {toastMessage && (
        <Animated.View style={[styles.toastContainer, { opacity: toastFade }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      {/* SEARCH MODAL */}
      <Modal
        visible={searchModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.searchModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quick Search</Text>
              <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
                <X size={20} color="#A1A1AA" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchInputContainer}>
              <Search size={18} color="#A1A1AA" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Movies, Series, Anime..."
                placeholderTextColor="#71717A"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearchSubmit}
                autoFocus={true}
              />
            </View>
            <TouchableOpacity
              style={[styles.modalSubmitButton, { backgroundColor: currentTheme.primary }]}
              onPress={handleSearchSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.modalSubmitText}>Search Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* WATCHLIST MODAL */}
      <Modal
        visible={watchlistModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setWatchlistModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.drawerCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Bookmark size={20} color={currentTheme.primary} style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>My Watchlist ({watchlist.length})</Text>
              </View>
              <TouchableOpacity onPress={() => setWatchlistModalVisible(false)}>
                <X size={22} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            {watchlist.length === 0 ? (
              <View style={styles.emptyWatchlist}>
                <Bookmark size={48} color="rgba(255,255,255,0.2)" />
                <Text style={styles.emptyWatchlistText}>Your Watchlist is empty</Text>
                <Text style={styles.emptyWatchlistSubtext}>
                  Tap the bookmark icon in the top bar to save movies or series!
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 350 }}>
                {watchlist.map((item) => (
                  <View key={item.id} style={styles.watchlistItemCard}>
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() => {
                        setWatchlistModalVisible(false);
                        navigateTo(item.url);
                      }}
                    >
                      <Text style={styles.watchlistItemTitle}>{item.title}</Text>
                      <Text style={styles.watchlistItemDate}>Added: {item.addedAt}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteWatchlistBtn}
                      onPress={async () => {
                        const updated = watchlist.filter((w) => w.id !== item.id);
                        await saveWatchlist(updated);
                        showToast("Item deleted");
                      }}
                    >
                      <Trash2 size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* THEME SELECTION MODAL */}
      <Modal
        visible={themeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.searchModalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Palette size={20} color={currentTheme.primary} style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Choose Theme Accent</Text>
              </View>
              <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
                <X size={20} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            <View style={{ marginVertical: 12 }}>
              {THEMES.map((theme) => {
                const isSelected = currentTheme.id === theme.id;
                return (
                  <TouchableOpacity
                    key={theme.id}
                    style={[
                      styles.themeOptionRow,
                      isSelected && { borderColor: theme.primary, borderWidth: 1.5 },
                    ]}
                    onPress={() => {
                      setCurrentTheme(theme);
                      setThemeModalVisible(false);
                      showToast(`Switched to ${theme.name} 🎨`);
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View
                        style={[
                          styles.themeCircleColor,
                          { backgroundColor: theme.primary },
                        ]}
                      />
                      <Text style={styles.themeOptionName}>{theme.name}</Text>
                    </View>
                    {isSelected && <CheckCircle2 size={18} color={theme.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================
function CategoryChip({
  label,
  icon,
  isSelected,
  accentColor,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  isSelected: boolean;
  accentColor: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.chipButton,
        isSelected
          ? { backgroundColor: accentColor }
          : { backgroundColor: "rgba(255, 255, 255, 0.08)" },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon}
      <Text
        style={[
          styles.chipText,
          { color: isSelected ? "#000000" : "#FFFFFF", fontWeight: isSelected ? "bold" : "600" },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function NavButton({
  icon,
  label,
  isSelected,
  accentColor,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  isSelected: boolean;
  accentColor: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.navButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon}
      <Text
        style={[
          styles.navButtonText,
          {
            color: isSelected ? accentColor : "rgba(255,255,255,0.54)",
            fontWeight: isSelected ? "bold" : "normal",
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ==========================================
// STYLESHEET
// ==========================================
const styles = StyleSheet.create({
  // Splash Screen Styles
  splashContainer: {
    flex: 1,
    backgroundColor: "#030712",
  },
  splashGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  splashContent: {
    alignItems: "center",
    paddingHorizontal: 30,
  },
  logoGlowWrapper: {
    borderRadius: 72,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 30,
    elevation: 25,
    marginBottom: 25,
  },
  logoCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  logoImage: {
    width: 85,
    height: 85,
    borderRadius: 20,
  },
  splashTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 4.0,
    marginBottom: 8,
    textAlign: "center",
  },
  splashSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.75)",
    letterSpacing: 1.2,
    textAlign: "center",
    marginBottom: 40,
  },
  splashProgressTrack: {
    width: 160,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 16,
  },
  splashProgressBar: {
    height: "100%",
    backgroundColor: "#A855F7",
    borderRadius: 10,
  },
  splashStatusText: {
    fontSize: 12,
    color: "#A1A1AA",
    letterSpacing: 0.8,
  },

  // Main Screen Container
  mainContainer: {
    flex: 1,
    backgroundColor: "#0F172A",
    paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight : 0,
  },

  // App Bar
  appBar: {
    height: 54,
    backgroundColor: "#0F172A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    position: "relative",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  appBarTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoWrapper: {
    position: "relative",
  },
  appBarLogo: {
    width: 30,
    height: 30,
    borderRadius: 8,
    marginRight: 8,
  },
  onlineDot: {
    position: "absolute",
    bottom: -1,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    borderWidth: 1.5,
    borderColor: "#0F172A",
  },
  appBarTitle: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  appBarActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 6,
    marginLeft: 2,
  },
  progressBarTrack: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  progressBarFill: {
    height: "100%",
  },

  // Category Bar
  categoryBarWrapper: {
    backgroundColor: "#0F172A",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)",
  },
  categoryScroll: {
    paddingHorizontal: 10,
    alignItems: "center",
  },
  chipButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 8,
  },
  chipText: {
    fontSize: 12,
    marginLeft: 5,
  },

  // WebView
  webView: {
    flex: 1,
    backgroundColor: "#0F172A",
  },

  // Bottom Nav
  bottomNavBar: {
    height: 56,
    backgroundColor: "#0F172A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  navButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  navButtonText: {
    fontSize: 10,
    marginTop: 2,
  },

  // Toast
  toastContainer: {
    position: "absolute",
    bottom: 70,
    alignSelf: "center",
    backgroundColor: "#18181B",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },

  // Error Container
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F172A",
    padding: 20,
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
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  searchModalCard: {
    width: "100%",
    backgroundColor: "#18181B",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  drawerCard: {
    width: "100%",
    backgroundColor: "#18181B",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    maxHeight: 500,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#27272A",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
  },
  modalSubmitButton: {
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  modalSubmitText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },

  // Watchlist Modal items
  emptyWatchlist: {
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyWatchlistText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
  },
  emptyWatchlistSubtext: {
    color: "#71717A",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 20,
  },
  watchlistItemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#27272A",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  watchlistItemTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  watchlistItemDate: {
    color: "#71717A",
    fontSize: 11,
    marginTop: 2,
  },
  deleteWatchlistBtn: {
    padding: 8,
  },

  // Theme option rows
  themeOptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#27272A",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  themeCircleColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  themeOptionName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
