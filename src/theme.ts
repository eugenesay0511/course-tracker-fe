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
        main: '#4f46e5', // Royal Indigo
        light: '#6366f1',
        dark: '#3730a3',
      },
      secondary: {
        main: '#0ea5e9', // Vibrant Sky Blue
      },
      background: {
        default: '#f8fafc', // Soft Slate 50 background
        paper: '#ffffff', // Clean white card background
      },
    }),
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '2rem',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 800,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 800,
      letterSpacing: '-0.025em',
    },
    h4: {
      fontWeight: 800,
      letterSpacing: '-0.025em',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 700,
      letterSpacing: '-0.015em',
    },
    subtitle1: {
      fontWeight: 600,
    },
    subtitle2: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.975rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '10px',
          fontWeight: 700,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          background: mode === 'dark' 
            ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
            : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          color: '#ffffff',
          '&:hover': {
            background: mode === 'dark'
              ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
              : 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
          }
        }
      }
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'dark' ? '#111827' : '#ffffff',
          border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #e2e8f0',
          boxShadow: 'none',
          borderRadius: '12px',
          margin: '8px 0',
          overflow: 'hidden',
          '&:before': {
            display: 'none',
          },
          '&:first-of-type': {
            borderRadius: '12px',
          },
          '&:last-of-type': {
            borderRadius: '12px',
          },
          '&$expanded': {
            margin: '8px 0',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          borderBottom: 'none',
          padding: '0 16px',
          minHeight: '48px',
          '&.Mui-expanded': {
            minHeight: '48px',
            borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #e2e8f0',
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: 'none',
          boxShadow: 'none',
          borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #e2e8f0',
        }
      }
    },
    MuiPaper: {
       styleOverrides: {
          root: {
             backgroundImage: 'none',
             borderRadius: '16px',
             border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #e2e8f0',
             boxShadow: mode === 'dark' 
               ? '0 10px 30px -10px rgba(0, 0, 0, 0.7)' 
               : '0 10px 30px -10px rgba(79, 70, 229, 0.06)',
          }
       }
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: mode === 'dark' ? '#374151 #0b0f19' : '#cbd5e1 #f8fafc',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            backgroundColor: mode === 'dark' ? '#374151' : '#cbd5e1',
            borderRadius: '10px',
            border: '2px solid transparent',
            backgroundClip: 'padding-box',
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: mode === 'dark' ? '#4b5563' : '#94a3b8',
          },
        },
      },
    },
  },
});
