#!/usr/bin/env zx

const npmPackages = JSON.parse(
  await $`gh search repos --owner flarebyte --visibility public --topic npm-package --json name,description`
);

const asVersionTime = (keyValue) => ({
  version: keyValue[0],
  time: keyValue[1].slice(0, 10),
});
const getNpmInfo = async ({ name, description }) => ({
  name,
  description,
  timeline: Object.entries(
    JSON.parse(await $`npm info ${name} --json time`)
  ).map(asVersionTime),
});

const npmTimelines = await Promise.all(npmPackages.map(getNpmInfo));

const toGantTasks = (timeline) =>
  timeline
    .map((period) => `   ${period.version}:, ${period.time}, 1d`)
    .join('\n');

const toGantSection = (npmTimeline) =>
  `
    section ${npmTimeline.name}
${toGantTasks(npmTimeline.timeline)}
`;

const toGantSections = (anyNpmTimelines) =>
  anyNpmTimelines.map(toGantSection).join('\n');

const codeMarker = (tag) => '```' + tag;

const mdReport = `
# Software publishing timeline

## Gantt of publishing libraries

${codeMarker('mermaid')}
gantt
    title Flarebyte.com library publishing
    dateFormat  YYYY-MM-DD
${toGantSections(npmTimelines)}
${codeMarker('')}

`;

await fs.writeFile('SOFTWARE-TIMELINE.md', mdReport, { encoding: 'utf8' });
