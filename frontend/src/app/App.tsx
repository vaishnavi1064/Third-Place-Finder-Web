import { RouterProvider } from 'react-router';
import { ThemeProvider } from './context/ThemeContext';
import { LoadingScreen } from './components/LoadingScreen';
import { router } from './routes';

export default function App() {
  return (
    <ThemeProvider>
      <LoadingScreen />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}