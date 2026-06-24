import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { NewClaim } from "./pages/NewClaim";
import { ClaimDetails } from "./pages/ClaimDetails";
import { ClaimsHistory } from "./pages/ClaimsHistory";
import { StoreDirectory } from "./pages/StoreDirectory";
import { Reports } from "./pages/Reports";
import { Records } from "./pages/Records";
import { StoreConformity } from "./pages/StoreConformity";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    element: <Layout />,
    children: [
      { path: "dashboard", Component: Dashboard },
      { path: "novo-sinistro", Component: NewClaim },
      { path: "sinistro/:id", Component: ClaimDetails },
      { path: "historico", Component: ClaimsHistory },
      { path: "lojistas", Component: StoreDirectory },
      { path: "relatorios", Component: Reports },
      { path: "registros", Component: Records },
      { path: "conformidade", Component: StoreConformity },
    ],
  },
]);