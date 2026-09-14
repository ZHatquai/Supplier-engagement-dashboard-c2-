// The 2026 supplier questionnaire, S2 to S7.
//
// The 26 keys below were read from a live questionnaire-route row in
// "The corporate live build (New)" on 14 September 2026. They are not guessed.
// Tool A's submit_submission rejects any key not matching ^s[2-7]_.
//
// QUESTION TEXT — two different provenances, and the difference matters:
//   * The seven flag-bearing questions carry the exact wording from
//     product-spec.md Section 9, which was verified against the workbook.
//   * The other nineteen are written here from the workbook's section
//     structure and ESRS mapping, because Tool A's src/lib/questionnaireSchema.js
//     is not present in this repo. They are display labels only — nothing is
//     computed from them. If the builder supplies Tool A's exact strings, replace
//     the `question` values in this file and nothing else changes.

export const SECTIONS = [
  { id: 's2', title: 'S2 Climate and Decarbonisation' },
  { id: 's3', title: 'S3 Pollution and PFAS' },
  { id: 's4', title: 'S4 Water and Marine Resources' },
  { id: 's5', title: 'S5 Circular Economy and Waste' },
  { id: 's6', title: 'S6 Biodiversity and Ecosystems' },
  { id: 's7', title: 'S7 Social, Labour and Governance' },
]

// Workbook order within each section.
export const QUESTIONS = [
  // --- S2 Climate and Decarbonisation -------------------------------------
  { key: 's2_scope1', section: 's2', esrs: 'E1-6', question: 'Scope 1 GHG emissions for the most recent reporting year (tCO2e).' },
  { key: 's2_scope2', section: 's2', esrs: 'E1-6', question: 'Scope 2 GHG emissions for the most recent reporting year (tCO2e).' },
  { key: 's2_scope3', section: 's2', esrs: 'E1-6', question: 'Scope 3 GHG emissions for the most recent reporting year (tCO2e).' },
  { key: 's2_sbti', section: 's2', esrs: 'E1-3', flag: true,
    question: 'Does your organisation have a Science-Based Target (SBTi) validated decarbonisation target?' },
  { key: 's2_projects', section: 's2', esrs: 'E1-3', question: 'Describe the decarbonisation projects currently underway and their expected reduction.' },
  { key: 's2_barriers', section: 's2', esrs: 'E1-3', question: 'What are the principal barriers to reducing your emissions?' },

  // --- S3 Pollution and PFAS ----------------------------------------------
  { key: 's3_pfas', section: 's3', esrs: 'E2-3', flag: true,
    question: 'Do any of your products or production processes contain or utilise PFAS compounds ("Forever Chemicals")?' },
  { key: 's3_pfas_roadmap', section: 's3', esrs: 'E2-3', question: 'If PFAS are present, describe your substitution or phase-out roadmap and its timeline.' },
  { key: 's3_substances', section: 's3', esrs: 'E2-5', question: 'How many substances of very high concern (SVHC) are used or released across your operations?' },
  { key: 's3_wastewater', section: 's3', esrs: 'E2-4', question: 'Describe your wastewater treatment and pollutant discharge controls.' },

  // --- S4 Water and Marine Resources --------------------------------------
  { key: 's4_withdrawal', section: 's4', esrs: 'E3-4', question: 'Total annual water withdrawal across all sites (m3).' },
  { key: 's4_stress', section: 's4', esrs: 'E3-1', flag: true,
    question: 'Is your primary production facility located in a high-water-stress region (WRI Aqueduct score >= 3)?' },
  { key: 's4_recycling', section: 's4', esrs: 'E3-4', question: 'Describe your water recycling and reuse measures, with the share of water reused.' },
  { key: 's4_contingency', section: 's4', esrs: 'E3-1', question: 'Describe your contingency plan for water scarcity or supply interruption.' },

  // --- S5 Circular Economy and Waste --------------------------------------
  { key: 's5_waste', section: 's5', esrs: 'E5-5', question: 'Total annual waste generated across all sites (tonnes).' },
  { key: 's5_pcr', section: 's5', esrs: 'E5-4', question: 'Share of post-consumer recycled (PCR) content in your products or packaging (%).' },
  { key: 's5_circularity', section: 's5', esrs: 'E5-4', question: 'Describe the circular design measures applied to your products or packaging.' },
  { key: 's5_zero_waste', section: 's5', esrs: 'E5-5', question: 'Describe your progress towards zero waste to landfill.' },

  // --- S6 Biodiversity and Ecosystems -------------------------------------
  { key: 's6_assessment', section: 's6', esrs: 'E4-1', question: 'Describe the biodiversity impact assessment carried out for your production sites.' },
  { key: 's6_protected_area', section: 's6', esrs: 'E4-2', flag: true,
    question: 'Are any of your production sites located within or adjacent to (within 1 km) a protected area or biodiversity hotspot?' },
  { key: 's6_initiatives', section: 's6', esrs: 'E4-3', question: 'Describe any habitat restoration or biodiversity initiatives your organisation runs.' },

  // --- S7 Social, Labour and Governance -----------------------------------
  { key: 's7_human_rights_policy', section: 's7', esrs: 'S2-1', flag: true,
    question: 'Does your organisation have a formal Human Rights and Labour Rights Policy, aligned with the UN Guiding Principles on Business and Human Rights?' },
  { key: 's7_due_diligence', section: 's7', esrs: 'S2-2', flag: true,
    question: 'Have you conducted a human rights due diligence assessment of your Tier 1 and Tier 2 supply chains in the last 24 months?' },
  { key: 's7_code_of_conduct', section: 's7', esrs: 'S2-1', question: 'Describe the supplier code of conduct in force across your own supply chain.' },
  { key: 's7_grievance', section: 's7', esrs: 'S2-3', question: 'Describe the grievance mechanism available to workers in your operations and supply chain.' },
  { key: 's7_conflict_minerals', section: 's7', esrs: 'G1-1', flag: true,
    question: 'Does your organisation have a verified conflict minerals policy (3TG — tin, tantalum, tungsten, gold) in place, including OECD Due Diligence guidance compliance?' },
]

export const QUESTIONS_BY_KEY = Object.fromEntries(QUESTIONS.map((q) => [q.key, q]))

// Every answer present on a row, grouped into workbook sections in workbook order.
// Keys the schema does not know about are appended to a trailing group rather than
// dropped, so a future workbook revision never silently hides a supplier's answer.
export function groupAnswers(answers) {
  const payload = answers && typeof answers === 'object' ? answers : {}
  const known = new Set(QUESTIONS.map((q) => q.key))

  const groups = SECTIONS.map((section) => ({
    ...section,
    items: QUESTIONS.filter((q) => q.section === section.id).map((q) => ({
      ...q,
      answer: payload[q.key],
    })),
  })).filter((g) => g.items.length > 0)

  const extras = Object.keys(payload)
    .filter((k) => !known.has(k))
    .sort()
    .map((k) => ({ key: k, question: k, answer: payload[k] }))

  if (extras.length > 0) {
    groups.push({ id: 'other', title: 'Other answers', items: extras })
  }

  return groups
}
