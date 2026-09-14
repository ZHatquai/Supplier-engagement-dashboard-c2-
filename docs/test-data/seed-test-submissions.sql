-- ============================================================================
-- Seed test data — The Corporate Supplier Review Dashboard 2026 (Tool B)
-- Project: "The corporate live build (New)"
-- Generated 14 September 2026. Read docs/test-data/TEST-DATA-README.md first.
--
-- 32 rows across 25 companies. Every status below is what Tool A's
-- submit_submission would have produced for that submission sequence; the
-- README maps each row to the branch it came from.
--
-- RUN AS service_role (Supabase MCP / SQL editor). Tool B holds no insert
-- grant and must never gain one. This script inserts directly rather than
-- calling submit_submission, so the status mix is deterministic. If you want
-- to exercise Tool A's own logic instead, see the README, "Optional live path".
--
-- Idempotent: the DELETE below removes any previous run of this seed.
-- ============================================================================

begin;

delete from public.submissions
where company_name in (

  'Advanced Logistics Co. Ltd.',
  'Alpha Components Co. Ltd.',
  'Alpha Materials S.A. de C.V.',
  'Core Logistics Co. Ltd.',
  'Electro Chemicals Co. Ltd.',
  'Electro Components Co. Ltd.',
  'Electro Plastics S.A.',
  'Electro Plastics Sdn. Bhd.',
  'Electro Precision S.A.',
  'Global Materials Pvt. Ltd.',
  'Global Power Pvt. Ltd.',
  'Global Precision Co. Ltd.',
  'Nexus Chemicals GmbH',
  'Nova Logistics PT',
  'Nova Power PT',
  'Omni Materials Co. Ltd.',
  'Pinnacle Chemicals Sdn. Bhd.',
  'Prime Chemicals Sdn. Bhd.',
  'Prime Logistics S.A.',
  'Prime Materials S.A. de C.V.',
  'Prime Precision Pvt. Ltd.',
  'Quantum Dynamics S.A. de C.V.',
  'Strata Power Co. Ltd.',
  'Vertex Chemicals PT',
  'Vertex Materials S.A. de C.V.'
);

