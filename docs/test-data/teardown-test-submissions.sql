-- Remove every row created by seed-test-submissions.sql.
-- Run as service_role. Deleting a row also destroys its resolution trail.

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
