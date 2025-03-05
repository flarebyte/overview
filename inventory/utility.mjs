export const getRepos = async (topicName) => {
  return JSON.parse(
    await $`gh search repos --owner flarebyte --visibility public --topic ${topicName} --json name,description,updatedAt`
  );
};

/** Empty the temporary folder */
export const resetTempFolder = async (suffix) => {
  const folderName = `/tmp/overview/${suffix}`;
  await fs.emptyDir(`/tmp/overview/${suffix}`); //let's make sure we don't delete the whole disk
  return folderName;
};

/** Clone flarebyte Github Repositories into the folder */
export const cloneFlarebyteRepositories = async (folder, repositories) => {
  cd(folder);
  for await (const repo of repositories) {
    const ghName = `flarebyte/${repo.name}`;
    await $`gh repo clone ${ghName}`;
  }
};

/** Run scc command on the given folder */
export const runScc = async (folder) => {
  cd(folder);
  const sccResult = await $`scc --format json`;
  return JSON.parse(sccResult.stdout);
};

/** Run trivy fs command on the given folder */
export const runTrivyFs = async (folder) => {
  cd(folder);
  const sccResult = await $`trivy fs --format json . `;
  return JSON.parse(sccResult.stdout);
};

const mainVulnerabilityInfo = (vulnerability) => ({
  PkgName: vulnerability.PkgName,
  Severity: vulnerability.Severity,
});

function deleteKeysFromObject(obj, keysToDelete) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (!Array.isArray(keysToDelete)) {
    keysToDelete = [keysToDelete];
  }

  const newObj = { ...obj };

  for (const key of keysToDelete) {
    delete newObj[key];
  }

  return newObj;
}

function summariseVulnerabilities(vulnerabilities) {
  const severityCounts = {
    severity_high: {},
    severity_medium: {},
    severity_low: {},
  };

  vulnerabilities.forEach((vuln) => {
    const severityKey = `severity_${vuln.Severity.toLowerCase()}`;
    if (
      ['severity_high', 'severity_medium', 'severity_low'].includes(severityKey)
    ) {
      if (severityCounts[severityKey]) {
        if (severityCounts[severityKey][vuln.PkgName]) {
          severityCounts[severityKey][vuln.PkgName]++;
        } else {
          severityCounts[severityKey][vuln.PkgName] = 1;
        }
      }
    }
  });

  const formattedResults = {};

  for (const severity in severityCounts) {
    const packageCounts = severityCounts[severity];
    const formattedPackages = [];
    for (const pkgName in packageCounts) {
      formattedPackages.push({ name: pkgName, count: packageCounts[pkgName] });
    }
    if (formattedPackages.length > 0) {
      formattedResults[severity] = formattedPackages;
    }
  }

  return formattedResults;
}

/** summarize vulnaribilities keep a count for each dependency*/
export const trivyFsSummary = (content) => {
  const results = content.Results.flatMap((results) => results.Vulnerabilities)
    .filter((vulnerability) => vulnerability && vulnerability.Severity)
    .map(mainVulnerabilityInfo);
  return summariseVulnerabilities(results);
};

export const simplifyScc = (items) =>
  items
    .filter(
      (item) => !['License', 'gitignore', 'Plain Text'].includes(item.Name)
    )
    .filter((item) => item.Lines > 100)
    .map((item) => deleteKeysFromObject(item, ['WeightedComplexity', 'Files']));

export function convertToIndexedColumnsFormat(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return {};
  }

  const result = {};
  const keys = Object.keys(data[0]);

  for (const key of keys) {
    result[key] = {};

    for (let i = 0; i < data.length; i++) {
      if (data[i].hasOwnProperty(key)) {
        result[key][i.toString()] = data[i][key];
      } else {
        result[key][i.toString()] = null;
      }
    }
  }

  return result;
}

export function createArrayField(field, value, count) {
  const result = {};
  const array = [];
  for (let i = 0; i < count; i++) {
    array.push(value);
  }
  result[field] = array;
  return result;
}

export function getISODateString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}
