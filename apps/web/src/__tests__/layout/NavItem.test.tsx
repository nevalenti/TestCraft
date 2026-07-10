import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const matchRoute = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    className,
    onClick,
  }: {
    children?: React.ReactNode;
    to: string;
    className?: string;
    onClick?: () => void;
  }) => (
    <a href={to} className={className} onClick={onClick}>
      {children}
    </a>
  ),
  useMatchRoute: () => matchRoute,
}));

import { NavItem } from "@/layout/NavItem";

const OutlineIcon = () => <svg data-testid="outline-icon" />;
const SolidIcon = () => <svg data-testid="solid-icon" />;

describe("NavItem", () => {
  describe("given the route is not active", () => {
    it("renders the outline icon and non-active styling", () => {
      matchRoute.mockReturnValue(false);
      render(
        <NavItem
          to="/projects"
          label="Projects"
          OutlineIcon={OutlineIcon}
          SolidIcon={SolidIcon}
        />,
      );

      expect(screen.getByTestId("outline-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("solid-icon")).not.toBeInTheDocument();
      expect(
        screen.getByText("Projects").closest("a")?.className,
      ).not.toContain("text-primary");
    });
  });

  describe("given the route is active", () => {
    it("renders the solid icon and active styling", () => {
      matchRoute.mockReturnValue(true);
      render(
        <NavItem
          to="/projects"
          label="Projects"
          OutlineIcon={OutlineIcon}
          SolidIcon={SolidIcon}
        />,
      );

      expect(screen.getByTestId("solid-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("outline-icon")).not.toBeInTheDocument();
      expect(screen.getByText("Projects").closest("a")?.className).toContain(
        "text-primary",
      );
    });
  });

  describe("given hideIcon — omits both icons regardless of active state", () => {
    it("renders neither icon", () => {
      matchRoute.mockReturnValue(true);
      render(
        <NavItem
          to="/projects"
          label="Projects"
          OutlineIcon={OutlineIcon}
          SolidIcon={SolidIcon}
          hideIcon
        />,
      );

      expect(screen.queryByTestId("solid-icon")).not.toBeInTheDocument();
      expect(screen.queryByTestId("outline-icon")).not.toBeInTheDocument();
    });
  });

  describe("given fuzzy — passes it through to the route matcher", () => {
    it("defaults fuzzy to true", () => {
      matchRoute.mockReturnValue(false);
      render(
        <NavItem
          to="/projects"
          label="Projects"
          OutlineIcon={OutlineIcon}
          SolidIcon={SolidIcon}
        />,
      );

      expect(matchRoute).toHaveBeenCalledWith({ to: "/projects", fuzzy: true });
    });

    it("passes fuzzy: false through when explicitly disabled", () => {
      matchRoute.mockReturnValue(false);
      render(
        <NavItem
          to="/projects"
          label="Projects"
          OutlineIcon={OutlineIcon}
          SolidIcon={SolidIcon}
          fuzzy={false}
        />,
      );

      expect(matchRoute).toHaveBeenCalledWith({
        to: "/projects",
        fuzzy: false,
      });
    });
  });
});
