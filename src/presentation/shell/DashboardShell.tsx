import "./shell.css";
// Served from public/ so dev and production resolve the same URL.
const logoUrl = "/vpc-logo.png";
import { PanelSlot } from "./PanelSlot";
import { SLOT_TITLES, type DashboardProvider } from "./provider";
import { useState } from "react";
import { canView, permittedPanels } from "../../application/access";
import { recordView } from "../../application/audit";
import { AUDIT_VIEW_ID, type AuditLog, type Role } from "../../domain";
import { AuditViewContainer } from "../audit/AuditView";
import { RoleSwitcher } from "../access/RoleSwitcher";

export interface DashboardShellProps {
  readonly provider: DashboardProvider;
  readonly role: Role;
  readonly onRoleChange?: (role: Role) => void;
  readonly auditLog?: AuditLog;
}

export function DashboardShell({
  provider,
  role,
  onRoleChange,
  auditLog,
}: DashboardShellProps) {
  const [auditOpen, setAuditOpen] = useState(false);
  const showAudit = canView(role, AUDIT_VIEW_ID);
  const panels = permittedPanels(role);
  return (
    <div
      style={{
        background: "var(--white)",
        color: "var(--ink)",
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-4)",
          padding: "var(--space-4) clamp(20px, 4vw, 48px)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <h1 style={{ margin: 0, lineHeight: 0 }}>
          <img
            src={logoUrl}
            alt="Vancouver Psychology Centre"
            height={53}
            style={{ height: 53, width: "auto" }}
          />
        </h1>
        <nav aria-label="Dashboard sections">
          <ul
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--space-8)",
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}
          >
            {panels.map((id) => (
              <li key={id}>
                <a
                  className="dashboard-nav-link"
                  href={`#slot-${id}-title`}
                >
                  {SLOT_TITLES[id]}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        {showAudit && auditLog && (
          <button
            type="button"
            className="vpc-btn vpc-btn-ghost vpc-btn-small"
            onClick={() => {
              if (!auditOpen) recordView(auditLog, role, AUDIT_VIEW_ID);
              setAuditOpen(true);
            }}
          >
            View audit log
          </button>
        )}
        <RoleSwitcher role={role} onRoleChange={onRoleChange} />
      </header>
      <main
        style={{
          maxWidth: "var(--max-width)",
          margin: "0 auto",
          padding: "var(--space-8) clamp(20px, 4vw, 48px)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--space-6)",
        }}
      >
        {panels.map((id) => (
          <PanelSlot key={id} slot={id} provider={provider} />
        ))}
        {showAudit && auditOpen && auditLog && <AuditViewContainer log={auditLog} />}
      </main>
    </div>
  );
}
