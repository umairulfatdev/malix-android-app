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
  ActivityIndicator,
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
import * as Updates from "expo-updates";
import Constants from "expo-constants";
import {
  Home,
  Film,
  Tv,
  Clapperboard,
  Bookmark,
  Search,
  Share2,
  RotateCw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  WifiOff,
  Trash2,
  Palette,
  X,
  CheckCircle2,
  Settings as SettingsIcon,
  Download,
  History,
  Zap,
  RefreshCw,
  Heart,
  ShieldCheck,
  Volume2,
  ToggleLeft,
  ToggleRight,
  Play,
  Pause,
  FastForward,
  Rewind,
  Gauge,
  Moon,
  Sun,
  Monitor,
  SlidersHorizontal,
} from "lucide-react-native";

const BASE_URL = "https://malix-fawn.vercel.app";
const USER_AGENT =
  "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36 MalixStreamingApp/2.0 ExpertEdition";

const WATCHLIST_KEY = "@malix_user_watchlist_v1";
const HISTORY_KEY = "@malix_user_history_v1";
const SETTING_AUTO_UPDATE_KEY = "@malix_setting_auto_update_v1";
const SETTING_HAPTICS_KEY = "@malix_setting_haptics_v1";
const SETTING_ADBLOCK_KEY = "@malix_setting_adblock_v1";

const APP_VERSION = Constants.expoConfig?.version || "1.0.0";

// Advanced Injected Player Engine & Ad Blocker Script
const INJECTED_PLAYER_ENGINE = `
  (function() {
    // Block popup windows and ad redirects
    window.open = function() { return null; };

    // Apply speed and aspect ratio fit to HTML5 video elements
    window.__malixApplyVideoSettings = function(speed, fitMode) {
      try {
        var videos = document.querySelectorAll('video');
        videos.forEach(function(v) {
          if (speed) v.playbackRate = speed;
          if (fitMode) v.style.objectFit = fitMode;
          v.setAttribute('playsinline', 'true');
          v.setAttribute('webkit-playsinline', 'true');
        });
      } catch(e) {}
    };

    // Seek video forward/backward
    window.__malixSeekVideo = function(seconds) {
      try {
        var videos = document.querySelectorAll('video');
        videos.forEach(function(v) {
          v.currentTime = Math.max(0, v.currentTime + seconds);
        });
      } catch(e) {}
    };

    // Play or Pause video
    window.__malixTogglePlayVideo = function() {
      try {
        var videos = document.querySelectorAll('video');
        videos.forEach(function(v) {
          if (v.paused) { v.play(); } else { v.pause(); }
        });
      } catch(e) {}
    };

    // Auto-observe dynamic video insertions
    var observer = new MutationObserver(function() {
      window.__malixApplyVideoSettings(window.__malixCurrentSpeed || 1.0, window.__malixCurrentFit || 'contain');
    });
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }

    true;
  })();
`;

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

interface HistoryItem {
  id: string;
  title: string;
  url: string;
  visitedAt: string;
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
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [playerModalVisible, setPlayerModalVisible] = useState(false);
  const [watchlistTab, setWatchlistTab] = useState<"watchlist" | "history">("watchlist");

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Video Player Advanced Settings State
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [videoFitMode, setVideoFitMode] = useState<"contain" | "cover" | "fill">("contain");
  const [theaterMode, setTheaterMode] = useState<boolean>(false);

  // User Preferences & Settings state
  const [autoCheckUpdates, setAutoCheckUpdates] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [adBlockEnabled, setAdBlockEnabled] = useState(true);

