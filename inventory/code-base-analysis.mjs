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
  createArrayField,
  getISODateString
} from './utility.mjs';

const npmFolder = '/tmp/overview/npm-package';

// const npmPackageRepos = await getRepos('npm-package');
// const folder = await resetTempFolder('npm-package');
// console.log(`- Reset folder ${folder}`);

// await cloneFlarebyteRepositories(folder, npmPackageRepos);

const sccJson = await runScc(npmFolder);
const scc2 = convertToIndexedColumnsFormat(simplifyScc(sccJson));
const scc3 = {...createArrayField('Date', getISODateString(), 5), ...scc2};
console.log(scc3);

// const trivyFsJSON = await runTrivyFs(npmFolder);
// console.log(trivyFsSummary(trivyFsJSON));
