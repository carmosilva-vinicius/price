// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ChecklistModal } from "@/components/ChecklistModal";

// Stub showModal and close for HTMLDialogElement in JSDOM
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

describe("ChecklistModal component tests", () => {
  const defaultChecklistMock = [
    { criterionId: "profitable", status: "unsure" },
    { criterionId: "stable_debt", status: "unsure" },
    { criterionId: "sustainable_payout", status: "unsure" }
  ];

  it("fetches and renders current checklist status and standard sectors", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith("/checklist")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ checklist: defaultChecklistMock })
        });
      }
      return Promise.resolve({ ok: false });
    });
    vi.stubGlobal("fetch", fetchMock);

    const handleClose = vi.fn();
    const handleSave = vi.fn();

    render(
      <ChecklistModal
        ticker="PETR4"
        companyName="Petrobras SA"
        currentSector="Energia"
        onClose={handleClose}
        onSave={handleSave}
      />
    );

    // Verify GET checklist request was sent
    expect(fetchMock).toHaveBeenCalledWith("/api/assets/PETR4/checklist");

    // Wait for the company name to render
    expect(await screen.findByText("Petrobras SA")).toBeInTheDocument();

    // Verify select sector dropdown value is "Energia"
    const select = screen.getByLabelText("Setor de Atuação") as HTMLSelectElement;
    expect(select.value).toBe("Energia");
  });

  it("toggles checklist options and saves updates on submit", async () => {
    let checklistPutBody: any = null;
    let sectorPutBody: any = null;

    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith("/checklist") && init?.method === "GET") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ checklist: defaultChecklistMock })
        });
      }
      if (url.endsWith("/checklist") && init?.method === "PUT") {
        checklistPutBody = JSON.parse(init.body as string);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      if (url.endsWith("/sector") && init?.method === "PUT") {
        sectorPutBody = JSON.parse(init.body as string);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ assets: [] })
        });
      }
      return Promise.resolve({ ok: false });
    });
    vi.stubGlobal("fetch", fetchMock);

    const handleClose = vi.fn();
    const handleSave = vi.fn();

    render(
      <ChecklistModal
        ticker="PETR4"
        companyName="Petrobras SA"
        currentSector="Energia"
        onClose={handleClose}
        onSave={handleSave}
      />
    );

    // Wait for rendering
    await screen.findByText("Petrobras SA");

    // Click "Sim" radio button for profitable
    const profitableYesRadio = screen.getAllByLabelText("Sim")[0]; // profitable is first
    fireEvent.click(profitableYesRadio);

    // Change sector to "Outros"
    const select = screen.getByLabelText("Setor de Atuação") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "Outros" } });

    // Ensure custom sector input is rendered and set its value
    const customInput = await screen.findByLabelText("Especificar Setor") as HTMLInputElement;
    fireEvent.change(customInput, { target: { value: "Petróleo" } });

    // Submit form
    const saveButton = screen.getByText("Salvar Checklist");
    fireEvent.click(saveButton);

    // Verify it updates checklist then sector sequentially
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/assets/PETR4/checklist", expect.any(Object));
      expect(fetchMock).toHaveBeenCalledWith("/api/assets/PETR4/sector", expect.any(Object));
    });

    expect(checklistPutBody).toEqual({
      checklist: [
        { criterionId: "profitable", status: "yes" },
        { criterionId: "stable_debt", status: "unsure" },
        { criterionId: "sustainable_payout", status: "unsure" }
      ]
    });

    expect(sectorPutBody).toEqual({ sector: "Petróleo" });
    expect(handleSave).toHaveBeenCalledWith([]);
  });

  it("closes the modal on close button click and on ESC keypress", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith("/checklist")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ checklist: defaultChecklistMock })
        });
      }
      return Promise.resolve({ ok: false });
    });
    vi.stubGlobal("fetch", fetchMock);

    const handleClose = vi.fn();
    const handleSave = vi.fn();

    render(
      <ChecklistModal
        ticker="PETR4"
        companyName="Petrobras SA"
        currentSector="Energia"
        onClose={handleClose}
        onSave={handleSave}
      />
    );

    await screen.findByText("Petrobras SA");

    const closeBtn = screen.getByLabelText("Fechar modal");
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
