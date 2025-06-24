#!/usr/bin/env zx
$.verbose = false;
import {
  loadClingyByTopicJson,
  addProjectFromPath,
  extractProjectSet,
  idFromString,
} from './utility.mjs';

const today = new Date();

/**
 * Fetch package metadata from pub.dev.
 * @param {string} name - The pub.dev package name.
 * @returns {Promise<object|undefined>} JSON response or undefined if failed.
 */
export async function fetchPubPackage({ name, count }) {
  const url = `https://pub.dev/api/packages/${name}`;
  try {
    const response = await fetch(url);

    if (response.status === 200) {
      const fullResponse = await response.json();
      const { name, version, description, repository } =
        fullResponse.latest.pubspec;
      const published = fullResponse.latest.published;
      const modifiedDate = new Date(published);
      const differenceInMs = today - modifiedDate;
      const modifiedInDays = differenceInMs / (1000 * 60 * 60 * 24);
      return {
        name,
        description,
        homepage: repository,
        version,
        modifiedInDays,
        count,
      };
    } else {
      console.error(
        chalk.red(`❌ Failed to fetch package `) +
          chalk.bold(name) +
          chalk.red(`. Status: ${response.status}`)
      );
      return undefined;
    }
  } catch (err) {
    console.error(
      chalk.red(`❌ Network error while fetching `) +
        chalk.bold(name) +
        chalk.red(`: ${err.message}`)
    );
    return undefined;
  }
}

const dartPackage = (await loadClingyByTopicJson('dart-package')).map(
  addProjectFromPath
);
const dartPackageAggregate = await loadClingyByTopicJson(
  'dart-package',
  '-aggregate'
);
const flutterPackage = (await loadClingyByTopicJson('flutter-package')).map(
  addProjectFromPath
);
const flutterPackageAggregate = await loadClingyByTopicJson(
  'flutter-package',
  '-aggregate'
);
const dartAndFlutterPackages = [...dartPackage, ...flutterPackage];
const projects = extractProjectSet(dartAndFlutterPackages);

export function packageInfoToEdges() {
  const edges = [];
  const dartSet = new Set();
  const flutterSet = new Set();
  for (const dartPack of dartPackage) {
    const { Name, project } = dartPack;
    dartSet.add(project);
    if (!projects.has(Name)) continue;
    edges.push({ from: project, to: Name });
  }
  for (const flutterPack of flutterPackage) {
    const { Name, project } = flutterPack;
    flutterSet.add(project);
    if (!projects.has(Name)) continue;
    edges.push({ from: project, to: Name });
  }

  const dartNodes = [...dartSet].sort().map((name) => ({ name, kind: 'Dart' }));
  const flutterNodes = [...flutterSet]
    .sort()
    .map((name) => ({ name, kind: 'Flutter' }));

  const nodes = [...dartNodes, ...flutterNodes];
  return { edges, nodes };
}

const diagramEdges = packageInfoToEdges();
const toMermaid = ({ edges, nodes }) => {
  const header = `---
title: Dart & Flutter dependencies
---
flowchart LR
`;
  const nodeToMermaid = (node) =>
    `${idFromString(node.name)}["${node.name} (${node.kind})"]`;
  const nodeSection = nodes.map(nodeToMermaid).join('\n');
  return header + nodeSection;
};
console.log(toMermaid(diagramEdges));

// const packageInfo = await fetchPubPackage({ name: 'http', count: 1 });
// console.log(packageInfo);
