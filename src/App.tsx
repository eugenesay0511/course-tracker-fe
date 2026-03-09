import { useMemo, lazy, Suspense, useEffect } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  CssBaseline,
  ThemeProvider,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  PlayCircleFilled as PlayCourseIcon,
  LightMode,
  DarkMode,
} from "@mui/icons-material";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { createAppTheme } from "./theme";
const Dashboard = lazy(() =>
  import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const CoursePlayer = lazy(() =>
  import("./pages/CoursePlayer").then((m) => ({ default: m.CoursePlayer })),
);
const Settings = lazy(() =>
  import("./pages/Settings").then((m) => ({ default: m.Settings })),
);
const Bookmarks = lazy(() =>
  import("./pages/Bookmarks").then((m) => ({ default: m.Bookmarks })),
);
import { SearchBar } from "./components/SearchBar";
import { WelcomeScreen } from "./components/WelcomeScreen";
import {
  Settings as SettingsIcon,
  BookmarkBorder as BookmarkIcon,
} from "@mui/icons-material";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  rootHandleAtom,
  permissionStatusAtom,
  themeModeAtom,
  courseDataStateAtom,
  isStoreLoadedAtom,
} from "./store";
import { getStoredHandle } from "./utils/idb";

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      <Button
        color="inherit"
        startIcon={<DashboardIcon />}
        onClick={() => navigate("/")}
        sx={(theme) => ({
          borderRadius: 2,
          px: 2,
          bgcolor:
            location.pathname === "/"
              ? theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(0, 0, 0, 0.1)"
              : "transparent",
          color: location.pathname === "/" ? "white" : "inherit",
          fontWeight: location.pathname === "/" ? 700 : 500,
          "&:hover": {
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.25)"
                : "rgba(0, 0, 0, 0.2)",
          },
        })}
      >
        Dashboard
      </Button>
      <Button
        color="inherit"
        startIcon={<PlayCourseIcon />}
        onClick={() => navigate("/course")}
        sx={(theme) => ({
          borderRadius: 2,
          px: 2,
          bgcolor:
            location.pathname === "/course"
              ? theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(0, 0, 0, 0.1)"
              : "transparent",
          color: location.pathname === "/course" ? "white" : "inherit",
          fontWeight: location.pathname === "/course" ? 700 : 500,
          "&:hover": {
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.25)"
                : "rgba(0, 0, 0, 0.2)",
          },
        })}
      >
        Course Player
      </Button>
      <Button
        color="inherit"
        startIcon={<BookmarkIcon />}
        onClick={() => navigate("/bookmarks")}
        sx={(theme) => ({
          borderRadius: 2,
          px: 2,
          bgcolor:
            location.pathname === "/bookmarks"
              ? theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(0, 0, 0, 0.1)"
              : "transparent",
          color: location.pathname === "/bookmarks" ? "white" : "inherit",
          fontWeight: location.pathname === "/bookmarks" ? 700 : 500,
          "&:hover": {
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.25)"
                : "rgba(0, 0, 0, 0.2)",
          },
        })}
      >
        Bookmarks
      </Button>
    </Box>
  );
}

function ThemeToggle() {
  const [mode, setMode] = useAtom(themeModeAtom);
  const toggleTheme = () =>
    setMode((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <Tooltip title={`Switch to ${mode === "dark" ? "Light" : "Dark"} Mode`}>
      <IconButton onClick={toggleTheme} color="inherit">
        {mode === "dark" ? <LightMode /> : <DarkMode />}
      </IconButton>
    </Tooltip>
  );
}

function SettingsButton() {
  const [searchParams, setSearchParams] = useSearchParams();
  return (
    <Tooltip title="Settings">
      <IconButton
        color="inherit"
        onClick={() => {
          const nextParams = new URLSearchParams(searchParams);
          nextParams.set("settings", "true");
          setSearchParams(nextParams);
        }}
      >
        <SettingsIcon />
      </IconButton>
    </Tooltip>
  );
}
function AppContent() {
  const navigate = useNavigate();
  const isStoreLoaded = useAtomValue(isStoreLoadedAtom);
  const courseData = useAtomValue(courseDataStateAtom);
  const hasData = courseData && courseData.length > 0;
  const [searchParams, setSearchParams] = useSearchParams();
  const isSettingsOpen = searchParams.get("settings") === "true";

  if (!isStoreLoaded) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const closeSettings = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("settings");
    nextParams.delete("action");
    setSearchParams(nextParams);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      <AppBar position="static" elevation={1}>
        <Toolbar sx={{ justifyContent: "center" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flex: 1,
              cursor: "pointer",
            }}
            onClick={() => navigate("/")}
          >
            <Box
              component="img"
              src="/brain.svg"
              sx={{ width: 32, height: 32, mr: 2 }}
              alt="WatchFlow"
            />
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: "bold" }}
            >
              WatchFlow
            </Typography>
          </Box>
          {hasData && <Navigation />}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            {hasData && <SearchBar />}
            <ThemeToggle />
            <SettingsButton />
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flexGrow: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
          <Suspense
            fallback={
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <CircularProgress />
              </Box>
            }
          >
            {hasData ? (
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/course" element={<CoursePlayer />} />
                <Route path="/bookmarks" element={<Bookmarks />} />
              </Routes>
            ) : (
              <Routes>
                <Route path="*" element={<WelcomeScreen />} />
              </Routes>
            )}
            {isSettingsOpen && (
              <Settings open={isSettingsOpen} onClose={closeSettings} />
            )}
          </Suspense>
        </Box>
      </Box>
    </Box>
  );
}

function HandleInitializer() {
  const setRootHandle = useSetAtom(rootHandleAtom);
  const setPermissionStatus = useSetAtom(permissionStatusAtom);

  useEffect(() => {
    let mounted = true;
    const initHandle = async () => {
      try {
        const handle = await getStoredHandle();
        if (handle && mounted) {
          setRootHandle(handle);
          // @ts-ignore
          const status = await handle.queryPermission({ mode: "read" });
          if (mounted) setPermissionStatus(status);
        }
      } catch (err) {
        console.error("Failed to restore handle from IDB:", err);
      }
    };
    initHandle();
    return () => {
      mounted = false;
    };
  }, [setRootHandle, setPermissionStatus]);

  return null;
}

function App() {
  const [mode] = useAtom(themeModeAtom);
  const currentTheme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <HandleInitializer />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
