import { createBrowserRouter } from "react-router";
import { MainLayout } from "./layouts/MainLayout";
import { LoginPage } from "./pages/LoginPage";
import { UserSettingsPage } from "./pages/UserSettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: MainLayout,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/settings",
    Component: UserSettingsPage,
  },
]);
