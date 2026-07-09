import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Alert } from "@/components/ui/Alert";

describe("Alert", () => {
  it("renders children", () => {
    render(<Alert>Something happened</Alert>);
    expect(screen.getByText("Something happened")).toBeInTheDocument();
  });

  it("renders title when provided", () => {
    render(<Alert title="Warning">Be careful</Alert>);
    expect(screen.getByText("Warning")).toBeInTheDocument();
  });

  it("applies variant styles", () => {
    render(<Alert variant="error">Error</Alert>);
    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("bg-red-50");
  });

  it("renders variant icon", () => {
    render(<Alert variant="success">Done</Alert>);
    expect(screen.getByText("\u2713")).toBeInTheDocument();
  });
});
