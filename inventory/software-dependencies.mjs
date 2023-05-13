#!/usr/bin/env zx

const safeParse = (value) => {
  try {
    const jsonObject = JSON.parse(value);
    return jsonObject;
  } catch (e) {
    echo(e);
    return {};
  }
};

const npmPackages = JSON.parse(
  await $`gh search repos --owner flarebyte --visibility public --topic npm-package --json name,description`
);

const npmCliPackages = JSON.parse(
  await $`gh search repos --owner flarebyte --visibility public --topic npm-cli --json name,description`
);

const allNpmPackages = [...npmPackages, ...npmCliPackages];

const getNpmInfo = async ({ name, description }) => {
  const dependenciesJson = await $`npm info ${name} --json dependencies`;
  const dependencies = Object.keys(safeParse(dependenciesJson));

  return {
    name,
    description,
    dependencies,
  };
};

const npmDependencies = await Promise.all(allNpmPackages.map(getNpmInfo));

const sortedByNameAsc = (a, b) => {
  if (a.name > b.name) return 1;
  if (a.name < b.name) return -1;
  return 0;
};

const countDependencies = (listOfNpmDependencies) => {
  const counter = {};
  for (const someDependencies of listOfNpmDependencies) {
    for (const dependency of someDependencies.dependencies) {
      const previous = counter[dependency];
      const newTotal = counter[dependency] === undefined ? 1 : previous + 1;
      counter[dependency] = newTotal;
    }
  }
  return Object.entries(counter)
    .map((kv) => ({ name: kv[0], count: kv[1] }))
    .sort(sortedByNameAsc);
};

const codeMarker = (tag) => '```' + tag;

const scoreRows = countDependencies(npmDependencies);

const scoreToStars = (score) => {
  if (score === 0) {
    return '';
  }

  const logScore = Math.ceil(Math.log(score) / Math.log(3));
  return '✰'.repeat(logScore);
};

const scoreDepsTable = scoreRows
  .map(
    (keyScore) =>
      `| ${keyScore.name} | ${keyScore.name} | ${scoreToStars(
        keyScore.count
      )} | ${keyScore.count} |`
  )
  .join('\n');

const scoreLibTable = npmPackages
  .sort(sortedByNameAsc)
  .map(
    (row) =>
      `| [${row.name}](https://github.com/flarebyte/${row.name}) | ${row.description} |`
  )
  .join('\n');

const scoreCliTable = npmCliPackages
  .sort(sortedByNameAsc)
  .map(
    (row) =>
      `| [${row.name}](https://github.com/flarebyte/${row.name}) | ${row.description} |`
  )
  .join('\n');

const mdReport = `
# Software dependencies

> Production NPM dependencies ranking based on usage.

## Production dependencies table

| Name | Description | Score | Rank  |
|------| ------------|-------|-------|
${scoreDepsTable}
`;

await fs.writeFile('SOFTWARE-DEPENDENCIES.md', mdReport, { encoding: 'utf8' });

const mdReadme = `
# Overview

> Overview of Flarebyte.com codebase

* [Software health](SOFTWARE-HEALTH.md)
* [Software timeline](./SOFTWARE-TIMELINE.md)
* [Software dependencies](./SOFTWARE-DEPENDENCIES.md)

## Typescript/Javascript libraries

| Name | Description |
|------| ------------|
${scoreLibTable}

## Typescript/Javascript CLI

| Name | Description |
|------| ------------|
${scoreCliTable}
`;

await fs.writeFile('README.md', mdReadme, { encoding: 'utf8' });
