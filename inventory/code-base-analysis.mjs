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

const topic = 'npm-package';
const npmFolder = `/tmp/overview/${topic}`;
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

// const folder = await resetTempFolder('npm-package');
// console.log(`- Reset folder ${folder}`);

//await cloneFlarebyteRepositories(folder, npmPackageRepos);

const trivyFsJSON = await runTrivyFs(npmFolder);
const trivyFsData = trivyFsSummary(trivyFsJSON);
console.log(trivyFsData);

const countOfProjects = 10;
const sccJson = await runScc(npmFolder);
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
console.log(sccColumnMerged);
