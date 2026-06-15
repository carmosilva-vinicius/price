"use client";

import { useEffect, useState } from "react";
import styles from "@/app/page.module.css";

type ChecklistItem = {
  criterionId: string;
  status: "yes" | "no" | "unsure";
};

type ChecklistModalProps = {
  ticker: string;
  companyName: string | null;
  currentSector: string | null;
  onClose: () => void;
  onSave: (updatedAssets: any[]) => void;
};

const STANDARD_SECTORS = ["Bancos", "Energia", "Saneamento", "Seguros", "Telecom"];

const CRITERIA_METADATA = [
  {
    id: "profitable",
    title: "Histórico de Lucro",
    description: "A empresa possui lucros consistentes nos últimos 5 anos?"
  },
  {
    id: "stable_debt",
    title: "Dívida Controlada",
    description: "A relação dívida líquida / EBITDA é saudável e está sob controle?"
  },
  {
    id: "sustainable_payout",
    title: "Payout Sustentável",
    description: "A empresa distribui dividendos de forma sustentável e recorrente?"
  }
];

export function ChecklistModal({
  ticker,
  companyName,
  currentSector,
  onClose,
  onSave
}: ChecklistModalProps) {
  const isStandard = currentSector ? STANDARD_SECTORS.includes(currentSector) : false;
  const [sectorSelect, setSectorSelect] = useState(
    currentSector ? (isStandard ? currentSector : "Outros") : ""
  );
  const [customSector, setCustomSector] = useState(
    currentSector && !isStandard ? currentSector : ""
  );

  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { criterionId: "profitable", status: "unsure" },
    { criterionId: "stable_debt", status: "unsure" },
    { criterionId: "sustainable_payout", status: "unsure" }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    let active = true;
    async function fetchChecklist() {
      try {
        const res = await fetch(`/api/assets/${ticker}/checklist`);
        if (!res.ok) {
          throw new Error("Falha ao obter checklist");
        }
        const data = await res.json();
        if (active && data.checklist) {
          setChecklist(data.checklist);
        }
      } catch (error) {
        console.error("Erro ao carregar checklist:", error);
      }
    }
    void fetchChecklist();
    return () => {
      active = false;
    };
  }, [ticker]);

  const handleRadioChange = (criterionId: string, status: "yes" | "no" | "unsure") => {
    setChecklist((current) =>
      current.map((item) =>
        item.criterionId === criterionId ? { ...item, status } : item
      )
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // 1. PUT checklist
      const checklistRes = await fetch(`/api/assets/${ticker}/checklist`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist })
      });
      if (!checklistRes.ok) {
        const err = await checklistRes.json();
        throw new Error(err.error ?? "Erro ao salvar checklist");
      }

      // 2. PUT sector
      const finalSector = sectorSelect === "Outros" ? customSector.trim() : (sectorSelect || null);
      const sectorRes = await fetch(`/api/assets/${ticker}/sector`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector: finalSector })
      });
      if (!sectorRes.ok) {
        const err = await sectorRes.json();
        throw new Error(err.error ?? "Erro ao salvar setor");
      }

      const data = await sectorRes.json();
      onSave(data.assets);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Erro inesperado ao salvar checklist.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2>
            Checklist Barsi: <span>{ticker}</span>
          </h2>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Fechar modal"
          >
            &times;
          </button>
        </div>

        {companyName && (
          <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: "14px" }}>
            {companyName}
          </p>
        )}

        <form onSubmit={handleSave} className={styles.checklistForm}>
          <div>
            <label htmlFor="sector-select">Setor de Atuação</label>
            <select
              id="sector-select"
              value={sectorSelect}
              onChange={(e) => setSectorSelect(e.target.value)}
              style={{ marginTop: "4px" }}
            >
              <option value="">Sem Setor</option>
              {STANDARD_SECTORS.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
              <option value="Outros">Outros...</option>
            </select>
          </div>

          {sectorSelect === "Outros" && (
            <div style={{ marginTop: "4px" }}>
              <label htmlFor="custom-sector-input">Especificar Setor</label>
              <input
                id="custom-sector-input"
                type="text"
                value={customSector}
                onChange={(e) => setCustomSector(e.target.value)}
                placeholder="Ex: Petróleo, Mineração"
                required
                style={{ marginTop: "4px" }}
              />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
            {CRITERIA_METADATA.map((criterion) => {
              const matched = checklist.find((item) => item.criterionId === criterion.id);
              const status = matched ? matched.status : "unsure";

              return (
                <div key={criterion.id} className={styles.criterionRow}>
                  <div className={styles.criterionTitle}>{criterion.title}</div>
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                    {criterion.description}
                  </span>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name={`criteria-${criterion.id}`}
                        value="yes"
                        checked={status === "yes"}
                        onChange={() => handleRadioChange(criterion.id, "yes")}
                      />
                      Sim
                    </label>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name={`criteria-${criterion.id}`}
                        value="no"
                        checked={status === "no"}
                        onChange={() => handleRadioChange(criterion.id, "no")}
                      />
                      Não
                    </label>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name={`criteria-${criterion.id}`}
                        value="unsure"
                        checked={status === "unsure"}
                        onChange={() => handleRadioChange(criterion.id, "unsure")}
                      />
                      Não sei
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.dialogActions}>
            <button type="button" onClick={onClose} disabled={isSaving}>
              Descartar Alterações
            </button>
            <button type="submit" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar Checklist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
