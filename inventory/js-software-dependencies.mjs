#!/usr/bin/env zx
$.verbose = false;
import { scoreToStars, updatedToFlag } from './utility.mjs';

const today = new Date();

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
  let dependencies = [];
  try {
    const dependenciesJson = await $`npm info ${name} --json dependencies`;
    dependencies = Object.keys(safeParse(dependenciesJson));
  } catch (error) {
    console.info(`Could not find npm info for ${name}`);
  }

  return {
    name,
    description,
    dependencies,
  };
};

const getNpmInfoForLib = async ({ name, count }) => {
  const npmJson =
    await $`npm info ${name} --json name description homepage version time`;
  const {
    description,
    homepage,
    version,
    time: { modified },
  } = safeParse(npmJson);
  const modifiedDate = new Date(modified);
  const differenceInMs = today - modifiedDate;
  const modifiedInDays = differenceInMs / (1000 * 60 * 60 * 24);
  return {
    name,
    description,
    homepage,
    version,
    modifiedInDays,
    count,
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

const scoreRows = countDependencies(npmDependencies);
const childNpmDependencies = await Promise.all(
  scoreRows.map((row) => getNpmInfoForLib(row))
);

const homepageOrName = (keyScore) =>
  keyScore.homepage === undefined
    ? keyScore.name
    : `[${keyScore.name}](${keyScore.homepage})`;

const scoreDepsTable = childNpmDependencies
  .map(
    (keyScore) =>
      `| ${homepageOrName(keyScore)} | ${keyScore.description} | ${scoreToStars(
        keyScore.count
      )} | ${keyScore.count} |${keyScore.version} | ${updatedToFlag(
        keyScore.modifiedInDays
      )} |`
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

| Name | Description | Score | Use | Version | Updated |
|------| ------------|-------|-----|---------|---------|
${scoreDepsTable}
`;

await fs.writeFile('NPM-SOFTWARE-DEPENDENCIES.md', mdReport, {
  encoding: 'utf8',
});