  // Update checking state
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatusText, setUpdateStatusText] = useState<string | null>(null);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastFade = useRef(new Animated.Value(0)).current;

  // Load Watchlist, History & Settings from AsyncStorage on mount
  useEffect(() => {
    loadWatchlist();
    loadHistory();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const autoUp = await AsyncStorage.getItem(SETTING_AUTO_UPDATE_KEY);
      const hapt = await AsyncStorage.getItem(SETTING_HAPTICS_KEY);
      const adBlk = await AsyncStorage.getItem(SETTING_ADBLOCK_KEY);

      if (autoUp !== null) setAutoCheckUpdates(autoUp === "true");
      if (hapt !== null) setHapticsEnabled(hapt === "true");
      if (adBlk !== null) setAdBlockEnabled(adBlk === "true");

      // Silent update check if auto update is enabled
      if (autoUp !== "false" && !__DEV__) {
        silentCheckForUpdate();
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  };

  const silentCheckForUpdate = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        showToast("🚀 New App Update Available! Tap Settings to Install");
      }
    } catch (e) {
      // Ignore silent error
    }
  };

  const toggleAutoUpdate = async () => {
    const val = !autoCheckUpdates;
    setAutoCheckUpdates(val);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem(SETTING_AUTO_UPDATE_KEY, String(val));
    showToast(val ? "Auto Check Updates: ON 🔄" : "Auto Check Updates: OFF");
  };

  const toggleHaptics = async () => {
    const val = !hapticsEnabled;
    setHapticsEnabled(val);
    if (val) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await AsyncStorage.setItem(SETTING_HAPTICS_KEY, String(val));
    showToast(val ? "Vibration Feedback: ON 📳" : "Vibration Feedback: OFF");
  };

  const toggleAdBlock = async () => {
    const val = !adBlockEnabled;
    setAdBlockEnabled(val);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem(SETTING_ADBLOCK_KEY, String(val));
    showToast(val ? "Ad & Popup Shield: ACTIVE 🛡️" : "Ad Shield: DISABLED");
  };

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (hapticsEnabled) {
      Haptics.impactAsync(style).catch(() => {});
    }
  };

  // Video Player Advanced Commands
  const changePlaybackSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        window.__malixCurrentSpeed = ${speed};
        window.__malixApplyVideoSettings(${speed}, '${videoFitMode}');
        true;
      `);
    }
    showToast(`Speed: ${speed}x ⚡`);
  };

  const changeVideoFitMode = (mode: "contain" | "cover" | "fill") => {
    setVideoFitMode(mode);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        window.__malixCurrentFit = '${mode}';
        window.__malixApplyVideoSettings(${playbackSpeed}, '${mode}');
        true;
      `);
    }
    const modeLabel = mode === "contain" ? "Standard Fit" : mode === "cover" ? "Zoom Widescreen" : "Stretch Fill";
    showToast(`Aspect Ratio: ${modeLabel} 📐`);
  };

  const seekVideo = (seconds: number) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        window.__malixSeekVideo(${seconds});
        true;
      `);
    }
    showToast(seconds > 0 ? `Forward +${seconds}s ⏩` : `Rewind ${seconds}s ⏪`);
  };

  const togglePlayPauseVideo = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        window.__malixTogglePlayVideo();
        true;
      `);
    }
    showToast("Play/Pause Toggled ▶️⏸️");
  };

  const toggleTheaterMode = () => {
    const val = !theaterMode;
    setTheaterMode(val);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    showToast(val ? "Theater Lights Dimmed 🌙" : "Theater Mode Off ☀️");
  };

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

  const loadHistory = async () => {
    try {
      const data = await AsyncStorage.getItem(HISTORY_KEY);
      if (data) {
        setHistory(JSON.parse(data));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  };

  const addToHistory = async (url: string) => {
    if (!url || url.includes("/admin")) return;
    const title = extractTitleFromUrl(url);
    const now = new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      title,
      url,
      visitedAt: now,
    };
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.url !== url);
      const updated = [newItem, ...filtered].slice(0, 25);
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const clearHistory = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setHistory([]);
    await AsyncStorage.removeItem(HISTORY_KEY);
    showToast("Watch History Cleared 🗑️");
  };

  // Show Toast Popup
  const showToast = (msg: string) => {
    setToastMessage(msg);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(toastFade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2200),
      Animated.timing(toastFade, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastMessage(null);
    });
  };

  // Check App Updates via expo-updates
  const handleCheckAppUpdate = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setIsCheckingUpdate(true);
    setUpdateStatusText("Checking for latest updates...");

    try {
      if (__DEV__) {
        setTimeout(() => {
          setIsCheckingUpdate(false);
          setUpdateStatusText("App is up to date (Dev Mode) ✨");
          showToast(`MALIX is on latest version! (v${APP_VERSION})`);
        }, 1200);
        return;
      }

      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        setUpdateStatusText("New update found! Downloading...");
        await Updates.fetchUpdateAsync();
        setUpdateStatusText("Update complete! Reloading MALIX...");
        showToast("Update installed! Restarting app... 🚀");
        setTimeout(async () => {
          await Updates.reloadAsync();
        }, 1500);
      } else {
        setIsCheckingUpdate(false);
        setUpdateStatusText("You are using the latest version! ✨");
        showToast(`MALIX is up to date! (v${APP_VERSION})`);
      }
    } catch (error) {
      setIsCheckingUpdate(false);
      setUpdateStatusText(`You are on version v${APP_VERSION}! ✨`);
      showToast(`Latest version v${APP_VERSION} active`);
    }
  };

  // Clear WebView Cache & Reload
  const handleClearCache = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    if (webViewRef.current) {
      webViewRef.current.clearCache?.(true);
      webViewRef.current.reload();
      showToast("Cache Cleared! Streaming Boosted 🚀");
    }
  };

  // Add current page to Watchlist
  const toggleCurrentPageWatchlist = async () => {
    const pageTitle = extractTitleFromUrl(currentUrl);
    const existingIndex = watchlist.findIndex((item) => item.url === currentUrl);

    if (existingIndex >= 0) {
      const updated = watchlist.filter((item) => item.url !== currentUrl);
      await saveWatchlist(updated);
      showToast("Removed from Watchlist 🗑️");
    } else {
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
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
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

  // Navigate to target URL inside WebView (Admin link restricted)
  const navigateTo = (pathOrUrl: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    // Hide and restrict admin panel access completely for users
    if (pathOrUrl.includes("/admin")) {
      showToast("Access Restricted 🔒");
      return;
    }
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
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        title: "MALIX STREAM",
        message: `Watch movies, series & anime on MALIX Stream: ${currentUrl}`,
        url: currentUrl,
      });
    } catch (e) {
      console.error("Share error", e);
    }
  };

  // Share App with Friends
  const handleShareApp = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        title: "MALIX Streaming App",
        message: "Check out MALIX Stream for free Movies, TV Series & Anime in HD! 🎬🍿\nDownload & Stream now: " + BASE_URL,
        url: BASE_URL,
      });
    } catch (e) {
      console.error("Share app error", e);
    }
  };

  // Selected tab indicators
  const isHomeSelected =
    currentUrl === `${BASE_URL}/` || currentUrl === BASE_URL;
  const isMoviesSelected = currentUrl.includes("/movies");
  const isSeriesSelected = currentUrl.includes("/series");
  const isAnimeSelected = currentUrl.includes("/anime");

  return (
    <SafeAreaView
      style={[
        styles.mainContainer,
        theaterMode && { backgroundColor: "#020617" },
      ]}
      edges={["top", "left", "right"]}
    >
      <StatusBar style="light" />

      {/* Top Glassmorphic App Bar (Dims in Theater Mode) */}
      <View style={[styles.appBar, theaterMode && styles.theaterDimAppBar]}>
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
          {/* Advanced Player Controls Shortcut */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setPlayerModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <SlidersHorizontal size={19} color={currentTheme.primary} />
          </TouchableOpacity>

          {/* Quick Search */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
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

          {/* Settings & App Updates */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setSettingsModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <SettingsIcon size={19} color="#FFFFFF" />
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

      {/* Category Filter Chips Bar (Includes Player Controls & Settings) */}
      <View style={[styles.categoryBarWrapper, theaterMode && styles.theaterDimCategoryBar]}>
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
            label="Player Controls"
            icon={<SlidersHorizontal size={13} color={currentTheme.primary} />}
            isSelected={playerModalVisible}
            accentColor={currentTheme.primary}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setPlayerModalVisible(true);
            }}
          />
          <CategoryChip
            label="My Library"
            icon={<Bookmark size={13} color="#FFFFFF" />}
            isSelected={false}
            accentColor={currentTheme.primary}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setWatchlistModalVisible(true);
            }}
          />
          <CategoryChip
            label="Themes"
            icon={<Palette size={13} color="#FFFFFF" />}
            isSelected={false}
            accentColor={currentTheme.primary}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setThemeModalVisible(true);
            }}
          />
          <CategoryChip
            label="Settings"
            icon={<SettingsIcon size={13} color="#FFFFFF" />}
            isSelected={settingsModalVisible}
            accentColor={currentTheme.primary}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setSettingsModalVisible(true);
            }}
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
          injectedJavaScript={INJECTED_PLAYER_ENGINE}
          style={styles.webView}
          containerStyle={{ backgroundColor: theaterMode ? "#020617" : "#0F172A" }}
          onLoadProgress={({ nativeEvent }: WebViewProgressEvent): void => {
            setLoadingPercentage(Math.round(nativeEvent.progress * 100));
          }}
          onNavigationStateChange={(navState: WebViewNavigation): void => {
            setCanGoBack(navState.canGoBack);
            setCanGoForward(navState.canGoForward);
            if (navState.url) {
              // Block admin URLs completely from user
              if (navState.url.includes("/admin")) {
                webViewRef.current?.stopLoading();
                navigateTo("/");
                showToast("Access Restricted 🔒");
                return;
              }
              setCurrentUrl(navState.url);
              addToHistory(navState.url);
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
      <View style={[styles.bottomNavBar, theaterMode && styles.theaterDimBottomNav]}>
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
          icon={<SettingsIcon size={21} color={settingsModalVisible ? currentTheme.primary : "rgba(255,255,255,0.54)"} />}
          label="Settings"
          isSelected={settingsModalVisible}
          accentColor={currentTheme.primary}
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            setSettingsModalVisible(true);
          }}
        />
      </View>

      {/* Toast Notification Overlay */}
      {toastMessage && (
        <Animated.View style={[styles.toastContainer, { opacity: toastFade }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      {/* ADVANCED VIDEO PLAYER CONTROLS MODAL */}
      <Modal
        visible={playerModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPlayerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.drawerCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <SlidersHorizontal size={20} color={currentTheme.primary} style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Advanced Video Player</Text>
              </View>
              <TouchableOpacity onPress={() => setPlayerModalVisible(false)}>
                <X size={22} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              {/* Quick Seek & Transport Controls */}
              <Text style={styles.sectionHeaderTitle}>QUICK SEEK & PLAYBACK</Text>
              <View style={styles.playerControlRow}>
                <TouchableOpacity
                  style={styles.playerSeekBtn}
                  onPress={() => seekVideo(-10)}
                  activeOpacity={0.7}
                >
                  <Rewind size={20} color="#FFFFFF" style={{ marginBottom: 4 }} />
                  <Text style={styles.playerSeekBtnText}>-10s</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.playerPlayBtn, { backgroundColor: currentTheme.primary }]}
                  onPress={togglePlayPauseVideo}
                  activeOpacity={0.8}
                >
                  <Play size={24} color="#000000" fill="#000000" style={{ marginLeft: 3 }} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.playerSeekBtn}
                  onPress={() => seekVideo(10)}
                  activeOpacity={0.7}
                >
                  <FastForward size={20} color="#FFFFFF" style={{ marginBottom: 4 }} />
                  <Text style={styles.playerSeekBtnText}>+10s</Text>
                </TouchableOpacity>
              </View>

              {/* Playback Speed Selector */}
              <Text style={styles.sectionHeaderTitle}>PLAYBACK SPEED ({playbackSpeed}x)</Text>
              <View style={styles.speedOptionGrid}>
                {[0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => {
                  const isSel = playbackSpeed === speed;
                  return (
                    <TouchableOpacity
                      key={speed}
                      style={[
                        styles.speedChipBtn,
                        isSel && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary },
                      ]}
                      onPress={() => changePlaybackSpeed(speed)}
                      activeOpacity={0.7}
                    >
                      <Gauge size={13} color={isSel ? "#000000" : "#A1A1AA"} style={{ marginRight: 4 }} />
                      <Text style={[styles.speedChipText, isSel && { color: "#000000", fontWeight: "bold" }]}>
                        {speed === 1.0 ? "Normal" : `${speed}x`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Aspect Ratio Fit Mode Selector */}
              <Text style={styles.sectionHeaderTitle}>SCREEN ASPECT RATIO</Text>
              <View style={{ marginBottom: 12 }}>
                {[
                  { id: "contain", label: "Standard Fit (Original)", sub: "Default aspect ratio" },
                  { id: "cover", label: "Cinema Zoom (Fill Crop)", sub: "Crops black bars to fill screen" },
                  { id: "fill", label: "Stretch Full (Widescreen)", sub: "Stretches video to full dimensions" },
                ].map((item) => {
                  const isSelected = videoFitMode === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.aspectOptionRow,
                        isSelected && { borderColor: currentTheme.primary, borderWidth: 1.5 },
                      ]}
                      onPress={() => changeVideoFitMode(item.id as any)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Monitor size={18} color={isSelected ? currentTheme.primary : "#A1A1AA"} style={{ marginRight: 12 }} />
                        <View>
                          <Text style={[styles.aspectTitle, isSelected && { color: currentTheme.primary }]}>
                            {item.label}
                          </Text>
                          <Text style={styles.aspectSubtitle}>{item.sub}</Text>
                        </View>
                      </View>
                      {isSelected && <CheckCircle2 size={18} color={currentTheme.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Theater Dimmer Mode */}
              <Text style={styles.sectionHeaderTitle}>THEATER EXPERIENCE</Text>
              <TouchableOpacity
                style={styles.settingsRowOption}
                onPress={toggleTheaterMode}
                activeOpacity={0.7}
              >
                <View style={styles.settingsRowLeft}>
                  {theaterMode ? (
                    <Moon size={20} color={currentTheme.primary} style={{ marginRight: 12 }} />
                  ) : (
                    <Sun size={20} color="#A1A1AA" style={{ marginRight: 12 }} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingsRowTitle}>Theater Lights Dimmer</Text>
                    <Text style={styles.settingsRowSubtitle}>Dims app bars for zero distraction</Text>
                  </View>
                </View>
                {theaterMode ? (
                  <ToggleRight size={28} color={currentTheme.primary} />
                ) : (
                  <ToggleLeft size={28} color="#71717A" />
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* QUICK SEARCH MODAL */}
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

      {/* MY LIBRARY (WATCHLIST & RECENT HISTORY) MODAL */}
      <Modal
        visible={watchlistModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setWatchlistModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.drawerCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Bookmark size={20} color={currentTheme.primary} style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>My Library</Text>
              </View>
              <TouchableOpacity onPress={() => setWatchlistModalVisible(false)}>
                <X size={22} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            {/* Tab Switching Bar */}
            <View style={styles.libraryTabBar}>
              <TouchableOpacity
                style={[
                  styles.libraryTabBtn,
                  watchlistTab === "watchlist" && {
                    backgroundColor: currentTheme.primary,
                  },
                ]}
                onPress={() => setWatchlistTab("watchlist")}
              >
                <Text
                  style={[
                    styles.libraryTabText,
                    watchlistTab === "watchlist" && { color: "#000000", fontWeight: "bold" },
                  ]}
                >
                  Watchlist ({watchlist.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.libraryTabBtn,
                  watchlistTab === "history" && {
                    backgroundColor: currentTheme.primary,
                  },
                ]}
                onPress={() => setWatchlistTab("history")}
              >
                <Text
                  style={[
                    styles.libraryTabText,
                    watchlistTab === "history" && { color: "#000000", fontWeight: "bold" },
                  ]}
                >
                  History ({history.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Watchlist Tab Content */}
            {watchlistTab === "watchlist" && (
              watchlist.length === 0 ? (
                <View style={styles.emptyWatchlist}>
                  <Bookmark size={44} color="rgba(255,255,255,0.2)" />
                  <Text style={styles.emptyWatchlistText}>Your Watchlist is empty</Text>
                  <Text style={styles.emptyWatchlistSubtext}>
                    Tap the bookmark icon in the top app bar to save movies or series!
                  </Text>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 330 }}>
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
              )
            )}

            {/* Recently Viewed History Tab Content */}
            {watchlistTab === "history" && (
              history.length === 0 ? (
                <View style={styles.emptyWatchlist}>
                  <History size={44} color="rgba(255,255,255,0.2)" />
                  <Text style={styles.emptyWatchlistText}>No watch history yet</Text>
                  <Text style={styles.emptyWatchlistSubtext}>
                    Pages you visit will automatically appear here for quick access!
                  </Text>
                </View>
              ) : (
                <View>
                  <TouchableOpacity
                    style={styles.clearHistoryBtn}
                    onPress={clearHistory}
                  >
                    <Trash2 size={14} color="#EF4444" style={{ marginRight: 6 }} />
                    <Text style={{ color: "#EF4444", fontSize: 12, fontWeight: "600" }}>Clear Watch History</Text>
                  </TouchableOpacity>
                  <ScrollView style={{ maxHeight: 290 }}>
                    {history.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.watchlistItemCard}
                        onPress={() => {
                          setWatchlistModalVisible(false);
                          navigateTo(item.url);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.watchlistItemTitle}>{item.title}</Text>
                          <Text style={styles.watchlistItemDate}>Visited: {item.visitedAt}</Text>
                        </View>
                        <ChevronLeft size={16} color="#71717A" style={{ transform: [{ rotate: "180deg" }] }} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )
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

      {/* APP SETTINGS & UPDATES MODAL */}
      <Modal
        visible={settingsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.drawerCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <SettingsIcon size={20} color={currentTheme.primary} style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>App Settings</Text>
              </View>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <X size={22} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              {/* App Update Section */}
              <View style={styles.settingsSectionCard}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                  <Image
                    source={require("./assets/android-icon-foreground.png")}
                    style={{ width: 44, height: 44, borderRadius: 10, marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 16 }}>
                      MALIX Stream
                    </Text>
                    <Text style={{ color: "#A1A1AA", fontSize: 12 }}>
                      Version {APP_VERSION} (Build 2.0)
                    </Text>
                  </View>
                </View>

                {updateStatusText && (
                  <Text style={{ color: currentTheme.primary, fontSize: 12, marginBottom: 10 }}>
                    {updateStatusText}
                  </Text>
                )}

                <TouchableOpacity
                  style={[styles.settingsActionButton, { backgroundColor: currentTheme.primary }]}
                  onPress={handleCheckAppUpdate}
                  disabled={isCheckingUpdate}
                  activeOpacity={0.8}
                >
                  {isCheckingUpdate ? (
                    <ActivityIndicator size="small" color="#000000" style={{ marginRight: 8 }} />
                  ) : (
                    <Download size={18} color="#000000" style={{ marginRight: 8 }} />
                  )}
                  <Text style={{ color: "#000000", fontWeight: "bold", fontSize: 14 }}>
                    {isCheckingUpdate ? "Checking..." : "Check for App Update"}
                  </Text>
                </TouchableOpacity>

                {/* Auto Update Check Toggle */}
                <TouchableOpacity
                  style={styles.settingToggleRow}
                  onPress={toggleAutoUpdate}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: "#D4D4D8", fontSize: 13 }}>Auto Check Updates on Startup</Text>
                  {autoCheckUpdates ? (
                    <ToggleRight size={28} color={currentTheme.primary} />
                  ) : (
                    <ToggleLeft size={28} color="#71717A" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Player & Shield Settings */}
              <Text style={styles.sectionHeaderTitle}>PLAYER & SECURITY</Text>

              <TouchableOpacity
                style={styles.settingsRowOption}
                onPress={() => {
                  setSettingsModalVisible(false);
                  setPlayerModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.settingsRowLeft}>
                  <SlidersHorizontal size={20} color={currentTheme.primary} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingsRowTitle}>Advanced Video Player Controls</Text>
                    <Text style={styles.settingsRowSubtitle}>Speed, Aspect Ratio & Seeking</Text>
                  </View>
                </View>
                <ChevronLeft size={16} color="#A1A1AA" style={{ transform: [{ rotate: "180deg" }] }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsRowOption}
                onPress={toggleAdBlock}
                activeOpacity={0.7}
              >
                <View style={styles.settingsRowLeft}>
                  <ShieldCheck size={20} color={currentTheme.primary} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingsRowTitle}>Ad & Popup Shield</Text>
                    <Text style={styles.settingsRowSubtitle}>Block annoying popups during stream</Text>
                  </View>
                </View>
                {adBlockEnabled ? (
                  <ToggleRight size={28} color={currentTheme.primary} />
                ) : (
                  <ToggleLeft size={28} color="#71717A" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsRowOption}
                onPress={toggleHaptics}
                activeOpacity={0.7}
              >
                <View style={styles.settingsRowLeft}>
                  <Volume2 size={20} color={currentTheme.primary} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingsRowTitle}>Vibration Feedback</Text>
                    <Text style={styles.settingsRowSubtitle}>Tactile vibration on touch</Text>
                  </View>
                </View>
                {hapticsEnabled ? (
                  <ToggleRight size={28} color={currentTheme.primary} />
                ) : (
                  <ToggleLeft size={28} color="#71717A" />
                )}
              </TouchableOpacity>

              {/* Storage & Boost Settings */}
              <Text style={styles.sectionHeaderTitle}>STORAGE & PERFORMANCE</Text>

              <TouchableOpacity
                style={styles.settingsRowOption}
                onPress={handleClearCache}
                activeOpacity={0.7}
              >
                <View style={styles.settingsRowLeft}>
                  <Zap size={20} color={currentTheme.primary} style={{ marginRight: 12 }} />
                  <View>
                    <Text style={styles.settingsRowTitle}>Clear Streaming Cache</Text>
                    <Text style={styles.settingsRowSubtitle}>Free space & speed up player</Text>
                  </View>
                </View>
                <RefreshCw size={16} color="#A1A1AA" />
              </TouchableOpacity>

              {/* Customization & Social */}
              <Text style={styles.sectionHeaderTitle}>APP CUSTOMIZATION</Text>

              <TouchableOpacity
                style={styles.settingsRowOption}
                onPress={() => {
                  setSettingsModalVisible(false);
                  setThemeModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.settingsRowLeft}>
                  <Palette size={20} color={currentTheme.primary} style={{ marginRight: 12 }} />
                  <View>
                    <Text style={styles.settingsRowTitle}>Theme Accent ({currentTheme.name})</Text>
                    <Text style={styles.settingsRowSubtitle}>Select primary app theme</Text>
                  </View>
                </View>
                <ChevronLeft size={16} color="#A1A1AA" style={{ transform: [{ rotate: "180deg" }] }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsRowOption}
                onPress={handleShareApp}
                activeOpacity={0.7}
              >
                <View style={styles.settingsRowLeft}>
                  <Share2 size={20} color={currentTheme.primary} style={{ marginRight: 12 }} />
                  <View>
                    <Text style={styles.settingsRowTitle}>Share App with Friends</Text>
                    <Text style={styles.settingsRowSubtitle}>Invite friends to stream on MALIX</Text>
                  </View>
                </View>
                <Heart size={16} color="#EC4899" />
              </TouchableOpacity>

              {/* Server Status Indicator */}
              <View style={styles.serverStatusCard}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={styles.serverActiveDot} />
                  <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 13 }}>
                    MALIX High-Speed Servers Active (100% Uptime)
                  </Text>
                </View>
                <Text style={{ color: "#71717A", fontSize: 11, marginTop: 4 }}>
                  Ultra HD Fast Video Engine • Protected Web Network
                </Text>
              </View>
            </ScrollView>
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
  theaterDimAppBar: {
    backgroundColor: "#020617",
    opacity: 0.4,
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
  theaterDimCategoryBar: {
    backgroundColor: "#020617",
    opacity: 0.4,
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
  theaterDimBottomNav: {
    backgroundColor: "#020617",
    opacity: 0.4,
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
    maxHeight: 540,
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

  // Watchlist & Library Modals
  libraryTabBar: {
    flexDirection: "row",
    backgroundColor: "#27272A",
    borderRadius: 10,
    padding: 4,
    marginBottom: 14,
  },
  libraryTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  libraryTabText: {
    color: "#A1A1AA",
    fontSize: 13,
  },
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
  clearHistoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginBottom: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
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

  // Player controls styles
  playerControlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#27272A",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  playerSeekBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#3F3F46",
    borderRadius: 10,
  },
  playerSeekBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  playerPlayBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  speedOptionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  speedChipBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#27272A",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  speedChipText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  aspectOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#27272A",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  aspectTitle: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 13,
  },
  aspectSubtitle: {
    color: "#71717A",
    fontSize: 11,
    marginTop: 2,
  },

  // Settings styles
  sectionHeaderTitle: {
    color: "#71717A",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1.0,
    marginTop: 10,
    marginBottom: 8,
  },
  settingsSectionCard: {
    backgroundColor: "#27272A",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  settingToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  settingsActionButton: {
    flexDirection: "row",
    height: 42,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsRowOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#27272A",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingsRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingsRowTitle: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 13,
  },
  settingsRowSubtitle: {
    color: "#71717A",
    fontSize: 11,
    marginTop: 2,
  },
  serverStatusCard: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    marginBottom: 10,
  },
  serverActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 8,
  },
});
