import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import type { TestPlanCase } from "@testcraft/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SortablePlanCase } from "@/features/testPlans/SortablePlanCase";

const planCase = {
  test_case_id: "case-1",
  test_case_name: "Replay webhook event",
  order: 0,
} as TestPlanCase;

describe("SortablePlanCase", () => {
  it("numbers cases by list position, not by the stored order", () => {
    render(
      <DndContext>
        <SortableContext items={["case-1"]}>
          <ul>
            <SortablePlanCase item={planCase} position={1} />
          </ul>
        </SortableContext>
      </DndContext>,
    );

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