insert into public.submissions (
  company_name, contact_name, contact_email, contact_phone, job_title,
  department, route, ecovadis_link, questionnaire_answers, status, created_at,
  resolved_by, resolved_at, resolution_note
) values
-- Clean single submission, 0 of 7 flags raised
(
  'Quantum Dynamics S.A. de C.V.', 'Marta Vogel', 'm.vogel@quantumdynamicssad.example',
  '+49 69 5500 100', 'Head of Sustainability', 'Sustainability',
  'questionnaire'::submission_route, null, '{"s2_sbti": "Yes", "s3_pfas": "No", "s4_stress": "No", "s6_protected_area": "No", "s7_human_rights_policy": "Yes", "s7_due_diligence": "Yes", "s7_conflict_minerals": "Yes", "s2_scope1": "8,000", "s2_scope2": "4,000", "s2_scope3": "60,000", "s2_projects": "LED retrofit across two sites; compressed-air leak programme completed 2025.", "s2_barriers": "Capital availability and a long equipment replacement cycle.", "s3_pfas_roadmap": "Not applicable.", "s3_substances": "Two SVHCs above 0.1% w/w, both declared in SCIP.", "s3_wastewater": "Discharged to municipal treatment under permit, sampled quarterly.", "s4_withdrawal": "120 ML/yr", "s4_recycling": "15%", "s4_contingency": "Site-level drought plan reviewed annually.", "s5_waste": "900 t", "s5_pcr": "5%", "s5_circularity": "Take-back scheme for packaging on two customer accounts.", "s5_zero_waste": "No formal zero-waste-to-landfill commitment yet.", "s6_assessment": "Desktop screening completed 2025 using IBAT.", "s6_initiatives": "Pollinator planting at the main site; no offsets purchased.", "s7_code_of_conduct": "Yes", "s7_grievance": "Third-party whistleblowing line, available in four languages."}'::jsonb,
  'active'::submission_status, '2026-06-11 09:20:00+02'::timestamptz,
  null, null, null
),
-- Clean single submission, 1 of 7 flags raised
(
  'Electro Plastics S.A.', 'Tobias Ferreira', 't.ferreira@electroplasticssa.example',
  '+49 69 5513 101', 'EHS Manager', 'EHS',
  'questionnaire'::submission_route, null, '{"s2_sbti": "Yes", "s3_pfas": "Yes", "s4_stress": "No", "s6_protected_area": "No", "s7_human_rights_policy": "Yes", "s7_due_diligence": "Yes", "s7_conflict_minerals": "Yes", "s2_scope1": "8,137", "s2_scope2": "4,091", "s2_scope3": "61,103", "s2_projects": "LED retrofit across two sites; compressed-air leak programme completed 2025.", "s2_barriers": "Capital availability and a long equipment replacement cycle.", "s3_pfas_roadmap": "Substitution trial running on two coating lines, completion targeted 2028.", "s3_substances": "Two SVHCs above 0.1% w/w, both declared in SCIP.", "s3_wastewater": "Discharged to municipal treatment under permit, sampled quarterly.", "s4_withdrawal": "127 ML/yr", "s4_recycling": "18%", "s4_contingency": "Site-level drought plan reviewed annually.", "s5_waste": "943 t", "s5_pcr": "9%", "s5_circularity": "Take-back scheme for packaging on two customer accounts.", "s5_zero_waste": "No formal zero-waste-to-landfill commitment yet.", "s6_assessment": "Desktop screening completed 2025 using IBAT.", "s6_initiatives": "Pollinator planting at the main site; no offsets purchased.", "s7_code_of_conduct": "Yes", "s7_grievance": "Third-party whistleblowing line, available in four languages."}'::jsonb,
  'active'::submission_status, '2026-06-12 09:20:00+02'::timestamptz,
  null, null, null
),
-- Clean single submission, 2 of 7 flags raised
(
  'Vertex Chemicals PT', 'Aisha Okonkwo', 'a.okonkwo@vertexchemicalspt.example',
  '+49 69 5526 102', 'Quality Director', 'Quality',
  'questionnaire'::submission_route, null, '{"s2_sbti": "No", "s3_pfas": "Yes", "s4_stress": "No", "s6_protected_area": "No", "s7_human_rights_policy": "Yes", "s7_due_diligence": "Yes", "s7_conflict_minerals": "Yes", "s2_scope1": "8,274", "s2_scope2": "4,182", "s2_scope3": "62,206", "s2_projects": "LED retrofit across two sites; compressed-air leak programme completed 2025.", "s2_barriers": "Capital availability and a long equipment replacement cycle.", "s3_pfas_roadmap": "Substitution trial running on two coating lines, completion targeted 2028.", "s3_substances": "Two SVHCs above 0.1% w/w, both declared in SCIP.", "s3_wastewater": "Discharged to municipal treatment under permit, sampled quarterly.", "s4_withdrawal": "134 ML/yr", "s4_recycling": "21%", "s4_contingency": "Site-level drought plan reviewed annually.", "s5_waste": "986 t", "s5_pcr": "13%", "s5_circularity": "Take-back scheme for packaging on two customer accounts.", "s5_zero_waste": "No formal zero-waste-to-landfill commitment yet.", "s6_assessment": "Desktop screening completed 2025 using IBAT.", "s6_initiatives": "Pollinator planting at the main site; no offsets purchased.", "s7_code_of_conduct": "Yes", "s7_grievance": "Third-party whistleblowing line, available in four languages."}'::jsonb,
  'active'::submission_status, '2026-06-13 09:20:00+02'::timestamptz,
  null, null, null
),
-- Clean single submission, 3 of 7 flags raised
(
  'Prime Precision Pvt. Ltd.', 'Ravi Menon', 'r.menon@primeprecisionpvtl.example',
  '+49 69 5539 103', 'Procurement Lead', 'Procurement',
  'questionnaire'::submission_route, null, '{"s2_sbti": "No", "s3_pfas": "Yes", "s4_stress": "Yes", "s6_protected_area": "No", "s7_human_rights_policy": "Yes", "s7_due_diligence": "Yes", "s7_conflict_minerals": "Yes", "s2_scope1": "8,411", "s2_scope2": "4,273", "s2_scope3": "63,309", "s2_projects": "LED retrofit across two sites; compressed-air leak programme completed 2025.", "s2_barriers": "Capital availability and a long equipment replacement cycle.", "s3_pfas_roadmap": "Substitution trial running on two coating lines, completion targeted 2028.", "s3_substances": "Two SVHCs above 0.1% w/w, both declared in SCIP.", "s3_wastewater": "Discharged to municipal treatment under permit, sampled quarterly.", "s4_withdrawal": "141 ML/yr", "s4_recycling": "24%", "s4_contingency": "Site-level drought plan reviewed annually.", "s5_waste": "1,029 t", "s5_pcr": "17%", "s5_circularity": "Take-back scheme for packaging on two customer accounts.", "s5_zero_waste": "No formal zero-waste-to-landfill commitment yet.", "s6_assessment": "Desktop screening completed 2025 using IBAT.", "s6_initiatives": "Pollinator planting at the main site; no offsets purchased.", "s7_code_of_conduct": "Yes", "s7_grievance": "Third-party whistleblowing line, available in four languages."}'::jsonb,
  'active'::submission_status, '2026-06-15 09:20:00+02'::timestamptz,
  null, null, null
),
-- Clean single submission, 4 of 7 flags raised
(
  'Prime Materials S.A. de C.V.', 'Ingrid Halvorsen', 'i.halvorsen@primematerialssade.example',
  '+49 69 5552 104', 'Compliance Officer', 'Compliance',
  'questionnaire'::submission_route, null, '{"s2_sbti": "No", "s3_pfas": "Yes", "s4_stress": "Yes", "s6_protected_area": "No", "s7_human_rights_policy": "Yes", "s7_due_diligence": "No", "s7_conflict_minerals": "Yes", "s2_scope1": "8,548", "s2_scope2": "4,364", "s2_scope3": "64,412", "s2_projects": "LED retrofit across two sites; compressed-air leak programme completed 2025.", "s2_barriers": "Capital availability and a long equipment replacement cycle.", "s3_pfas_roadmap": "Substitution trial running on two coating lines, completion targeted 2028.", "s3_substances": "Two SVHCs above 0.1% w/w, both declared in SCIP.", "s3_wastewater": "Discharged to municipal treatment under permit, sampled quarterly.", "s4_withdrawal": "148 ML/yr", "s4_recycling": "27%", "s4_contingency": "Site-level drought plan reviewed annually.", "s5_waste": "1,072 t", "s5_pcr": "21%", "s5_circularity": "Take-back scheme for packaging on two customer accounts.", "s5_zero_waste": "No formal zero-waste-to-landfill commitment yet.", "s6_assessment": "Desktop screening completed 2025 using IBAT.", "s6_initiatives": "Pollinator planting at the main site; no offsets purchased.", "s7_code_of_conduct": "Yes", "s7_grievance": "Third-party whistleblowing line, available in four languages."}'::jsonb,
  'active'::submission_status, '2026-06-16 09:20:00+02'::timestamptz,
  null, null, null
),
-- Clean single submission, 5 of 7 flags raised
(
  'Advanced Logistics Co. Ltd.', 'Pedro Duarte', 'p.duarte@advancedlogisticsc.example',
  '+49 69 5565 105', 'Operations Manager', 'Operations',
  'questionnaire'::submission_route, null, '{"s2_sbti": "No", "s3_pfas": "Yes", "s4_stress": "Yes", "s6_protected_area": "Yes", "s7_human_rights_policy": "Yes", "s7_due_diligence": "No", "s7_conflict_minerals": "Yes", "s2_scope1": "8,685", "s2_scope2": "4,455", "s2_scope3": "65,515", "s2_projects": "LED retrofit across two sites; compressed-air leak programme completed 2025.", "s2_barriers": "Capital availability and a long equipment replacement cycle.", "s3_pfas_roadmap": "Substitution trial running on two coating lines, completion targeted 2028.", "s3_substances": "Two SVHCs above 0.1% w/w, both declared in SCIP.", "s3_wastewater": "Discharged to municipal treatment under permit, sampled quarterly.", "s4_withdrawal": "155 ML/yr", "s4_recycling": "30%", "s4_contingency": "Site-level drought plan reviewed annually.", "s5_waste": "1,115 t", "s5_pcr": "25%", "s5_circularity": "Take-back scheme for packaging on two customer accounts.", "s5_zero_waste": "No formal zero-waste-to-landfill commitment yet.", "s6_assessment": "Desktop screening completed 2025 using IBAT.", "s6_initiatives": "Pollinator planting at the main site; no offsets purchased.", "s7_code_of_conduct": "Yes", "s7_grievance": "Third-party whistleblowing line, available in four languages."}'::jsonb,
  'active'::submission_status, '2026-06-17 09:20:00+02'::timestamptz,
  null, null, null
),
-- Clean single submission, 6 of 7 flags raised
(
  'Omni Materials Co. Ltd.', 'Yuki Tanaka', 'y.tanaka@omnimaterialscoltd.example',
  '+49 69 5578 106', 'Head of Sustainability', 'Sustainability',
  'questionnaire'::submission_route, null, '{"s2_sbti": "No", "s3_pfas": "Yes", "s4_stress": "Yes", "s6_protected_area": "Yes", "s7_human_rights_policy": "Yes", "s7_due_diligence": "No", "s7_conflict_minerals": "No", "s2_scope1": "8,822", "s2_scope2": "4,546", "s2_scope3": "66,618", "s2_projects": "LED retrofit across two sites; compressed-air leak programme completed 2025.", "s2_barriers": "Capital availability and a long equipment replacement cycle.", "s3_pfas_roadmap": "Substitution trial running on two coating lines, completion targeted 2028.", "s3_substances": "Two SVHCs above 0.1% w/w, both declared in SCIP.", "s3_wastewater": "Discharged to municipal treatment under permit, sampled quarterly.", "s4_withdrawal": "162 ML/yr", "s4_recycling": "33%", "s4_contingency": "Site-level drought plan reviewed annually.", "s5_waste": "1,158 t", "s5_pcr": "29%", "s5_circularity": "Take-back scheme for packaging on two customer accounts.", "s5_zero_waste": "No formal zero-waste-to-landfill commitment yet.", "s6_assessment": "Desktop screening completed 2025 using IBAT.", "s6_initiatives": "Pollinator planting at the main site; no offsets purchased.", "s7_code_of_conduct": "Yes", "s7_grievance": "Third-party whistleblowing line, available in four languages."}'::jsonb,
  'active'::submission_status, '2026-06-18 09:20:00+02'::timestamptz,
  null, null, null
),
-- Clean single submission, 7 of 7 flags raised
(
  'Nova Logistics PT', 'Hannah Brenner', 'h.brenner@novalogisticspt.example',
  '+49 69 5591 107', 'EHS Manager', 'EHS',
  'questionnaire'::submission_route, null, '{"s2_sbti": "No", "s3_pfas": "Yes", "s4_stress": "Yes", "s6_protected_area": "Yes", "s7_human_rights_policy": "No", "s7_due_diligence": "No", "s7_conflict_minerals": "No", "s2_scope1": "8,959", "s2_scope2": "4,637", "s2_scope3": "67,721", "s2_projects": "LED retrofit across two sites; compressed-air leak programme completed 2025.", "s2_barriers": "Capital availability and a long equipment replacement cycle.", "s3_pfas_roadmap": "Substitution trial running on two coating lines, completion targeted 2028.", "s3_substances": "Two SVHCs above 0.1% w/w, both declared in SCIP.", "s3_wastewater": "Discharged to municipal treatment under permit, sampled quarterly.", "s4_withdrawal": "169 ML/yr", "s4_recycling": "36%", "s4_contingency": "Site-level drought plan reviewed annually.", "s5_waste": "1,201 t", "s5_pcr": "33%", "s5_circularity": "Take-back scheme for packaging on two customer accounts.", "s5_zero_waste": "No formal zero-waste-to-landfill commitment yet.", "s6_assessment": "Desktop screening completed 2025 using IBAT.", "s6_initiatives": "Pollinator planting at the main site; no offsets purchased.", "s7_code_of_conduct": "Yes", "s7_grievance": "Third-party whistleblowing line, available in four languages."}'::jsonb,
  'active'::submission_status, '2026-06-19 09:20:00+02'::timestamptz,
  null, null, null
),
-- Blank answer on s4_stress
(
  'Global Materials Pvt. Ltd.', 'Lukas Novak', 'l.novak@globalmaterialspvt.example',
  '+49 69 5604 108', 'Quality Director', 'Quality',
  'questionnaire'::submission_route, null, '{"s2_sbti": "No", "s3_pfas": "Yes", "s4_stress": "", "s6_protected_area": "No", "s7_human_rights_policy": "Yes", "s7_due_diligence": "Yes", "s7_conflict_minerals": "Yes", "s2_scope1": "9,096", "s2_scope2": "4,728", "s2_scope3": "68,824", "s2_projects": "LED retrofit across two sites; compressed-air leak programme completed 2025.", "s2_barriers": "Capital availability and a long equipment replacement cycle.", "s3_pfas_roadmap": "Substitution trial running on two coating lines, completion targeted 2028.", "s3_substances": "Two SVHCs above 0.1% w/w, both declared in SCIP.", "s3_wastewater": "Discharged to municipal treatment under permit, sampled quarterly.", "s4_withdrawal": "176 ML/yr", "s4_recycling": "39%", "s4_contingency": "Site-level drought plan reviewed annually.", "s5_waste": "1,244 t", "s5_pcr": "37%", "s5_circularity": "Take-back scheme for packaging on two customer accounts.", "s5_zero_waste": "No formal zero-waste-to-landfill commitment yet.", "s6_assessment": "Desktop screening completed 2025 using IBAT.", "s6_initiatives": "Pollinator planting at the main site; no offsets purchased.", "s7_code_of_conduct": "Yes", "s7_grievance": "Third-party whistleblowing line, available in four languages."}'::jsonb,
  'active'::submission_status, '2026-06-22 09:20:00+02'::timestamptz,
  null, null, null
),
-- Unexpected value 'Maybe' on s6_protected_area
(
  'Electro Chemicals Co. Ltd.', 'Priya Shah', 'p.shah@electrochemicalsco.example',
  '+49 69 5617 109', 'Procurement Lead', 'Procurement',
  'questionnaire'::submission_route, null, '{"s2_sbti": "No", "s3_pfas": "Yes", "s4_stress": "Yes", "s6_protected_area": "Maybe", "s7_human_rights_policy": "Yes", "s7_due_diligence": "Yes", "s7_conflict_minerals": "Yes", "s2_scope1": "9,233", "s2_scope2": "4,819", "s2_scope3": "69,927", "s2_projects": "LED retrofit across two sites; compressed-air leak programme completed 2025.", "s2_barriers": "Capital availability and a long equipment replacement cycle.", "s3_pfas_roadmap": "Substitution trial running on two coating lines, completion targeted 2028.", "s3_substances": "Two SVHCs above 0.1% w/w, both declared in SCIP.", "s3_wastewater": "Discharged to municipal treatment under permit, sampled quarterly.", "s4_withdrawal": "183 ML/yr", "s4_recycling": "42%", "s4_contingency": "Site-level drought plan reviewed annually.", "s5_waste": "1,287 t", "s5_pcr": "41%", "s5_circularity": "Take-back scheme for packaging on two customer accounts.", "s5_zero_waste": "No formal zero-waste-to-landfill commitment yet.", "s6_assessment": "Desktop screening completed 2025 using IBAT.", "s6_initiatives": "Pollinator planting at the main site; no offsets purchased.", "s7_code_of_conduct": "Yes", "s7_grievance": "Third-party whistleblowing line, available in four languages."}'::jsonb,
  'active'::submission_status, '2026-06-23 09:20:00+02'::timestamptz,
  null, null, null
),
-- Case and whitespace variants on three flag keys
(
  'Prime Chemicals Sdn. Bhd.', 'Nils Lindqvist', 'n.lindqvist@primechemicalssdnb.example',
  '+49 69 5630 110', 'Compliance Officer', 'Compliance',
  'questionnaire'::submission_route, null, '{"s2_sbti": "NO", "s3_pfas": " yes ", "s4_stress": "No ", "s6_protected_area": "No", "s7_human_rights_policy": "Yes", "s7_due_diligence": " no", "s7_conflict_minerals": "Yes", "s2_scope1": "9,370", "s2_scope2": "4,910", "s2_scope3": "71,030", "s2_projects": "LED retrofit across two sites; compressed-air leak programme completed 2025.", "s2_barriers": "Capital availability and a long equipment replacement cycle.", "s3_pfas_roadmap": "Not applicable.", "s3_substances": "Two SVHCs above 0.1% w/w, both declared in SCIP.", "s3_wastewater": "Discharged to municipal treatment under permit, sampled quarterly.", "s4_withdrawal": "190 ML/yr", "s4_recycling": "45%", "s4_contingency": "Site-level drought plan reviewed annually.", "s5_waste": "1,330 t", "s5_pcr": "45%", "s5_circularity": "Take-back scheme for packaging on two customer accounts.", "s5_zero_waste": "No formal zero-waste-to-landfill commitment yet.", "s6_assessment": "Desktop screening completed 2025 using IBAT.", "s6_initiatives": "Pollinator planting at the main site; no offsets purchased.", "s7_code_of_conduct": "Yes", "s7_grievance": "Third-party whistleblowing line, available in four languages."}'::jsonb,
  'active'::submission_status, '2026-06-24 09:20:00+02'::timestamptz,
  null, null, null
),
-- s7_conflict_minerals key absent entirely
(
  'Core Logistics Co. Ltd.', 'Sofia Marchetti', 's.marchetti@corelogisticscoltd.example',
  '+49 69 5643 111', 'Operations Manager', 'Operations',
  'questionnaire'::submission_route, null, '{"s2_sbti": "No", "s3_pfas": "Yes", "s4_stress": "No", "s6_protected_area": "No", "s7_human_rights_policy": "Yes", "s7_due_diligence": "Yes", "s2_scope1": "9,507", "s2_scope2": "5,001", "s2_scope3": "72,133", "s2_projects": "LED retrofit across two sites; compressed-air leak programme completed 2025.", "s2_barriers": "Capital availability and a long equipment replacement cycle.", "s3_pfas_roadmap": "Substitution trial running on two coating lines, completion targeted 2028.", "s3_substances": "Two SVHCs above 0.1% w/w, both declared in SCIP.", "s3_wastewater": "Discharged to municipal treatment under permit, sampled quarterly.", "s4_withdrawal": "197 ML/yr", "s4_recycling": "48%", "s4_contingency": "Site-level drought plan reviewed annually.", "s5_waste": "1,373 t", "s5_pcr": "49%", "s5_circularity": "Take-back scheme for packaging on two customer accounts.", "s5_zero_waste": "No formal zero-waste-to-landfill commitment yet.", "s6_assessment": "Desktop screening completed 2025 using IBAT.", "s6_initiatives": "Pollinator planting at the main site; no offsets purchased.", "s7_code_of_conduct": "Yes", "s7_grievance": "Third-party whistleblowing line, available in four languages."}'::jsonb,
  'active'::submission_status, '2026-06-25 09:20:00+02'::timestamptz,
  null, null, null
),
-- Clean single EcoVadis submission
(
  'Electro Precision S.A.', 'Omar Haddad', 'o.haddad@electroprecisionsa.example',
  '+49 69 5656 112', 'Head of Sustainability', 'Sustainability',
  'ecovadis'::submission_route, 'https://ecovadis.example/scorecard/TC-013', null,
  'active'::submission_status, '2026-06-26 09:20:00+02'::timestamptz,
  null, null, null
),
-- Clean single EcoVadis submission
(
  'Nova Power PT', 'Elena Petrova', 'e.petrova@novapowerpt.example',
  '+49 69 5669 113', 'EHS Manager', 'EHS',
  'ecovadis'::submission_route, 'https://ecovadis.example/scorecard/TC-014', null,
  'active'::submission_status, '2026-06-29 09:20:00+02'::timestamptz,
  null, null, null
),
-- Clean single EcoVadis submission
(
  'Global Power Pvt. Ltd.', 'Jonas Keller', 'j.keller@globalpowerpvtltd.example',
  '+49 69 5682 114', 'Quality Director', 'Quality',
  'ecovadis'::submission_route, 'https://ecovadis.example/scorecard/TC-015', null,
  'active'::submission_status, '2026-06-30 09:20:00+02'::timestamptz,
  null, null, null
),
-- Clean single EcoVadis submission
(
  'Vertex Materials S.A. de C.V.', 'Meera Iyer', 'm.iyer@vertexmaterialssad.example',
  '+49 69 5695 115', 'Procurement Lead', 'Procurement',
  'ecovadis'::submission_route, 'https://ecovadis.example/scorecard/TC-016', null,
  'active'::submission_status, '2026-07-01 09:20:00+02'::timestamptz,
  null, null, null
),
-- Clean single EcoVadis submission
(
  'Strata Power Co. Ltd.', 'Karin Brandt', 'k.brandt@stratapowercoltd.example',
  '+49 69 5708 116', 'Compliance Officer', 'Compliance',
  'ecovadis'::submission_route, 'https://ecovadis.example/scorecard/TC-017', null,
  'active'::submission_status, '2026-07-02 09:20:00+02'::timestamptz,
  null, null, null
),
-- Clean single EcoVadis submission
(
  'Electro Plastics Sdn. Bhd.', 'Diego Salazar', 'd.salazar@electroplasticssdn.example',
  '+49 69 5721 117', 'Operations Manager', 'Operations',
  'ecovadis'::submission_route, 'https://ecovadis.example/scorecard/TC-018', null,
  'active'::submission_status, '2026-07-03 09:20:00+02'::timestamptz,
  null, null, null
),
-- Same-route duplicate, first row
(
  'Alpha Components Co. Ltd.', 'Anika Jansen', 'a.jansen@alphacomponentscol.example',
  '+49 69 5734 118', 'Head of Sustainability', 'Sustainability',
  'questionnaire'::submission_route, null, '{"s2_sbti": "No", "s3_pfas": "Yes", "s4_stress": "Yes", "s6_protected_area": "No", "s7_human_rights_policy": "Yes", "s7_due_diligence": "No", "s7_conflict_minerals": "Yes", "s2_scope1": "10,466", "s2_scope2": "5,638", "s2_scope3": "79,854", "s2_projects": "LED retrofit across two sites; compressed-air leak programme completed 2025.", "s2_barriers": "Capital availability and a long equipment replacement cycle.", "s3_pfas_roadmap": "Substitution trial running on two coating lines, completion targeted 2028.", "s3_substances": "Two SVHCs above 0.1% w/w, both declared in SCIP.", "s3_wastewater": "Discharged to municipal treatment under permit, sampled quarterly.", "s4_withdrawal": "246 ML/yr", "s4_recycling": "69%", "s4_contingency": "Site-level drought plan reviewed annually.", "s5_waste": "1,674 t", "s5_pcr": "32%", "s5_circularity": "Take-back scheme for packaging on two customer accounts.", "s5_zero_waste": "No formal zero-waste-to-landfill commitment yet.", "s6_assessment": "Desktop screening completed 2025 using IBAT.", "s6_initiatives": "Pollinator planting at the main site; no offsets purchased.", "s7_code_of_conduct": "Yes", "s7_grievance": "Third-party whistleblowing line, available in four languages."}'::jsonb,
  'needs_review'::submission_status, '2026-06-14 09:20:00+02'::timestamptz,
  null, null, null
),
-- Same-route duplicate, second row
(
  'Alpha Components Co. Ltd.', 'Felix Moreau', 'f.moreau@alphacomponentscol.example',
  '+49 69 5747 119', 'EHS Manager', 'EHS',
  'questionnaire'::submission_route, null, '{"s2_sbti": "No", "s3_pfas": "Yes", "s4_stress": "No", "s6_protected_area": "No", "s7_human_rights_policy": "Yes", "s7_due_diligence": "Yes", "s7_conflict_minerals": "Yes", "s2_scope1": "10,603", "s2_scope2": "5,729", "s2_scope3": "80,957", "s2_projects": "LED retrofit across two sites; compressed-air leak programme completed 2025.", "s2_barriers": "Capital availability and a long equipment replacement cycle.", "s3_pfas_roadmap": "Substitution trial running on two coating lines, completion targeted 2028.", "s3_substances": "Two SVHCs above 0.1% w/w, both declared in SCIP.", "s3_wastewater": "Discharged to municipal treatment under permit, sampled quarterly.", "s4_withdrawal": "253 ML/yr", "s4_recycling": "72%", "s4_contingency": "Site-level drought plan reviewed annually.", "s5_waste": "1,717 t", "s5_pcr": "36%", "s5_circularity": "Take-back scheme for packaging on two customer accounts.", "s5_zero_waste": "No formal zero-waste-to-landfill commitment yet.", "s6_assessment": "Desktop screening completed 2025 using IBAT.", "s6_initiatives": "Pollinator planting at the main site; no offsets purchased.", "s7_code_of_conduct": "Yes", "s7_grievance": "Third-party whistleblowing line, available in four languages."}'::jsonb,
  'needs_review'::submission_status, '2026-07-06 09:20:00+02'::timestamptz,
  null, null, null
),
-- Same-route duplicate, first row (EcoVadis)
(
  'Pinnacle Chemicals Sdn. Bhd.', 'Nadia Rahman', 'n.rahman@pinnaclechemicalss.example',
  '+49 69 5760 120', 'Quality Director', 'Quality',
  'ecovadis'::submission_route, 'https://ecovadis.example/scorecard/TC-021', null,
  'needs_review'::submission_status, '2026-06-20 09:20:00+02'::timestamptz,
  null, null, null
),
-- Same-route duplicate, second row (EcoVadis)
(
  'Pinnacle Chemicals Sdn. Bhd.', 'Marta Vogel', 'm.vogel@pinnaclechemicalss.example',
  '+49 69 5773 121', 'Procurement Lead', 'Procurement',
  'ecovadis'::submission_route, 'https://ecovadis.example/scorecard/TC-022', null,
  'needs_review'::submission_status, '2026-07-07 09:20:00+02'::timestamptz,
  null, null, null
),
-- Cross-route: questionnaire superseded by a later EcoVadis row
(
  'Global Precision Co. Ltd.', 'Tobias Ferreira', 't.ferreira@globalprecisioncol.example',
  '+49 69 5786 122', 'Compliance Officer', 'Compliance',
  'questionnaire'::submission_route, null, '{"s2_sbti": "No", "s3_pfas": "Yes", "s4_stress": "Yes", "s6_protected_area": "Yes", "s7_human_rights_policy": "Yes", "s7_due_diligence": "No", "s7_conflict_minerals": "Yes", "s2_scope1": "11,014", "s2_scope2": "6,002", "s2_scope3": "84,266", "s2_projects": "LED retrofit across two sites; compressed-air leak programme completed 2025.", "s2_barriers": "Capital availability and a long equipment replacement cycle.", "s3_pfas_roadmap": "Substitution trial running on two coating lines, completion targeted 2028.", "s3_substances": "Two SVHCs above 0.1% w/w, both declared in SCIP.", "s3_wastewater": "Discharged to municipal treatment under permit, sampled quarterly.", "s4_withdrawal": "274 ML/yr", "s4_recycling": "21%", "s4_contingency": "Site-level drought plan reviewed annually.", "s5_waste": "1,846 t", "s5_pcr": "48%", "s5_circularity": "Take-back scheme for packaging on two customer accounts.", "s5_zero_waste": "No formal zero-waste-to-landfill commitment yet.", "s6_assessment": "Desktop screening completed 2025 using IBAT.", "s6_initiatives": "Pollinator planting at the main site; no offsets purchased.", "s7_code_of_conduct": "Yes", "s7_grievance": "Third-party whistleblowing line, available in four languages."}'::jsonb,
  'superseded'::submission_status, '2026-06-08 09:20:00+02'::timestamptz,
  null, null, null
),
-- Cross-route: later EcoVadis row stays active
(
  'Global Precision Co. Ltd.', 'Aisha Okonkwo', 'a.okonkwo@globalprecisioncol.example',
  '+49 69 5799 123', 'Operations Manager', 'Operations',
  'ecovadis'::submission_route, 'https://ecovadis.example/scorecard/TC-024', null,
  'active'::submission_status, '2026-07-04 09:20:00+02'::timestamptz,
  null, null, null
),
-- Cross-route: EcoVadis row keeps priority
(
  'Prime Logistics S.A.', 'Ravi Menon', 'r.menon@primelogisticssa.example',
  '+49 69 5812 124', 'Head of Sustainability', 'Sustainability',
  'ecovadis'::submission_route, 'https://ecovadis.example/scorecard/TC-025', null,
  'active'::submission_status, '2026-06-09 09:20:00+02'::timestamptz,
  null, null, null
),
-- Cross-route: later questionnaire row lands superseded
(
  'Prime Logistics S.A.', 'Ingrid Halvorsen', 'i.halvorsen@primelogisticssa.example',
  '+49 69 5825 125', 'EHS Manager', 'EHS',
  'questionnaire'::submission_route, null, '{"s2_sbti": "No", "s3_pfas": "Yes", "s4_stress": "Yes", "s6_protected_area": "Yes", "s7_human_rights_policy": "Yes", "s7_due_diligence": "No", "s7_conflict_minerals": "No", "s2_scope1": "11,425", "s2_scope2": "6,275", "s2_scope3": "87,575", "s2_projects": "LED retrofit across two sites; compressed-air leak programme completed 2025.", "s2_barriers": "Capital availability and a long equipment replacement cycle.", "s3_pfas_roadmap": "Substitution trial running on two coating lines, completion targeted 2028.", "s3_substances": "Two SVHCs above 0.1% w/w, both declared in SCIP.", "s3_wastewater": "Discharged to municipal treatment under permit, sampled quarterly.", "s4_withdrawal": "295 ML/yr", "s4_recycling": "30%", "s4_contingency": "Site-level drought plan reviewed annually.", "s5_waste": "1,975 t", "s5_pcr": "15%", "s5_circularity": "Take-back scheme for packaging on two customer accounts.", "s5_zero_waste": "No formal zero-waste-to-landfill commitment yet.", "s6_assessment": "Desktop screening completed 2025 using IBAT.", "s6_initiatives": "Pollinator planting at the main site; no offsets purchased.", "s7_code_of_conduct": "Yes", "s7_grievance": "Third-party whistleblowing line, available in four languages."}'::jsonb,
  'superseded'::submission_status, '2026-07-05 09:20:00+02'::timestamptz,
  null, null, null
),
-- Blocked confirm: this row is under review
(
  'Electro Components Co. Ltd.', 'Pedro Duarte', 'p.duarte@electrocomponentsc.example',
  '+49 69 5838 126', 'Quality Director', 'Quality',
  'questionnaire'::submission_route, null, '{"s2_sbti": "No", "s3_pfas": "Yes", "s4_stress": "Yes", "s6_protected_area": "No", "s7_human_rights_policy": "Yes", "s7_due_diligence": "Yes", "s7_conflict_minerals": "Yes", "s2_scope1": "11,562", "s2_scope2": "6,366", "s2_scope3": "88,678", "s2_projects": "LED retrofit across two sites; compressed-air leak programme completed 2025.", "s2_barriers": "Capital availability and a long equipment replacement cycle.", "s3_pfas_roadmap": "Substitution trial running on two coating lines, completion targeted 2028.", "s3_substances": "Two SVHCs above 0.1% w/w, both declared in SCIP.", "s3_wastewater": "Discharged to municipal treatment under permit, sampled quarterly.", "s4_withdrawal": "302 ML/yr", "s4_recycling": "33%", "s4_contingency": "Site-level drought plan reviewed annually.", "s5_waste": "2,018 t", "s5_pcr": "19%", "s5_circularity": "Take-back scheme for packaging on two customer accounts.", "s5_zero_waste": "No formal zero-waste-to-landfill commitment yet.", "s6_assessment": "Desktop screening completed 2025 using IBAT.", "s6_initiatives": "Pollinator planting at the main site; no offsets purchased.", "s7_code_of_conduct": "Yes", "s7_grievance": "Third-party whistleblowing line, available in four languages."}'::jsonb,
  'needs_review'::submission_status, '2026-06-10 09:20:00+02'::timestamptz,
  'reviewer1@thecorporate.com', '2026-09-12 11:05:00+02'::timestamptz, 'Flagged for review after the EcoVadis scorecard came in separately.'
),
-- Blocked confirm: the conflicting active row
(
  'Electro Components Co. Ltd.', 'Yuki Tanaka', 'y.tanaka@electrocomponentsc.example',
  '+49 69 5851 127', 'Procurement Lead', 'Procurement',
  'ecovadis'::submission_route, 'https://ecovadis.example/scorecard/TC-028', null,
  'active'::submission_status, '2026-07-08 09:20:00+02'::timestamptz,
  null, null, null
),
-- Single needs_review, no conflicting active row
(
  'Nexus Chemicals GmbH', 'Hannah Brenner', 'h.brenner@nexuschemicalsgmbh.example',
  '+49 69 5864 128', 'Compliance Officer', 'Compliance',
  'questionnaire'::submission_route, null, '{"s2_sbti": "Yes", "s3_pfas": "Yes", "s4_stress": "No", "s6_protected_area": "No", "s7_human_rights_policy": "Yes", "s7_due_diligence": "Yes", "s7_conflict_minerals": "Yes", "s2_scope1": "11,836", "s2_scope2": "6,548", "s2_scope3": "90,884", "s2_projects": "LED retrofit across two sites; compressed-air leak programme completed 2025.", "s2_barriers": "Capital availability and a long equipment replacement cycle.", "s3_pfas_roadmap": "Substitution trial running on two coating lines, completion targeted 2028.", "s3_substances": "Two SVHCs above 0.1% w/w, both declared in SCIP.", "s3_wastewater": "Discharged to municipal treatment under permit, sampled quarterly.", "s4_withdrawal": "316 ML/yr", "s4_recycling": "39%", "s4_contingency": "Site-level drought plan reviewed annually.", "s5_waste": "2,104 t", "s5_pcr": "27%", "s5_circularity": "Take-back scheme for packaging on two customer accounts.", "s5_zero_waste": "No formal zero-waste-to-landfill commitment yet.", "s6_assessment": "Desktop screening completed 2025 using IBAT.", "s6_initiatives": "Pollinator planting at the main site; no offsets purchased.", "s7_code_of_conduct": "Yes", "s7_grievance": "Third-party whistleblowing line, available in four languages."}'::jsonb,
  'needs_review'::submission_status, '2026-06-21 09:20:00+02'::timestamptz,
  'reviewer2@thecorporate.com', '2026-09-12 14:40:00+02'::timestamptz, 'Scope 3 figure looked inconsistent with last year; asked the supplier to confirm.'
),
-- History depth: first questionnaire, superseded by the EcoVadis row
(
  'Alpha Materials S.A. de C.V.', 'Lukas Novak', 'l.novak@alphamaterialssade.example',
  '+49 69 5877 129', 'Operations Manager', 'Operations',
  'questionnaire'::submission_route, null, '{"s2_sbti": "No", "s3_pfas": "Yes", "s4_stress": "Yes", "s6_protected_area": "Yes", "s7_human_rights_policy": "No", "s7_due_diligence": "No", "s7_conflict_minerals": "No", "s2_scope1": "11,973", "s2_scope2": "6,639", "s2_scope3": "91,987", "s2_projects": "LED retrofit across two sites; compressed-air leak programme completed 2025.", "s2_barriers": "Capital availability and a long equipment replacement cycle.", "s3_pfas_roadmap": "Substitution trial running on two coating lines, completion targeted 2028.", "s3_substances": "Two SVHCs above 0.1% w/w, both declared in SCIP.", "s3_wastewater": "Discharged to municipal treatment under permit, sampled quarterly.", "s4_withdrawal": "323 ML/yr", "s4_recycling": "42%", "s4_contingency": "Site-level drought plan reviewed annually.", "s5_waste": "2,147 t", "s5_pcr": "31%", "s5_circularity": "Take-back scheme for packaging on two customer accounts.", "s5_zero_waste": "No formal zero-waste-to-landfill commitment yet.", "s6_assessment": "Desktop screening completed 2025 using IBAT.", "s6_initiatives": "Pollinator planting at the main site; no offsets purchased.", "s7_code_of_conduct": "Yes", "s7_grievance": "Third-party whistleblowing line, available in four languages."}'::jsonb,
  'superseded'::submission_status, '2026-06-05 09:20:00+02'::timestamptz,
  null, null, null
),
-- History depth: EcoVadis row holds active
(
  'Alpha Materials S.A. de C.V.', 'Priya Shah', 'p.shah@alphamaterialssade.example',
  '+49 69 5890 130', 'Head of Sustainability', 'Sustainability',
  'ecovadis'::submission_route, 'https://ecovadis.example/scorecard/TC-031', null,
  'active'::submission_status, '2026-06-27 09:20:00+02'::timestamptz,
  null, null, null
),
-- History depth: later questionnaire lands superseded behind the EcoVadis row
(
  'Alpha Materials S.A. de C.V.', 'Nils Lindqvist', 'n.lindqvist@alphamaterialssade.example',
  '+49 69 5903 131', 'EHS Manager', 'EHS',
  'questionnaire'::submission_route, null, '{"s2_sbti": "No", "s3_pfas": "Yes", "s4_stress": "No", "s6_protected_area": "No", "s7_human_rights_policy": "Yes", "s7_due_diligence": "Yes", "s7_conflict_minerals": "Yes", "s2_scope1": "12,247", "s2_scope2": "6,821", "s2_scope3": "94,193", "s2_projects": "LED retrofit across two sites; compressed-air leak programme completed 2025.", "s2_barriers": "Capital availability and a long equipment replacement cycle.", "s3_pfas_roadmap": "Substitution trial running on two coating lines, completion targeted 2028.", "s3_substances": "Two SVHCs above 0.1% w/w, both declared in SCIP.", "s3_wastewater": "Discharged to municipal treatment under permit, sampled quarterly.", "s4_withdrawal": "337 ML/yr", "s4_recycling": "48%", "s4_contingency": "Site-level drought plan reviewed annually.", "s5_waste": "2,233 t", "s5_pcr": "39%", "s5_circularity": "Take-back scheme for packaging on two customer accounts.", "s5_zero_waste": "No formal zero-waste-to-landfill commitment yet.", "s6_assessment": "Desktop screening completed 2025 using IBAT.", "s6_initiatives": "Pollinator planting at the main site; no offsets purchased.", "s7_code_of_conduct": "Yes", "s7_grievance": "Third-party whistleblowing line, available in four languages."}'::jsonb,
  'superseded'::submission_status, '2026-07-09 09:20:00+02'::timestamptz,
  null, null, null
);

