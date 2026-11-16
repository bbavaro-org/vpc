import { useEffect, useState } from "react";
import {
  resolveSlot,
  SLOT_TITLES,
  type DashboardProvider,
  type SlotId,
  type SlotState,
} from "./provider";

export function PanelSlotView({
  slot,
  state,
}: {
  slot: SlotId;
  state: SlotState;
}) {
  return (
    <section
      className="panel-slot"
      data-slot={slot}
      data-state={state.status}
      aria-labelledby={`slot-${slot}-title`}
      style={{
        background: "var(--white)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-card)",
        padding: "var(--space-6)",
        minHeight: 160,
      }}
    >
      <div className="vpc-eyebrow">Panel</div>
      <h2 id={`slot-${slot}-title`} className="vpc-h2 text-heading-3">
        {SLOT_TITLES[slot]}
      </h2>
      <div
        className="text-body"
        style={{ color: "var(--ink-2)", marginTop: "var(--space-3)" }}
      >
        {state.status === "loading" && <p role="status">Loading…</p>}
        {state.status === "empty" && <p>No data yet.</p>}
        {state.status === "error" && (
          <p role="alert">
            Could not load {SLOT_TITLES[slot].toLowerCase()}: {state.message}
          </p>
        )}
        {state.status === "ready" &&
          state.viewModel.render &&
          state.viewModel.render()}
        {state.status === "ready" && !state.viewModel.render && (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {state.viewModel.items.map((item) => (
              <li key={item.label}>
                {item.label}: <strong>{item.value}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function PanelSlot({
  slot,
  provider,
}: {
  slot: SlotId;
  provider: DashboardProvider;
}) {
  const [state, setState] = useState<SlotState>({ status: "loading" });
  useEffect(() => {
    let live = true;
    setState({ status: "loading" });
    void resolveSlot(provider, slot).then((next) => {
      if (live) setState(next);
    });
    return () => {
      live = false;
    };
  }, [provider, slot]);
  return <PanelSlotView slot={slot} state={state} />;
}
