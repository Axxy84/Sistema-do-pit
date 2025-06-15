import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#d32f2f',
    primaryContainer: '#ffebee',
    secondary: '#424242',
    secondaryContainer: '#f5f5f5',
    tertiary: '#ff5722',
    error: '#f44336',
    errorContainer: '#ffebee',
    background: '#fafafa',
    surface: '#ffffff',
    surfaceVariant: '#f5f5f5',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onBackground: '#212121',
    onSurface: '#212121',
    outline: '#e0e0e0',
    shadow: '#000000',
    inversePrimary: '#ffcdd2',
    inverseSurface: '#303030',
    inverseOnSurface: '#fafafa',
    // Cores customizadas para status
    success: '#4caf50',
    warning: '#ff9800',
    info: '#2196f3',
    pending: '#ff9800',
    preparing: '#2196f3',
    ready: '#4caf50',
    outForDelivery: '#9c27b0',
    delivered: '#8bc34a',
    cancelled: '#f44336'
  },
  // Configurações de fonte
  fonts: {
    ...MD3LightTheme.fonts,
    default: {
      fontFamily: 'System',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100',
    }
  },
  // Configurações de espaçamento
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  // Configurações de border radius
  roundness: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999
  },
  // Configurações de sombra
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    }
  },
  // Configurações de tamanhos
  sizes: {
    header: 56,
    tabBar: 60,
    button: 48,
    input: 56,
    card: 120,
    avatar: 40,
    iconSmall: 16,
    iconMedium: 24,
    iconLarge: 32
  }
};

// Tema escuro (opcional para futuras implementações)
export const darkTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    primary: '#f44336',
    background: '#121212',
    surface: '#1e1e1e',
    surfaceVariant: '#2e2e2e',
    onBackground: '#ffffff',
    onSurface: '#ffffff',
    outline: '#4a4a4a',
  }
};

// Estilos globais comuns
export const globalStyles = {
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  paddedContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    ...theme.shadows.medium,
  },
  button: {
    height: theme.sizes.button,
    borderRadius: theme.roundness.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    height: theme.sizes.input,
    borderRadius: theme.roundness.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  text: {
    color: theme.colors.onSurface,
  },
  textSecondary: {
    color: theme.colors.onSurfaceVariant,
  },
  textCenter: {
    textAlign: 'center',
  },
  textBold: {
    fontWeight: 'bold',
  },
  marginBottom: {
    marginBottom: theme.spacing.md,
  },
  marginTop: {
    marginTop: theme.spacing.md,
  },
  paddingVertical: {
    paddingVertical: theme.spacing.md,
  },
  paddingHorizontal: {
    paddingHorizontal: theme.spacing.md,
  }
};