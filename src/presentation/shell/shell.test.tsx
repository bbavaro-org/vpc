import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { DashboardShell } from "./DashboardShell";
import { PanelSlotView, SlotErrorBoundary } from "./PanelSlot";
import { resolveSlot, SLOT_IDS, type DashboardProvider } from "./provider";

const ok = async () => ({ items: [{ label: "Leads", value: "42" }] });

describe("dashboard shell", () => {
  it("renders header, navigation, role and five named slots in loading state", () => {
    const html = renderToString(
      <DashboardShell provider={{}} role="management" />,
    );
    expect(html).toContain("<header");
    expect(html).toContain("<nav");
    expect(html).toContain("Management");
    for (const id of SLOT_IDS) expect(html).toContain(`data-slot="${id}"`);
    expect(html.match(/data-state="loading"/g)).toHaveLength(5);
    expect(html).toContain("Loading");
    expect(html).toContain('alt="Vancouver Psychology Centre"');
    expect(html).not.toContain("vpc-btn");
    for (const id of SLOT_IDS)
      expect(html).toContain(`href="#slot-${id}-title"`);
  });

  it("resolves an empty state for empty data and for a missing loader", async () => {
    const provider: DashboardProvider = {
      "intake-funnel": async () => ({ items: [] }),
    };
    expect(await resolveSlot(provider, "intake-funnel")).toEqual({
      status: "empty",
    });
    expect(await resolveSlot(provider, "lead-sources")).toEqual({
      status: "empty",
    });
    const html = renderToString(
      <PanelSlotView slot="intake-funnel" state={{ status: "empty" }} />,
    );
    expect(html).toContain("No data yet.");
  });

  it("isolates a failing slot: only that slot errors, the other four still resolve", async () => {
    const provider: DashboardProvider = {
      "headline-metrics": ok,
      "intake-funnel": async () => {
        throw new Error("boom");
      },
      "lead-sources": ok,
      "clinician-capacity": ok,
      "automation-impact": ok,
    };
    const states = await Promise.all(
      SLOT_IDS.map((id) => resolveSlot(provider, id)),
    );
    expect(states.map((s) => s.status)).toEqual([
      "ready",
      "error",
      "ready",
      "ready",
      "ready",
    ]);
    const html = renderToString(
      <PanelSlotView slot="intake-funnel" state={states[1]!} />,
    );
    expect(html).toContain("boom");
    expect(html).toContain('role="alert"');
    const okHtml = renderToString(
      <PanelSlotView slot="lead-sources" state={states[2]!} />,
    );
    expect(okHtml).toContain("42");
  });

  it("logs the failing slot id and original error when a loader rejects", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const boom = new Error("boom");
    const state = await resolveSlot(
      {
        "intake-funnel": async () => {
          throw boom;
        },
      },
      "intake-funnel",
    );
    expect(state).toEqual({ status: "error", message: "boom" });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("intake-funnel"), boom);
    spy.mockRestore();
  });

  it("isolates a throwing render(): that slot shows an alert, siblings still render", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const boom = new Error("render exploded");
    // Server rendering has no error boundaries, so drive the boundary through its lifecycle.
    const boundary = new SlotErrorBoundary({ slot: "lead-sources" });
    boundary.state = SlotErrorBoundary.getDerivedStateFromError(boom);
    boundary.componentDidCatch(boom);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("lead-sources"), boom);
    const failed = renderToString(<>{boundary.render()}</>);
    expect(failed).toContain('role="alert"');
    expect(failed).toContain("render exploded");

    const ready = (slot: "headline-metrics" | "intake-funnel") =>
      renderToString(
        <PanelSlotView
          slot={slot}
          state={{ status: "ready", viewModel: { items: [{ label: "Leads", value: "42" }] } }}
        />,
      );
    expect(ready("headline-metrics")).toContain("Leads");
    expect(ready("intake-funnel")).toContain("42");
    spy.mockRestore();
  });
});
