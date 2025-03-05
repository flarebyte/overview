#!/usr/bin/env zx

import {
  getRepos,
  resetTempFolder,
  cloneFlarebyteRepositories,
  runScc,
  runTrivyFs,
  trivyFsSummary,
  simplifyScc,
  convertToIndexedColumnsFormat
} from './utility.mjs';

const npmFolder = '/tmp/overview/npm-package';

// const npmPackageRepos = await getRepos('npm-package');
// const folder = await resetTempFolder('npm-package');
// console.log(`- Reset folder ${folder}`);

// await cloneFlarebyteRepositories(folder, npmPackageRepos);

const sccJson = await runScc(npmFolder);
console.log(convertToIndexedColumnsFormat(simplifyScc(sccJson)));

// const trivyFsJSON = await runTrivyFs(npmFolder);
// console.log(trivyFsSummary(trivyFsJSON));
