import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ToastProvider } from "./components/Toast";
import { useEffect } from "react";
import { loadRecords } from "./recordsStore";

export default function App() {
  useEffect(() => {
    loadRecords();
  }, []);

  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}
