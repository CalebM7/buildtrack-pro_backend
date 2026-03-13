import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import DailyReport from '../models/DailyReport.js';

dotenv.config({ path: './.env' });

const { MONGO_URI } = process.env;

if (!MONGO_URI) {
  throw new Error('Missing MONGO_URI in .env');
}

const projectSeeds = [
  {
    title: 'Kikuyu Town Affordable Housing Project',
    contractNo: 'MLPWHUD/SDHUD/AHP/196/2023-2024',
    county: 'Kiambu',
    financier: 'GoK',
    contractor: 'VAGHJIYANI ENTERPRISES LIMITED',
    contractPeriod: 18,
    commencementDate: new Date('2024-07-15'),
    endingDate: new Date('2026-01-14'),
    scopeOfWorks: 'Construction of 500 residential units and infrastructure.',
    blocks: [
      { blockId: 'A1', name: 'Block A1', type: 'apartment', totalFloors: 10 },
      { blockId: 'M1', name: 'Maisonette M1', type: 'maisonette', totalFloors: 2 },
    ],
    status: 'active',
  },
  {
    title: 'Naivasha Lakeside Housing Phase I',
    contractNo: 'MLPWHUD/SDHUD/AHP/210/2023-2024',
    county: 'Nakuru',
    financier: 'Shelter Africa',
    contractor: 'RIVERVIEW BUILDERS LTD',
    contractPeriod: 16,
    commencementDate: new Date('2024-09-01'),
    endingDate: new Date('2026-01-01'),
    scopeOfWorks: 'Residential blocks, access roads, and utilities.',
    blocks: [
      { blockId: 'B1', name: 'Block B1', type: 'apartment', totalFloors: 8 },
    ],
    status: 'active',
  },
  {
    title: 'Athi River Workforce Housing',
    contractNo: 'MLPWHUD/SDHUD/AHP/305/2024-2025',
    county: 'Machakos',
    financier: 'World Bank',
    contractor: 'KANCHORO CONSTRUCTION CO.',
    contractPeriod: 14,
    commencementDate: new Date('2025-01-10'),
    endingDate: new Date('2026-03-10'),
    scopeOfWorks: 'High-density workforce housing and amenities.',
    blocks: [
      { blockId: 'C1', name: 'Block C1', type: 'apartment', totalFloors: 12 },
      { blockId: 'C2', name: 'Block C2', type: 'apartment', totalFloors: 12 },
    ],
    status: 'planning',
  },
  {
    title: 'Ruiru Greenview Estate',
    contractNo: 'MLPWHUD/SDHUD/AHP/322/2024-2025',
    county: 'Kiambu',
    financier: 'HF Group',
    contractor: 'BOMA DEVELOPERS LTD',
    contractPeriod: 20,
    commencementDate: new Date('2024-11-05'),
    endingDate: new Date('2026-07-05'),
    scopeOfWorks: 'Mixed-use residential blocks with landscaping.',
    blocks: [
      { blockId: 'D1', name: 'Block D1', type: 'apartment', totalFloors: 9 },
    ],
    status: 'active',
  },
  {
    title: 'Kitengela Horizon Homes',
    contractNo: 'MLPWHUD/SDHUD/AHP/337/2024-2025',
    county: 'Kajiado',
    financier: 'AfDB',
    contractor: 'SAVANNAH BUILD LTD',
    contractPeriod: 12,
    commencementDate: new Date('2025-02-15'),
    endingDate: new Date('2026-02-15'),
    scopeOfWorks: 'Affordable housing clusters with drainage works.',
    blocks: [
      { blockId: 'E1', name: 'Block E1', type: 'apartment', totalFloors: 7 },
    ],
    status: 'planning',
  },
  {
    title: 'Thika Industrial Park Housing',
    contractNo: 'MLPWHUD/SDHUD/AHP/350/2024-2025',
    county: 'Kiambu',
    financier: 'UN Habitat',
    contractor: 'STEELSTONE CONSTRUCTION',
    contractPeriod: 15,
    commencementDate: new Date('2025-03-01'),
    endingDate: new Date('2026-06-01'),
    scopeOfWorks: 'Worker housing units and supporting facilities.',
    blocks: [
      { blockId: 'F1', name: 'Block F1', type: 'apartment', totalFloors: 6 },
    ],
    status: 'planning',
  },
  {
    title: 'Ngong Ridge Residences',
    contractNo: 'MLPWHUD/SDHUD/AHP/361/2024-2025',
    county: 'Kajiado',
    financier: 'Equity Bank',
    contractor: 'RIDGEWAY CONSTRUCTORS',
    contractPeriod: 18,
    commencementDate: new Date('2024-12-10'),
    endingDate: new Date('2026-06-10'),
    scopeOfWorks: 'Residential blocks with retaining walls.',
    blocks: [
      { blockId: 'G1', name: 'Block G1', type: 'apartment', totalFloors: 10 },
    ],
    status: 'active',
  },
  {
    title: 'Nanyuki Meadows Estate',
    contractNo: 'MLPWHUD/SDHUD/AHP/372/2024-2025',
    county: 'Laikipia',
    financier: 'KCB',
    contractor: 'MEADOWS BUILDERS LTD',
    contractPeriod: 13,
    commencementDate: new Date('2025-01-20'),
    endingDate: new Date('2026-02-20'),
    scopeOfWorks: 'Affordable housing units and water works.',
    blocks: [
      { blockId: 'H1', name: 'Block H1', type: 'apartment', totalFloors: 8 },
    ],
    status: 'active',
  },
  {
    title: 'Eldoret Skyline Homes',
    contractNo: 'MLPWHUD/SDHUD/AHP/385/2024-2025',
    county: 'Uasin Gishu',
    financier: 'Family Bank',
    contractor: 'SKYLINE CIVILS LTD',
    contractPeriod: 17,
    commencementDate: new Date('2024-10-01'),
    endingDate: new Date('2026-03-01'),
    scopeOfWorks: 'High-rise residential blocks and services.',
    blocks: [
      { blockId: 'I1', name: 'Block I1', type: 'apartment', totalFloors: 11 },
    ],
    status: 'active',
  },
  {
    title: 'Meru Hilltop Estate',
    contractNo: 'MLPWHUD/SDHUD/AHP/399/2024-2025',
    county: 'Meru',
    financier: 'Co-op Bank',
    contractor: 'HILLTOP DEVELOPERS',
    contractPeriod: 12,
    commencementDate: new Date('2025-02-01'),
    endingDate: new Date('2026-02-01'),
    scopeOfWorks: 'Affordable housing with access roads.',
    blocks: [
      { blockId: 'J1', name: 'Block J1', type: 'apartment', totalFloors: 7 },
    ],
    status: 'planning',
  },
];

