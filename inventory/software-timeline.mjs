#!/usr/bin/env zx

const npmPackages = JSON.parse(
  await $`gh search repos --owner flarebyte --visibility public --topic npm-package --json name,description`
);

const npmCliPackages = JSON.parse(
  await $`gh search repos --owner flarebyte --visibility public --topic npm-cli --json name,description`
);

const asVersionTime = (keyValue) => ({
  version: keyValue[0],
  time: keyValue[1].slice(0, 10),
});
const getNpmInfo = async ({ name, description }) => {
  const timeline = Object.entries(
    JSON.parse(await $`npm info ${name} --json time`)
  )
    .map(asVersionTime)
    .filter((versionTime) => versionTime.version !== 'modified');
  const years = timeline.map(
    (versionTime) =>
      parseInt(versionTime.time.slice(0, 4)) +
      parseInt(versionTime.time.slice(5, 7)) / 100
  );

  return {
    name,
    description,
    timeline,
    maxYear: Math.max(...years),
    minYear: Math.min(...years),
  };
};

const spaces = '    ';

const sortedByYearAsc = (a, b) => {
  if (a.minYear > b.minYear) return 1;
  if (a.minYear < b.minYear) return -1;
  return 0;
};

const npmTimelines = (await Promise.all(npmPackages.map(getNpmInfo))).sort(
  sortedByYearAsc
);

const npmCliTimelines = (
  await Promise.all(npmCliPackages.map(getNpmInfo))
).sort(sortedByYearAsc);

const toGantTasks = (timeline) =>
  timeline
    .map((period) => `${spaces}${period.version}:, ${period.time}, 1d`)
    .join('\n');

const toGantSection = (npmTimeline) =>
  `
${spaces}section ${npmTimeline.name}
${toGantTasks(npmTimeline.timeline)}
`;

const isNotRecentSection = (npmTimeline) =>
  npmTimeline.minYear <= new Date().getFullYear() - 4;

const isRecentSection = (npmTimeline) => !isNotRecentSection(npmTimeline);

const toGantSections = (anyNpmTimelines) =>
  anyNpmTimelines.map(toGantSection).join('\n');

const codeMarker = (tag) => '```' + tag;

const mdReport = `
# Software publishing timeline

## Typescript and Javascript libraries

### Latest

${codeMarker('mermaid')}
gantt
${spaces}title Typescript and Javascript libraries
${spaces}dateFormat  YYYY-MM-DD
${toGantSections(npmTimelines.filter(isRecentSection))}
${codeMarker('')}

### Historical

${codeMarker('mermaid')}
gantt
${spaces}title Typescript and Javascript libraries
${spaces}dateFormat  YYYY-MM-DD
${toGantSections(npmTimelines.filter(isNotRecentSection))}
${codeMarker('')}

## Typescript and Javascript CLI

### Latest

${codeMarker('mermaid')}
gantt
${spaces}title Typescript and Javascript CLI
${spaces}dateFormat  YYYY-MM-DD
${toGantSections(npmCliTimelines.filter(isRecentSection))}
${codeMarker('')}

### Historical

${codeMarker('mermaid')}
gantt
${spaces}title Typescript and Javascript CLI
${spaces}dateFormat  YYYY-MM-DD
${toGantSections(npmCliTimelines.filter(isNotRecentSection))}
${codeMarker('')}

`;

await fs.writeFile('SOFTWARE-TIMELINE.md', mdReport, { encoding: 'utf8' });
