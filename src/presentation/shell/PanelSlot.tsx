import { Component, useEffect, useState, type ReactNode } from "react";
import {
  resolveSlot,
  SLOT_TITLES,
  type DashboardProvider,
  type PanelViewModel,
  type SlotId,
  type SlotState,
} from "./provider";

function SlotError({ slot, message }: { slot: SlotId; message: string }) {
  return (
    <p role="alert">
      Could not load {SLOT_TITLES[slot].toLowerCase()}: {message}
    </p>
  );
}

/** Isolates a throw from one slot's render() so the other slots keep rendering. */
export class SlotErrorBoundary extends Component<
  { slot: SlotId; children?: ReactNode },
  { error: unknown; failed: boolean }
> {
  state = { error: undefined as unknown, failed: false };

  static getDerivedStateFromError(error: unknown) {
    return { error, failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`Panel slot "${this.props.slot}" failed to render`, error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const { error } = this.state;
    return (
      <SlotError
        slot={this.props.slot}
        message={error instanceof Error ? error.message : "Unknown error"}
      />
    );
  }
}

function ReadyBody({ viewModel }: { viewModel: PanelViewModel }) {
  if (viewModel.render) return <>{viewModel.render()}</>;
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {viewModel.items.map((item) => (
        <li key={item.label}>
          {item.label}: <strong>{item.value}</strong>
        </li>
      ))}
    </ul>
  );
}

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
          <SlotError slot={slot} message={state.message} />
        )}
        {state.status === "ready" && (
          <SlotErrorBoundary slot={slot}>
            <ReadyBody viewModel={state.viewModel} />
          </SlotErrorBoundary>
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
