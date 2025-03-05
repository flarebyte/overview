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
