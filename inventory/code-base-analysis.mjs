import {
  getRepos,
  resetTempFolder,
  cloneFlarebyteRepositories,
} from './utility.mjs';

const npmPackageRepo = await getRepos('npm-package');
const folder = await resetTempFolder('npm-package');