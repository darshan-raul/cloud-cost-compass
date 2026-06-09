import { Refine } from "@refinedev/core";
import { useNotificationProvider, ErrorComponent } from "@refinedev/core";
import { routerProvider, NavigateToResource } from "@refinedev/react-router-v6";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { authProvider } from "@/auth/authProvider";
import { mcpDataProvider, ragDataProvider, alertsDataProvider } from "@/providers/dataProvider";
import { AuthGuard, RoleGuard } from "@/auth/guards";
import { AppLayout } from "@/components/layout/AppLayout";
import { OverviewPage } from "@/pages/overview";
import { CostsPage } from "@/pages/costs";
import { FinOpsPage } from "@/pages/finops";
import { InventoryPage } from "@/pages/inventory";
import { SecurityPage } from "@/pages/security";
import { ScaPage } from "@/pages/sca";
import { CompliancePage } from "@/pages/compliance";
import { AlertsPage } from "@/pages/alerts";
import { ChatPage } from "@/pages/chat";
import { SettingsPage } from "@/pages/settings";
import { LoginPage } from "@/pages/login";

export default function App() {
  return (
    <BrowserRouter>
      <Refine
        authProvider={authProvider}
        dataProvider={{
          default: mcpDataProvider,
          mcp: mcpDataProvider,
          rag: ragDataProvider,
          alerts: alertsDataProvider,
        }}
        routerProvider={routerProvider}
        notificationProvider={useNotificationProvider}
        resources={[
          { name: "overview", list: "/" },
          { name: "costs", list: "/costs" },
          { name: "finops", list: "/finops" },
          { name: "inventory", list: "/inventory" },
          { name: "security", list: "/security" },
          { name: "sca", list: "/sca" },
          { name: "compliance", list: "/compliance" },
          { name: "alerts", list: "/alerts" },
          { name: "chat", list: "/chat" },
          { name: "settings", list: "/settings" },
        ]}
        options={{ syncWithLocation: true, warnWhenUnsavedChanges: true }}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<AuthGuard />}>
            <Route element={<AppLayout />}>
              <Route index element={<OverviewPage />} />
              <Route path="/costs" element={<CostsPage />} />
              <Route path="/finops" element={<FinOpsPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/chat" element={<ChatPage />} />

              <Route element={<RoleGuard min="operator" />}>
                <Route path="/security" element={<SecurityPage />} />
                <Route path="/sca" element={<ScaPage />} />
                <Route path="/compliance" element={<CompliancePage />} />
                <Route path="/alerts" element={<AlertsPage />} />
              </Route>

              <Route element={<RoleGuard min="admin" />}>
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              <Route path="*" element={<ErrorComponent />} />
            </Route>
          </Route>
        </Routes>
      </Refine>
    </BrowserRouter>
  );
}
