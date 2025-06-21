#!/usr/bin/env zx
$.verbose = false;

const npmPackages = JSON.parse(
  await $`gh search repos --owner flarebyte --visibility public --topic npm-package --json name,description`
);

const npmCliPackages = JSON.parse(
  await $`gh search repos --owner flarebyte --visibility public --topic npm-cli --json name,description`
);

const dartPackages = JSON.parse(
  await $`gh search repos --owner flarebyte --visibility public --topic dart-package --json name,description`
);

const flutterPackages = JSON.parse(
  await $`gh search repos --owner flarebyte --visibility public --topic flutter-package --json name,description`
);

const goCliPackages = JSON.parse(
  await $`gh search repos --owner flarebyte --visibility public --topic go-cli --json name,description`
);

const sortedByNameAsc = (a, b) => {
  if (a.name > b.name) return 1;
  if (a.name < b.name) return -1;
  return 0;
};

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

const scoreDartTable = dartPackages
  .sort(sortedByNameAsc)
  .map(
    (row) =>
      `| [${row.name}](https://github.com/flarebyte/${row.name}) | ${row.description} |`
  )
  .join('\n');

const scoreFlutterTable = flutterPackages
  .sort(sortedByNameAsc)
  .map(
    (row) =>
      `| [${row.name}](https://github.com/flarebyte/${row.name}) | ${row.description} |`
  )
  .join('\n');

const scoreGoCliTable = goCliPackages
  .sort(sortedByNameAsc)
  .map(
    (row) =>
      `| [${row.name}](https://github.com/flarebyte/${row.name}) | ${row.description} |`
  )
  .join('\n');

const mdReadme = `
# Overview

> Overview of Flarebyte.com codebase

* [Software health](SOFTWARE-HEALTH.md)
* [Software timeline](./SOFTWARE-TIMELINE.md)
* [NPM Software dependencies](./NPM-SOFTWARE-DEPENDENCIES.md)
* [Other Software dependencies](./OTHER-SOFTWARE-DEPENDENCIES.md)

## Typescript/Javascript libraries

| Name | Description |
|------| ------------|
${scoreLibTable}

## Typescript/Javascript CLI

| Name | Description |
|------| ------------|
${scoreCliTable}

## Flutter libraries

| Name | Description |
|------| ------------|
${scoreFlutterTable}

## Dart libraries

| Name | Description |
|------| ------------|
${scoreDartTable}

## Go CLI

| Name | Description |
|------| ------------|
${scoreGoCliTable}
`;

await fs.writeFile('README.md', mdReadme, { encoding: 'utf8' });
