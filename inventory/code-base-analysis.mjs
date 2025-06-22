#!/usr/bin/env zx

import {
  getRepos,
  resetTempFolder,
  cloneFlarebyteRepositories,
  runScc,
  runTrivyFs,
  trivyFsSummary,
  simplifyScc,
  convertToIndexedColumnsFormat,
  createObjectField,
  getISODateString,
  getFieldLength,
  countTests,
  runClingy,
  runClingyAggregate,
} from './utility.mjs';

/** Clone all the github projects for given topic*/
const processRepositoriesByTopic = async (topic, options) => {
  const folder = `/tmp/overview/${topic}`;
  const packageRepos = await getRepos(topic);
  const numberOfDaysSinceCreation = packageRepos.map(
    (repo) => repo.numberOfDaysSinceCreation
  );
  const numberOfDaysSincePush = packageRepos.map(
    (repo) => repo.numberOfDaysSincePush
  );
  const numberOfDaysOfActivity = packageRepos.map(
    (repo) => repo.numberOfDaysOfActivity
  );
  const sizes = packageRepos.map((repo) => repo.size);

  if (options.clone) {
    await resetTempFolder(topic);
    console.log(`- Reset folder ${folder}`);

    await cloneFlarebyteRepositories(folder, packageRepos);
  }
  const trivyFsJSON = await runTrivyFs(folder);
  const trivyFsData = trivyFsSummary(trivyFsJSON);
  // scc
  const countOfProjects = 10;
  const sccJson = await runScc(folder);
  const sccColumns = convertToIndexedColumnsFormat(simplifyScc(sccJson));
  const rowCount = getFieldLength(sccColumns.Name);

  const numberOfTests = await countTests(folder);

  const sccColumnMerged = {
    ...createObjectField('Date', getISODateString(), rowCount),
    ...createObjectField('Projects', countOfProjects, rowCount),
    ...createObjectField('Category', topic, rowCount),
    ...createObjectField(
      'numberOfDaysSinceCreation',
      numberOfDaysSinceCreation,
      rowCount
    ),
    ...createObjectField(
      'numberOfDaysSincePush',
      numberOfDaysSincePush,
      rowCount
    ),
    ...createObjectField(
      'numberOfDaysOfActivity',
      numberOfDaysOfActivity,
      rowCount
    ),
    ...createObjectField('sizes', sizes, rowCount),
    ...createObjectField(
      'severity_high',
      trivyFsData?.severity_high?.length || 0,
      rowCount
    ),
    ...createObjectField(
      'severity_medium',
      trivyFsData?.severity_medium?.length || 0,
      rowCount
    ),
    ...createObjectField(
      'severity_low',
      trivyFsData?.severity_low?.length || 0,
      rowCount
    ),
    ...sccColumns,
    ...createObjectField('tests', numberOfTests, rowCount),
  };

  const clingyJson = await runClingy(folder);
  const clingyAggregateJson = await runClingyAggregate(folder);

  cd(process.env.PWD);
  await fs.writeJson(
    `./data/${topic}-${getISODateString()}.json`,
    sccColumnMerged
  );

  await fs.writeJson(`./${topic}-clingy.json`, clingyJson);
  await fs.writeJson(`./${topic}-clingy-aggregate.json`, clingyAggregateJson);
};

await processRepositoriesByTopic('npm-package', { clone: true });
await processRepositoriesByTopic('npm-cli', { clone: true });
await processRepositoriesByTopic('dart-package', { clone: true });
await processRepositoriesByTopic('flutter-package', { clone: true });
await processRepositoriesByTopic('go-cli', { clone: true });
