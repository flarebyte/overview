#!/usr/bin/env zx
$.verbose = false;
import {
  loadClingyByTopicJson,
  addProjectFromPath,
  extractProjectSet,
  idFromString,
  renderDotToPng,
  deduplicateStrings,
  scoreToStars,
  updatedToFlag,
} from './utility.mjs';

const today = new Date();

/**
 * Fetch package metadata from pub.dev.
 * @param {string} name - The pub.dev package name.
 * @returns {Promise<object|undefined>} JSON response or undefined if failed.
 */
export async function fetchPubPackage({
  Name,
  Count,
  MinVersion,
  MaxVersion,
  Category,
}) {
  const url = `https://pub.dev/api/packages/${Name}`;
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
        Name: name,
        description,
        homepage: repository,
        version,
        modifiedInDays,
        Count,
        MinVersion,
        MaxVersion,
        Category,
      };
    } else {
      console.error(
        chalk.red(`❌ Failed to fetch package `) +
          chalk.bold(Name) +
          chalk.red(`. Status: ${response.status}`)
      );
      return undefined;
    }
  } catch (err) {
    console.error(
      chalk.red(`❌ Network error while fetching `) +
        chalk.bold(Name) +
        chalk.red(`: ${err.message}`)
    );
    return undefined;
  }
}

const byProd = (row) => row.Category === 'prod';

const dartPackage = (await loadClingyByTopicJson('dart-package')).map(
  addProjectFromPath
);
const dartPackageAggregate = (
  await loadClingyByTopicJson('dart-package', '-aggregate')
).filter(byProd);

const flutterPackage = (await loadClingyByTopicJson('flutter-package')).map(
  addProjectFromPath
);
const flutterPackageAggregate = (
  await loadClingyByTopicJson('flutter-package', '-aggregate')
).filter(byProd);
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

  const dartNodes = [...dartSet]
    .sort()
    .map((name) => ({ name, kind: 'Dart', color: 'blue' }));
  const flutterNodes = [...flutterSet]
    .sort()
    .map((name) => ({ name, kind: 'Flutter', color: 'green' }));

  const nodes = [...dartNodes, ...flutterNodes];
  return { edges, nodes };
}

const diagramEdges = packageInfoToEdges();
const toMermaid = ({ edges, nodes }) => {
  const nodeToMermaid = (node) =>
    `${idFromString(node.name)} [label="${node.name} (${node.kind})", color=${
      node.color
    }, style=filled, fillcolor=light${node.color}];`;
  const nodeSection = nodes.map(nodeToMermaid).join('\n');

  const eddeToMermaid = (edge) =>
    `${idFromString(edge.from)} -> ${idFromString(edge.to)}`;
  const edgeSecion = deduplicateStrings(edges.map(eddeToMermaid)).join('\n');
  return nodeSection + '\n' + edgeSecion;
};
const diagram = toMermaid(diagramEdges);
const dotContent = ['digraph SimpleGraph {', diagram, '}'];

await fs.outputFile(
  './dart-software-dependencies.dot',
  dotContent.join('\n'),
  'utf8'
);

await renderDotToPng('dart-software-dependencies');

const toTableRow = (r) =>
  `|${r.Name}|${r.description}|${scoreToStars(r.Count)} |${r.Count}|${
    r.MinVersion
  }|${r.MaxVersion}|${r.version}|${updatedToFlag(r.modifiedInDays)}|}`;
const scoreDepsDartTable = dartPackageAggregate.map(toTableRow).join('\n');

const scoreDepsFlutterTable = flutterPackageAggregate
  .map(toTableRow)
  .join('\n');
const mdTable = (table) => `
| Name | Description | Score | Use | Min Version | Max Version | Latest Version | Updated |
|------| ------------|-------|-----|-------------|-------------|----------------| --------|
${table}
`;

const content = [
  '# Dart and Flutter dependencies',
  '## Graph overview',
  '![Dart software dependencies graph](dart-software-dependencies.png)',
  '## Dart production dependencies table',
  '',
  mdTable(scoreDepsDartTable),
  '## Flutter production dependencies table',
  '',
  mdTable(scoreDepsFlutterTable),
];

await fs.outputFile(
  './DART-SOFTWARE-DEPENDENCIES.md',
  content.join('\n'),
  'utf8'
);

// const packageInfo = await fetchPubPackage({ Name: 'http', Count: 1 });
// console.log(packageInfo);
