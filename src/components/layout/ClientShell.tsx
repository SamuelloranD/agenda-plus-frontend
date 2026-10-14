import { useEffect, useRef, useState, type ReactNode, type TouchEvent } from "react";
import { ClientSidebar } from "./ClientSidebar";
import { Header } from "./Header";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

interface ClientShellProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function ClientShell({ children, title, subtitle }: ClientShellProps) {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const closeSidebar = () => setSidebarOpen(false);

  function handleTouchStart(event: TouchEvent) {
    if (sidebarOpen)
      touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent) {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (
      sidebarOpen &&
      start !== null &&
      start - (event.changedTouches[0]?.clientX ?? start) > 50
    )
      closeSidebar();
  }

  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSidebar();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  return (
    <div
      className={`client-shell${sidebarOpen ? " sidebar-open" : ""}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <ClientSidebar />
      {sidebarOpen && (
        <button
          className="client-sidebar-overlay client-sidebar-overlay--opaque"
          data-testid="client-sidebar-overlay"
          type="button"
          aria-label="Fechar navegação"
          onClick={closeSidebar}
        />
      )}
      <main className="client-main" aria-label={title}>
        <Header
          title={title}
          subtitle={subtitle}
          sidebarOpen={sidebarOpen}
          sidebarId="client-sidebar"
          onMenuClick={sidebarOpen ? closeSidebar : () => setSidebarOpen(true)}
          right={
            title === "Novo agendamento" &&
            user && (
              <details className="client-account">
                <summary>
                  <span className="client-account__avatar" aria-hidden="true">
                    {user.nome
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                  <span>Olá, {user.nome.split(" ")[0]}</span>
                  <span aria-hidden="true"></span>
                </summary>
                <div>
                  <span>{user.nome}</span>
                  <button
                    type="button"
                    onClick={() => {
                      clearSession();
                      navigate("/login", { replace: true });
                    }}
                  >
                    Sair
                  </button>
                </div>
              </details>
            )
          }
        />
        {children}
      </main>
    </div>
  );
}
