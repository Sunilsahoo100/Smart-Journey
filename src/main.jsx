import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "leaflet/dist/leaflet.css";
import "./index.css";
import App from "./App.jsx";
import Hero from "./components/custom/Hero";
import CreateTrip from "./components/component/create-trip";
import Viewtrip from "./view-trip/[tripId]";
import Mytrips from "./components/component/trip-history";
import { GOOGLE_CLIENT_ID } from "./context/AuthContext";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Hero /> },
      { path: "create-trip", element: <CreateTrip /> },
      { path: "view-trip/:tripId", element: <Viewtrip /> },
      { path: "my-trips", element: <Mytrips /> },
      { path: "*", element: <Hero /> },
    ],
  },
]);

const app = <RouterProvider router={router} />;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {GOOGLE_CLIENT_ID ? <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{app}</GoogleOAuthProvider> : app}
  </StrictMode>
);
