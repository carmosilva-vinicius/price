// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AssetRadar } from "@/components/AssetRadar";

beforeAll(() => {
  // Stub showModal and close for HTMLDialogElement in JSDOM
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

describe("AssetRadar component tests", () => {
  const initialAssetsMock = [
    {
      ticker: "TAEE11",
      name: "Taesa S.A.",
      currentPrice: 39.69,
      currency: "BRL",
      quoteSource: "api" as const,
      updatedAt: "2026-06-13T20:23:31.243Z",
      sector: null,
      annualPayouts: [
        { year: 2025, amount: 3.22, source: "api" as const },
        { year: 2024, amount: 3.53, source: "api" as const }
      ],
      metrics: {
        dataState: "partial" as const,
        economicStatus: "discounted" as const,
        averageAnnualPayout: 3.375,
        ceilingPrice: 56.25,
        differencePercent: -0.294,
        yearsUsed: [2025, 2024]
      }
    }
  ];

  it("renders correctly with initial assets and handles drafts", () => {
    const { container } = render(<AssetRadar initialAssets={initialAssetsMock} />);
    
    // Check ticker displays
    expect(screen.getByText("TAEE11")).toBeInTheDocument();
    
    // Check Cotação input has value
    const quoteInput = screen.getByLabelText("Cotacao manual de TAEE11") as HTMLInputElement;
    expect(quoteInput.value).toBe("39.69");

    // Check Dividendos inputs inside details
    const dividendosDetails = container.querySelector("details");
    expect(dividendosDetails).toBeInTheDocument();

    const payoutInput = screen.getByLabelText("Provento manual de TAEE11 em 2025") as HTMLInputElement;
    expect(payoutInput.value).toBe("3.22");
  });

  it("handles filter changes and qualitative checklist opening", async () => {
    // Mock fetch for checklist GET endpoint
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ checklist: [] })
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AssetRadar initialAssets={initialAssetsMock} />);

    // Click on Checklist button
    const checklistBtn = screen.getByText("Checklist");
    fireEvent.click(checklistBtn);

    // Verify checklist modal title is shown (indicating it opened)
    expect(screen.getByText("Checklist Barsi:")).toBeInTheDocument();
  });
});