commit;

-- ============================================================================
-- Verification — run after the insert. Expected results are in the README.
-- ============================================================================

-- 1. Status and route mix. Expect: active 22 (questionnaire 12, ecovadis 10),
--    needs_review 6, superseded 4. Total 32.
select status, route, count(*)
from public.submissions
group by status, route
order by status, route;

-- 2. Flag board population. Expect 12 rows, flag counts 0,1,2,2,2,3,3,3,4,5,6,7.
select company_name,
       (case when lower(btrim(questionnaire_answers->>'s2_sbti')) = 'no' then 1 else 0 end
      + case when lower(btrim(questionnaire_answers->>'s3_pfas')) = 'yes' then 1 else 0 end
      + case when lower(btrim(questionnaire_answers->>'s4_stress')) = 'yes' then 1 else 0 end
      + case when lower(btrim(questionnaire_answers->>'s6_protected_area')) = 'yes' then 1 else 0 end
      + case when lower(btrim(questionnaire_answers->>'s7_human_rights_policy')) = 'no' then 1 else 0 end
      + case when lower(btrim(questionnaire_answers->>'s7_due_diligence')) = 'no' then 1 else 0 end
      + case when lower(btrim(questionnaire_answers->>'s7_conflict_minerals')) = 'no' then 1 else 0 end
       ) as flag_count
from public.submissions
where route = 'questionnaire' and status = 'active'
order by flag_count, company_name;

-- 3. Companies holding more than one row. Expect 6.
select company_name, count(*) as rows, count(*) filter (where status = 'active') as active_rows
from public.submissions
group by company_name
having count(*) > 1
order by company_name;

-- 4. Key counts. Expect 26 on every questionnaire row except Core Logistics Co. Ltd.,
--    which carries 25 (s7_conflict_minerals deliberately absent).
select company_name, jsonb_array_length(jsonb_path_query_array(questionnaire_answers, '$.keyvalue()')) as key_count
from public.submissions
where route = 'questionnaire'
order by key_count, company_name;
