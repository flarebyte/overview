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
} from './utility.mjs';

/** Clone all the github projects for given topic*/
const processRepositoriesByTopic = async (topic, options) => {
  const folder = `/tmp/overview/${topic}`;
  const npmPackageRepos = await getRepos(topic);
  const numberOfDaysSinceCreation = npmPackageRepos.map(
    (repo) => repo.numberOfDaysSinceCreation
  );
  const numberOfDaysSincePush = npmPackageRepos.map(
    (repo) => repo.numberOfDaysSincePush
  );
  const numberOfDaysOfActivity = npmPackageRepos.map(
    (repo) => repo.numberOfDaysOfActivity
  );
  const sizes = npmPackageRepos.map((repo) => repo.size);

  if (options.clone) {
    await resetTempFolder(topic);
    console.log(`- Reset folder ${folder}`);

    await cloneFlarebyteRepositories(folder, npmPackageRepos);
  }
  const trivyFsJSON = await runTrivyFs(folder);
  const trivyFsData = trivyFsSummary(trivyFsJSON);

  const countOfProjects = 10;
  const sccJson = await runScc(folder);
  const sccColumns = convertToIndexedColumnsFormat(simplifyScc(sccJson));
  const rowCount = getFieldLength(sccColumns.Name);
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
  };

  cd(process.env.PWD);
  await fs.writeJson(
    `./data/${topic}-${getISODateString()}.json`,
    sccColumnMerged
  );
};

await processRepositoriesByTopic('npm-package', { clone: false });
await processRepositoriesByTopic('npm-cli', { clone: false });
await processRepositoriesByTopic('dart-package', { clone: true });
await processRepositoriesByTopic('flutter-package', { clone: true });
