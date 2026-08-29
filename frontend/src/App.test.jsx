import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App-Shell", () => {
  it("rendert die Navigation und den Hauptinhalt", () => {
    render(<App />);

    expect(screen.getByRole("navigation", { name: "Hauptnavigation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Meine Garderobe" })).toBeInTheDocument();
  });

  it("verlinkt Impressum und Datenschutz im Footer", () => {
    render(<App />);

    expect(screen.getByRole("link", { name: "Impressum" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Datenschutz" })).toBeInTheDocument();
  });
});
