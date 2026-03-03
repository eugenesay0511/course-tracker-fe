import { createTheme } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material/styles';

export const createAppTheme = (mode: PaletteMode) => createTheme({
  palette: {
    mode,
    ...(mode === 'dark' ? {
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
    } : {
      primary: {
        main: '#2563eb', // Deeper blue for light mode readability
        light: '#3b82f6',
        dark: '#1d4ed8',
      },
      secondary: {
        main: '#059669', // Darker emerald for contrast
      },
      background: {
        default: '#f8fafc', // Very soft light gray/blue background
        paper: '#ffffff', // Clean white for cards
      },
    }),
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
          backgroundColor: mode === 'dark' ? '#111827' : '#ffffff',
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
          borderBottom: mode === 'dark' ? '1px solid #1f2937' : '1px solid #e2e8f0', 
        }
      }
    },
    MuiPaper: {
       styleOverrides: {
          root: {
             backgroundImage: 'none',
          }
       }
    }
  }
});
