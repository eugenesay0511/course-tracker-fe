import {
  useState,
  useMemo,
  createContext,
  useContext,
  lazy,
  Suspense,
} from "react";
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
} from "react-router-dom";
import type { PaletteMode } from "@mui/material";

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
import { CourseProgressProvider } from "./context/CourseProgressContext";
import { useCourseProgress } from "./hooks/useCourseProgress";

export const ThemeModeContext = createContext({
  toggleTheme: () => {},
  mode: "dark" as PaletteMode,
});

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
  const { mode, toggleTheme } = useContext(ThemeModeContext);
  return (
    <Tooltip title={`Switch to ${mode === "dark" ? "Light" : "Dark"} Mode`}>
      <IconButton onClick={toggleTheme} color="inherit">
        {mode === "dark" ? <LightMode /> : <DarkMode />}
      </IconButton>
    </Tooltip>
  );
}

function SettingsButton() {
  const navigate = useNavigate();
  return (
    <Tooltip title="Settings">
      <IconButton color="inherit" onClick={() => navigate("/settings")}>
        <SettingsIcon />
      </IconButton>
    </Tooltip>
  );
}
function AppContent() {
  const { courseData } = useCourseProgress();
  const hasData = courseData && courseData.length > 0;

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
          <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
            <Box
              component="img"
              src="/brain.svg"
              sx={{ width: 32, height: 32, mr: 2 }}
              alt="Big Brain"
            />
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: "bold" }}
            >
              Big Brain
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
            <SettingsButton />
            <ThemeToggle />
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
                <Route path="/settings" element={<Settings />} />
              </Routes>
            ) : (
              <Routes>
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<WelcomeScreen />} />
              </Routes>
            )}
          </Suspense>
        </Box>
      </Box>
    </Box>
  );
}
function App() {
  const [mode, setMode] = useState<PaletteMode>(() => {
    const saved = localStorage.getItem("course-tracker-theme-mode");
    return (saved as PaletteMode) || "dark";
  });

  const toggleTheme = () => {
    setMode((prev) => {
      const newMode = prev === "dark" ? "light" : "dark";
      localStorage.setItem("course-tracker-theme-mode", newMode);
      return newMode;
    });
  };

  const currentTheme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={currentTheme}>
        <CssBaseline />
        <CourseProgressProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </CourseProgressProvider>
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export default App;
