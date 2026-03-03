import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6', // Premium vibrant blue
      light: '#60a5fa',
      dark: '#2563eb',
    },
    secondary: {
      main: '#10b981', // Elegant emerald green
    },
    background: {
      default: '#0b0f19', // Deep dark blue/gray
      paper: '#111827', // Lighter dark blue/gray for cards
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    }
  },
  components: {
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: '#111827', // Match the new paper color
          '&:before': {
            display: 'none',
          },
          '&$expanded': {
            marginTop: 0,
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #1f2937', // A softer border color
        }
      }
    }
  }
});

export default theme;
