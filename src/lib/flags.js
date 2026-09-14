// The seven unweighted sustainability risk flags.
//
// product-spec.md Section 9A. Four raise on an answer of No and three raise on
// an answer of Yes. They are deliberately NOT normalised to a single direction:
// the question wording differs and normalising would invert three of them.
//
// The output is a COUNT from 0 to 7. It is never a score, a grade, or a
// percentage, and nothing in the UI may present it as one.
//
// Flags are computed in the browser at render time and are never written to the
// database.

export const FLAGS = [
  {
    id: 'sbti',
    key: 's2_sbti',
    raisesOn: 'no',
    section: 'S2',
    esrs: 'E1-3',
    label: 'No SBTi validated target',
    short: 'SBTi',
    description: 'No Science-Based Target (SBTi) validated decarbonisation target.',
  },
  {
    id: 'pfas',
    key: 's3_pfas',
    raisesOn: 'yes',
    section: 'S3',
    esrs: 'E2-3',
    label: 'PFAS in products or processes',
    short: 'PFAS',
    description: 'Products or production processes contain or utilise PFAS compounds.',
  },
  {
    id: 'water_stress',
    key: 's4_stress',
    raisesOn: 'yes',
    section: 'S4',
    esrs: 'E3-1',
    label: 'High-water-stress region',
    short: 'Water',
    description: 'Primary production facility is in a high-water-stress region.',
  },
  {
    id: 'protected_area',
    key: 's6_protected_area',
    raisesOn: 'yes',
    section: 'S6',
    esrs: 'E4-2',
    label: 'Protected area or biodiversity hotspot',
    short: 'Biodiversity',
    description: 'A production site sits within or within 1 km of a protected area or biodiversity hotspot.',
  },
  {
    id: 'human_rights_policy',
    key: 's7_human_rights_policy',
    raisesOn: 'no',
    section: 'S7',
    esrs: 'S2-1',
    label: 'No human rights and labour rights policy',
    short: 'Human rights',
    description: 'No formal Human Rights and Labour Rights Policy aligned with the UNGPs.',
  },
  {
    id: 'due_diligence',
    key: 's7_due_diligence',
    raisesOn: 'no',
    section: 'S7',
    esrs: 'S2-2',
    label: 'No human rights due diligence in 24 months',
    short: 'Due diligence',
    description: 'No human rights due diligence assessment of Tier 1 and Tier 2 supply chains in the last 24 months.',
  },
  {
    id: 'conflict_minerals',
    key: 's7_conflict_minerals',
    raisesOn: 'no',
    section: 'S7',
    esrs: 'G1-1',
    label: 'No conflict minerals policy',
    short: 'Conflict minerals',
    description: 'No verified conflict minerals policy (3TG) including OECD Due Diligence compliance.',
  },
]

export const FLAG_IDS = FLAGS.map((f) => f.id)

// Matching is case-insensitive and ignores surrounding whitespace. Anything that
// is neither Yes nor No — including a missing, null, or blank answer — raises no
// flag and is reported as unanswered rather than being read as a clean answer.
function readYesNo(raw) {
  if (raw === null || raw === undefined) return null
  const value = String(raw).trim().toLowerCase()
  if (value === 'yes') return 'yes'
  if (value === 'no') return 'no'
  return null
}

// Per-flag evaluation of one submission's questionnaire_answers.
// Returns [{ ...flag, answer, raised, unanswered }].
export function evaluateFlags(answers) {
  const payload = answers && typeof answers === 'object' ? answers : {}
  return FLAGS.map((flag) => {
    const raw = payload[flag.key]
    const value = readYesNo(raw)
    return {
      ...flag,
      answer: raw,
      unanswered: value === null,
      raised: value === flag.raisesOn,
    }
  })
}

// True only for rows the flag board covers: route = questionnaire AND status = active.
export function isFlaggable(submission) {
  return submission.route === 'questionnaire' && submission.status === 'active'
}

// EcoVadis rows carry no answers by constraint. They read
// "not assessable via questionnaire" — never a zero, never a count, never an
// empty indicator set, because zero would read as a clean supplier when in fact
// nothing was assessed.
export const NOT_ASSESSABLE = 'not assessable via questionnaire'

export function isAssessable(submission) {
  return submission.route === 'questionnaire'
}

// Flag detail for one submission. `counted` says whether this row contributes to
// the flag board; a non-active questionnaire row still shows its flags, labelled
// as not counted.
export function flagSummary(submission) {
  if (!isAssessable(submission)) {
    return { assessable: false, counted: false, flags: [], count: null, raisedIds: [] }
  }
  const flags = evaluateFlags(submission.questionnaire_answers)
  const raised = flags.filter((f) => f.raised)
  return {
    assessable: true,
    counted: isFlaggable(submission),
    flags,
    count: raised.length,
    raisedIds: raised.map((f) => f.id),
  }
}
