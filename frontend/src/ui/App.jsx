import { Navigate, Route, Routes } from "react-router-dom"

import { useAuth } from "../state/auth/useAuth.js"
import { routes } from "./routes.js"
import { AppShell } from "./shell/AppShell.jsx"
import { DashboardPage }  from "./pages/DashboardPage.jsx"
import { EmployeesPage }  from "./pages/EmployeesPage.jsx"
import { LeavesPage }     from "./pages/LeavesPage.jsx"
import { LoginPage }      from "./pages/LoginPage.jsx"
import { PayrollPage }    from "./pages/PayrollPage.jsx"
import { ReportsPage }    from "./pages/ReportsPage.jsx"
import { SchedulingPage } from "./pages/SchedulingPage.jsx"
import { TasksPage }      from "./pages/TasksPage.jsx"
import { TimePage }       from "./pages/TimePage.jsx"

export function App() {
  const { isReady, user } = useAuth()

  if (!isReady) return null

  return (
    <Routes>
      <Route path={routes.login} element={user ? <Navigate to={routes.dashboard} replace /> : <LoginPage />} />
      <Route element={user ? <AppShell /> : <Navigate to={routes.login} replace />}>
        <Route path={routes.dashboard}  element={<DashboardPage />} />
        <Route path={routes.time}        element={<TimePage />} />
        <Route path={routes.tasks}       element={<TasksPage />} />
        <Route path={routes.leaves}      element={<LeavesPage />} />
        <Route path={routes.payroll}     element={<PayrollPage />} />
        <Route path={routes.scheduling}  element={<SchedulingPage />} />
        <Route path={routes.employees}   element={<EmployeesPage />} />
        <Route path={routes.reports}     element={<ReportsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={routes.dashboard} replace />} />
    </Routes>
  )
}

