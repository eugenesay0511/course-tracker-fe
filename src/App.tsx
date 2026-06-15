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
  LibraryBooks as LibraryIcon,
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
  import("./pages/Dashboard").then((m) => ({ default: m.Dashboard }))
);
const CoursePlayer = lazy(() =>
  import("./pages/CoursePlayer").then((m) => ({ default: m.CoursePlayer }))
);
const Settings = lazy(() =>
  import("./pages/Settings").then((m) => ({ default: m.Settings }))
);
const Bookmarks = lazy(() =>
  import("./pages/Bookmarks").then((m) => ({ default: m.Bookmarks }))
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
  activeCourseIdAtom,
  performMigrationAtom,
  loadCourseDataAtom,
} from "./store";
import { getStoredHandle } from "./utils/idb";

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeCourseId = useAtomValue(activeCourseIdAtom);
  const isLibrary = !activeCourseId;

  const btnStyle = (isActive: boolean) => (theme: any) => ({
    borderRadius: 2,
    px: 2,
    bgcolor: isActive
      ? theme.palette.mode === "dark"
        ? "rgba(255, 255, 255, 0.15)"
        : "rgba(0, 0, 0, 0.1)"
      : "transparent",
    color: isActive ? "white" : "inherit",
    fontWeight: isActive ? 700 : 500,
    "&:hover": {
      bgcolor:
        theme.palette.mode === "dark"
          ? "rgba(255, 255, 255, 0.25)"
          : "rgba(0, 0, 0, 0.2)",
    },
  });

  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      <Button
        color="inherit"
        startIcon={<DashboardIcon />}
        onClick={() => navigate("/")}
        disabled={isLibrary}
        sx={btnStyle(!isLibrary && location.pathname === "/")}
      >
        Dashboard
      </Button>
      <Button
        color="inherit"
        startIcon={<PlayCourseIcon />}
        onClick={() => navigate("/course")}
        disabled={isLibrary}
        sx={btnStyle(!isLibrary && location.pathname === "/course")}
      >
        Player
      </Button>
      <Button
        color="inherit"
        startIcon={<BookmarkIcon />}
        onClick={() => navigate("/bookmarks")}
        disabled={isLibrary}
        sx={btnStyle(!isLibrary && location.pathname === "/bookmarks")}
      >
        Bookmarks
      </Button>
    </Box>
  );
}


function AppContent() {
  const navigate = useNavigate();
  const isStoreLoaded = useAtomValue(isStoreLoadedAtom);
  const courseData = useAtomValue(courseDataStateAtom);
  const [activeCourseId, setActiveCourseId] = useAtom(activeCourseIdAtom);
  const hasData = activeCourseId && courseData && courseData.length > 0;
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
        <Toolbar
          sx={{
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            py: { xs: 1.5, md: 0 },
            gap: { xs: 1.5, md: 0 },
            minHeight: { xs: "auto", md: 64 },
          }}
        >
          {/* Logo and Actions container for Mobile layout */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Logo */}
            <Box
              sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
              onClick={() => {
                setActiveCourseId(null);
                navigate("/");
              }}
            >
              <Box
                component="img"
                src="/brain.svg"
                sx={{ width: 28, height: 28, mr: 1 }}
                alt="WatchFlow"
              />
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                WatchFlow
              </Typography>
            </Box>

            {/* Actions */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Tooltip title="Library">
                <IconButton
                  color="inherit"
                  onClick={() => {
                    setActiveCourseId(null);
                    navigate("/");
                  }}
                  size="small"
                  sx={{
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <LibraryIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {hasData && <SearchBar />}
              <Tooltip title="Settings">
                <IconButton
                  color="inherit"
                  size="small"
                  onClick={() => {
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.set("settings", "true");
                    setSearchParams(nextParams);
                  }}
                >
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Desktop Layout - Left Logo */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              flex: 1,
              cursor: "pointer",
            }}
            onClick={() => {
              setActiveCourseId(null);
              navigate("/");
            }}
          >
            <Box
              component="img"
              src="/brain.svg"
              sx={{ width: 32, height: 32, mr: 2 }}
              alt="WatchFlow"
            />
            <Typography variant="h6" component="div" sx={{ fontWeight: "bold" }}>
              WatchFlow
            </Typography>
          </Box>

          {/* Navigation (Shows in center on Desktop, full width on Mobile) */}
          <Box sx={{ width: { xs: "100%", md: "auto" }, display: "flex", justifyContent: "center" }}>
            <Navigation />
          </Box>

          {/* Desktop Layout - Right Actions */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              flex: 1,
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <Button
              variant="text"
              color="inherit"
              startIcon={<LibraryIcon />}
              onClick={() => {
                setActiveCourseId(null);
                navigate("/");
              }}
              sx={{
                mr: 2,
                px: 2,
                py: 0.5,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(255, 255, 255, 0.12)",
                transition: "all 0.2s ease-in-out",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                "&:hover": {
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.15)"
                      : "rgba(0, 0, 0, 0.1)",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                },
                "&:active": {
                  transform: "translateY(0)",
                },
                display: "flex",
                alignItems: "center",
              }}
            >
              Library
            </Button>
            {hasData && <SearchBar />}
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

function StoreInitializer() {
  const setRootHandle = useSetAtom(rootHandleAtom);
  const setPermissionStatus = useSetAtom(permissionStatusAtom);
  const activeCourseId = useAtomValue(activeCourseIdAtom);
  const performMigration = useSetAtom(performMigrationAtom);
  const loadCourseData = useSetAtom(loadCourseDataAtom);

  // 1. Initial Migration Check
  useEffect(() => {
    performMigration();
  }, [performMigration]);

  // 2. Load data when activeCourseId changes
  useEffect(() => {
    loadCourseData();
  }, [activeCourseId, loadCourseData]);

  // 3. Handle Initializer (Course Specific)
  useEffect(() => {
    if (!activeCourseId) {
      setRootHandle(null);
      setPermissionStatus(null);
      return;
    }

    let mounted = true;
    const initHandle = async () => {
      try {
        const handle = await getStoredHandle(activeCourseId);
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
  }, [activeCourseId, setRootHandle, setPermissionStatus]);

  return null;
}

function App() {
  const [mode] = useAtom(themeModeAtom);
  const currentTheme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <StoreInitializer />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

