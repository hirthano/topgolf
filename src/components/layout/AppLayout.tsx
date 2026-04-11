import { Outlet } from "react-router-dom"
import { AppSidebar } from "./AppSidebar"
import { TopHeader } from "./TopHeader"

export function AppLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-std">
      <AppSidebar />
      <div className="relative flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
        <TopHeader />
        <main className="flex-1 min-h-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
