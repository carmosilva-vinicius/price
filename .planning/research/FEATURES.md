# Feature Research

**Domain:** Stock market pricing dashboard and qualitative analytics
**Researched:** 2026-06-14
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in a stock analysis tool. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Sector Tagging | Allows organizing assets by domain. | LOW | Add `sector` field to SQLite `assets` table. |
| Dashboard Filtering | Allows user to narrow list to specific sectors (e.g., BESST only). | LOW | Update React state filter hooks. |
| Dividend History Charting | Displays visual payouts over time rather than simple numbers. | MEDIUM | Renders native React SVG bar charts. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Barsi Qualitative Checklist | Keeps investor grounded on company fundamentals (debt, profit history) beyond purely quantitative formulas. | MEDIUM | Create `checklist_items` table linked to assets. |
| Passive Income Simulator | Translates abstract price targets into concrete financial goals (e.g., "Need X shares to reach R$ 1,000/month"). | MEDIUM | Form and math simulator built using domain average payouts. |
| BESST Highlights | Guides users toward Barsi's highly defensive sectors automatically. | LOW | Add visual indicators/badges in UI. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time stock alerts | Users want immediate push notifications when price drops. | Requires persistent background servers, web sockets, or third-party mailing services which are hard to keep local-only. | Local dashboard indicator ("Discounted" status highlight). |
| Automatic broker sync | Avoid manual asset entry. | Requires sensitive credential storage (CPF/Password) or scraping API complexity. | Easy manual entry and live public scraping (Yahoo Finance/BRAPI). |

## Feature Dependencies

```text
[Barsi Checklist]
    └──requires──> [Sector Tagging]

[Passive Income Simulator]
    └──requires──> [Luiz Barsi Preço-Teto Metrics]

[Visual Charts] ──enhances──> [Luiz Barsi Preço-Teto Metrics]
```

### Dependency Notes

- **Checklist requires Sector Tagging:** Sector classification acts as the gateway for Barsi's qualitative assessment (only run full checklist on BESST candidates).
- **Passive Income Simulator requires Preço-Teto Metrics:** Calculator relies on the 5-year average annual payout calculated in the domain logic to project future income.
- **Visual Charts enhances Preço-Teto Metrics:** Helps users visualize the stability of the payout averages that define the Preço-Teto.

---
*Feature research: 2026-06-14*
