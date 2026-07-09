import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/Badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("applies variant styles", () => {
    render(<Badge variant="success">OK</Badge>);
    const badge = screen.getByText("OK");
    expect(badge.className).toContain("bg-green-100");
  });

  it("applies custom className", () => {
    render(<Badge className="custom-class">Test</Badge>);
    expect(screen.getByText("Test").className).toContain("custom-class");
  });
});