const reportSeeds = [
  { contractNo: 'MLPWHUD/SDHUD/AHP/196/2023-2024', date: '2025-02-03' },
  { contractNo: 'MLPWHUD/SDHUD/AHP/196/2023-2024', date: '2025-02-04' },
  { contractNo: 'MLPWHUD/SDHUD/AHP/210/2023-2024', date: '2025-02-03' },
  { contractNo: 'MLPWHUD/SDHUD/AHP/210/2023-2024', date: '2025-02-05' },
  { contractNo: 'MLPWHUD/SDHUD/AHP/305/2024-2025', date: '2025-02-03' },
  { contractNo: 'MLPWHUD/SDHUD/AHP/322/2024-2025', date: '2025-02-04' },
  { contractNo: 'MLPWHUD/SDHUD/AHP/337/2024-2025', date: '2025-02-05' },
  { contractNo: 'MLPWHUD/SDHUD/AHP/350/2024-2025', date: '2025-02-06' },
  { contractNo: 'MLPWHUD/SDHUD/AHP/361/2024-2025', date: '2025-02-07' },
  { contractNo: 'MLPWHUD/SDHUD/AHP/372/2024-2025', date: '2025-02-08' },
];

const buildTeamSample = () => ([
  {
    name: 'Masonry Team',
    members: [
      { name: 'John Waweru', role: 'Mason' },
      { name: 'Grace Njeri', role: 'Mason' },
    ],
    activities: [
      {
        location: { block: 'A1', floor: '2', area: 'Stairwell' },
        description: 'Completed blockwork for stairwell walls.',
        photos: [],
      },
    ],
  },
]);

const buildConcernsSample = () => ([
  {
    description: 'Delayed delivery of reinforcement bars.',
    location: { block: 'A1', floor: '1', area: 'Storage' },
    severity: 'medium',
    status: 'open',
    photos: [],
  },
]);

const run = async () => {
  await mongoose.connect(MONGO_URI);

  await Project.bulkWrite(
    projectSeeds.map((project) => ({
      updateOne: {
        filter: { contractNo: project.contractNo },
        update: { $set: project },
        upsert: true,
      },
    }))
  );

  const projects = await Project.find(
    { contractNo: { $in: projectSeeds.map((p) => p.contractNo) } },
    { _id: 1, contractNo: 1 }
  );

  const projectIdByContract = new Map(
    projects.map((project) => [project.contractNo, project._id])
  );

  let createdReports = 0;
  for (const seed of reportSeeds) {
    const projectId = projectIdByContract.get(seed.contractNo);
    if (!projectId) continue;

    const reportDate = new Date(seed.date);
    const exists = await DailyReport.findOne({
      project: projectId,
      date: reportDate,
    }).select('_id');

    if (exists) continue;

    await DailyReport.create({
      project: projectId,
      date: reportDate,
      workflow: { status: 'submitted', submittedAt: new Date(seed.date) },
      weather: { morning: 'Sunny', afternoon: 'Cloudy', workable: true },
      teams: buildTeamSample(),
      workforceSummary: [
        { role: 'Mason', count: 6 },
        { role: 'Carpenter', count: 3 },
      ],
      concerns: buildConcernsSample(),
      safetyHazards: [],
      safetyHazardsNoneFound: true,
      safetySummary: 'No incidents reported.',
      visitors: [
        { name: 'Eng. Ochieng', company: 'Consultant', purpose: 'Site check' },
      ],
    });

    createdReports += 1;
  }

  const projectCount = await Project.countDocuments({
    contractNo: { $in: projectSeeds.map((p) => p.contractNo) },
  });

  const reportCount = await DailyReport.countDocuments({
    project: { $in: projects.map((project) => project._id) },
  });

  console.log(`Seeded projects: ${projectCount}`);
  console.log(`Seeded daily reports (total for seeded projects): ${reportCount}`);
  console.log(`New daily reports created this run: ${createdReports}`);

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  mongoose.disconnect().finally(() => process.exit(1));
});
