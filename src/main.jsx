import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "./index.css";
import App from "./App.jsx";
import Hero from "./components/custom/Hero";
import CreateTrip from "./components/component/create-trip";
import Viewtrip from "./view-trip/[tripId]";
import Mytrips from "./components/component/trip-history";

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

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
