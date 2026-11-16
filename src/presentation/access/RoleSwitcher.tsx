import { ROLE_LABELS } from '../../application/access';
import { ROLES, type Role } from '../../domain';

export function RoleSwitcher({
  role,
  onRoleChange,
}: {
  readonly role: Role;
  readonly onRoleChange?: (role: Role) => void;
}) {
  return (
    <div data-testid="active-role">
      <span className="vpc-eyebrow">Role</span>{' '}
      <select
        aria-label="Active role"
        value={role}
        onChange={(e) => onRoleChange?.(e.target.value as Role)}
        className="text-body"
        style={{
          color: 'var(--ink)',
          background: 'var(--white)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-pill)',
          padding: 'var(--space-2) var(--space-4)',
        }}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
    </div>
  );
}
