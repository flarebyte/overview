#!/usr/bin/env zx
const healthFiles = await glob('software-health/*.software-health.yaml');

const docName = {
  code: ['readibility', 'refactoring', 'linting', 'generation'],
  deps: ['update', 'audit', 'diagram'],
  doc: [
    'user-guide',
    'developer-guide',
    'references-api',
    'references-schema',
    'references-glossary',
    'troubleshooting',
    'release-notes',
    'formatting',
    'spell-checking',
    'grammar',
    'proofreading',
    'accessibility-report',
    'security-report',
    'privacy-report',
    'support',
  ],
  diagram: [
    'architecture',
    'class',
    'sequence',
    'flow',
    'user-journey',
    'mindmap',
    'dependencies',
  ],
  test: [
    'unit',
    'regression',
    'functional',
    'integration',
    'end-to-end',
    'platform',
    'browser',
    'device',
    'accessibility',
  ],
  specs: [
    'business-cases',
    'user-stories',
    'cost-benefit-analysis',
    'risk-assessment',
    'roadmap',
    'interviews',
    'surveys',
  ],
  ux: [
    'user-research',
    'personas',
    'information-architecture',
    'user-flows',
    'wireframes',
    'prototyping',
  ],
  brainstorming: ['ideation', 'drawing'],
  ops: [
    'deployment',
    'monitoring',
    'rollback',
    'alerting',
    'backup',
    'infrastructure-as-code',
    'diagnosis',
  ],
  architecture: [
    'single-responsibility',
    'well-defined-interface',
    'degrades-gracefully',
    'loosely-coupled',
    'easy-to-understand',
    'clear-source-of-truth',
    'data-retention',
  ],
};

const scores = {};
const roughScoreToRank = (roughScore) => {
  let rank = 1;
  if (roughScore.automation === 'automatic') {
    rank += 1;
  }
  if (roughScore.deployment === 'ci') {
    rank += 1;
  }
  if (roughScore.performance === 'milli-seconds') {
    rank += 1;
  }
  if (roughScore.ai === 'full') {
    rank += 1;
  }
  return rank;
};

const initScores = () => {
  for (const rootKey of Object.keys(docName)) {
    const rootContent = docName[rootKey];
    for (const childKey of rootContent) {
      const roughScore = rootContent[childKey];
      const scoreKey = `${rootKey} ${childKey}`;
      scores[scoreKey] = 0;
    }
  }
};

const contentToScores = (jsonContent) => {
  for (const rootKey of Object.keys(jsonContent)) {
    if ((rootKey === 'title') | (rootKey === 'github')) {
      continue;
    }
    const rootContent = jsonContent[rootKey];
    for (const childKey of Object.keys(rootContent)) {
      const roughScore = rootContent[childKey];
      const scoreKey = `${rootKey} ${childKey}`;
      const previousScore =
        scores[scoreKey] === undefined ? 0 : scores[scoreKey];
      const newScore = previousScore + roughScoreToRank(roughScore);
      scores[scoreKey] = newScore;
    }
  }
};
initScores();
for (const healthFile of healthFiles) {
  const content = await fs.readFile(healthFile, { encoding: 'utf8' });
  contentToScores(YAML.parse(content));
}

const scoreToStars = (score) => {
  if (score === 0) {
    return '';
  }

  const logScore = Math.ceil(Math.log(score) / Math.log(3));
  return '✰'.repeat(logScore);
};
const scoreRows = Object.entries(scores).sort();

const summariseScores = () => {
  const summaryScoreCounting = {};
  for (const [scoreKey, score] of scoreRows) {
    const prefix = scoreKey.split(' ')[0];
    const previous = summaryScoreCounting[prefix];
    const newScore = previous === undefined ? score : previous + score;
    summaryScoreCounting[prefix] = newScore;
  }
  return Object.entries(summaryScoreCounting).sort();
};
const summaryScoreRows = summariseScores();

const scoreToSmiley = (score) => {
  if (score === 0) {
    return 0;
  }

  const logScore = Math.ceil(Math.log(score) / Math.log(3));
  return logScore;
};

const scoreTable = scoreRows
  .map(
    (keyScore) =>
      `| ${keyScore[0]} | ${scoreToStars(keyScore[1])} | ${keyScore[1]} |`
  )
  .join('\n');

const scoreUserJourney = summaryScoreRows
  .map((keyScore) => `    ${keyScore[0]}: ${scoreToSmiley(keyScore[1])}: Team`)
  .join('\n');

const codeMarker = (tag) => '```' + tag;

const mdReport = `
# Software health

## Team journey overview

${codeMarker('mermaid')}
journey
    title My working day
${scoreUserJourney}

${codeMarker('')}

## Fine grain health table

| Document | Score | Rank  |
|----------| ------|-------|
${scoreTable}
`;
await fs.writeFile('SOFTWARE-HEALTH.md', mdReport, { encoding: 'utf8' });
