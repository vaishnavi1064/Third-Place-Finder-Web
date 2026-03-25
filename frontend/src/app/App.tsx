import { RouterProvider } from 'react-router';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { LoadingScreen } from './components/LoadingScreen';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LoadingScreen />
        <RouterProvider router={router} />
      </ThemeProvider>
    </AuthProvider>
  );
}
