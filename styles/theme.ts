export interface Theme {
  primary: string;
  primaryLight: string;
  secondary: string;
  warning: string;
  success: string;
  white: string;
  text: string;
  textLight: string;
  background: string;
  backgroundLight: string;
  neutral: string;
  neutralLight: string;
}

const themeCommon = {
  primary: '#4A90D9', // Water blue
  primaryLight: '#7AB8F5',
  secondary: '#9B59B6', // Sleep purple
  warning: '#FF6B6B',
  success: '#2ECC71',
  white: '#fff',
};

export const darkTheme: Theme = {
  ...themeCommon,
  text: '#ECEDEE',
  textLight: '#fff',
  background: '#151718',
  backgroundLight: '#2D2D2D',
  neutral: '#3D3D3D',
  neutralLight: '#1c1c1c',
};

export const lightTheme: Theme = {
  ...themeCommon,
  text: '#11181C',
  textLight: '#687076',
  background: '#F5F5F5',
  backgroundLight: '#fff',
  neutral: '#E0E0E0',
  neutralLight: '#F0F0F0',
};
