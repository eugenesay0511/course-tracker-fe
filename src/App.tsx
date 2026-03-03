import { useState, useMemo, createContext, useContext } from 'react';
import { Box, AppBar, Toolbar, Typography, CssBaseline, ThemeProvider, Button, IconButton, Tooltip } from '@mui/material';
import { School as SchoolIcon, Dashboard as DashboardIcon, PlayCircleFilled as PlayCourseIcon, LightMode, DarkMode } from '@mui/icons-material';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import type { PaletteMode } from '@mui/material';

import { createAppTheme } from './theme';
import { Dashboard } from './pages/Dashboard';
import { CoursePlayer } from './pages/CoursePlayer';
import { Settings } from './pages/Settings';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { CourseProgressProvider } from './context/CourseProgressContext';

export const ThemeModeContext = createContext({ toggleTheme: () => {}, mode: 'dark' as PaletteMode });

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        color="inherit"
        startIcon={<DashboardIcon />}
        onClick={() => navigate('/')}
        sx={(theme) => ({
          borderRadius: 2,
          px: 2,
          bgcolor: location.pathname === '/' ? (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)') : 'transparent',
          color: location.pathname === '/' ? 'white' : 'inherit',
          fontWeight: location.pathname === '/' ? 700 : 500,
          '&:hover': {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)',
          }
        })}
      >
        Dashboard
      </Button>
      <Button
        color="inherit"
        startIcon={<PlayCourseIcon />}
        onClick={() => navigate('/course')}
        sx={(theme) => ({
          borderRadius: 2,
          px: 2,
          bgcolor: location.pathname === '/course' ? (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)') : 'transparent',
          color: location.pathname === '/course' ? 'white' : 'inherit',
          fontWeight: location.pathname === '/course' ? 700 : 500,
          '&:hover': {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)',
          }
        })}
      >
        Course Player
      </Button>
      <Button
        color="inherit"
        startIcon={<SettingsIcon />}
        onClick={() => navigate('/settings')}
        sx={(theme) => ({
          borderRadius: 2,
          px: 2,
          bgcolor: location.pathname === '/settings' ? (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)') : 'transparent',
          color: location.pathname === '/settings' ? 'white' : 'inherit',
          fontWeight: location.pathname === '/settings' ? 700 : 500,
          '&:hover': {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)',
          }
        })}
      >
        Settings
      </Button>
    </Box>
  );
}

function ThemeToggle() {
  const { mode, toggleTheme } = useContext(ThemeModeContext);
  return (
    <Tooltip title={`Switch to ${mode === 'dark' ? 'Light' : 'Dark'} Mode`}>
      <IconButton onClick={toggleTheme} color="inherit">
        {mode === 'dark' ? <LightMode /> : <DarkMode />}
      </IconButton>
    </Tooltip>
  );
}

function App() {
  const [mode, setMode] = useState<PaletteMode>(() => {
    const saved = localStorage.getItem('course-tracker-theme-mode');
    return (saved as PaletteMode) || 'dark';
  });

  const toggleTheme = () => {
    setMode((prev) => {
      const newMode = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('course-tracker-theme-mode', newMode);
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
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
              
              <AppBar position="static" elevation={1}>
                <Toolbar sx={{ justifyContent: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <SchoolIcon sx={{ mr: 2 }} />
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                      Course Tracker
                    </Typography>
                  </Box>
                  <Navigation />
                  <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <ThemeToggle />
                  </Box>
                </Toolbar>
              </AppBar>

              <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/course" element={<CoursePlayer />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </Box>
              </Box>

            </Box>
          </BrowserRouter>
        </CourseProgressProvider>
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export default App;
