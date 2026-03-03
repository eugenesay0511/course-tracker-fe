import { Box, AppBar, Toolbar, Typography, CssBaseline, ThemeProvider, Button } from '@mui/material';
import { School as SchoolIcon, Dashboard as DashboardIcon, PlayCircleFilled as PlayCourseIcon } from '@mui/icons-material';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

import theme from './theme';
import { Dashboard } from './pages/Dashboard';
import { CoursePlayer } from './pages/CoursePlayer';
import { Settings } from './pages/Settings';
import { Settings as SettingsIcon } from '@mui/icons-material';

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        color="inherit"
        startIcon={<DashboardIcon />}
        onClick={() => navigate('/')}
        sx={{
          borderRadius: 2,
          px: 2,
          bgcolor: location.pathname === '/' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          color: location.pathname === '/' ? 'primary.light' : 'inherit',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.2)',
          }
        }}
      >
        Dashboard
      </Button>
      <Button
        color="inherit"
        startIcon={<PlayCourseIcon />}
        onClick={() => navigate('/course')}
        sx={{
          borderRadius: 2,
          px: 2,
          bgcolor: location.pathname === '/course' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          color: location.pathname === '/course' ? 'primary.light' : 'inherit',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.2)',
          }
        }}
      >
        Course Player
      </Button>
      <Button
        color="inherit"
        startIcon={<SettingsIcon />}
        onClick={() => navigate('/settings')}
        sx={{
          borderRadius: 2,
          px: 2,
          bgcolor: location.pathname === '/settings' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          color: location.pathname === '/settings' ? 'primary.light' : 'inherit',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.2)',
          }
        }}
      >
        Settings
      </Button>
    </Box>
  );
}

import { CourseProgressProvider } from './context/CourseProgressContext';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CourseProgressProvider>
        <BrowserRouter>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            
            <AppBar position="static" elevation={1}>
              <Toolbar>
                <SchoolIcon sx={{ mr: 2 }} />
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                  Course Tracker
                </Typography>
                <Navigation />
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
  );
}

export default App;
