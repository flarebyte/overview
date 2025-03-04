export const getRepos = async (topicName) => {
  return JSON.parse(
    await $`gh search repos --owner flarebyte --visibility public --topic ${topicName} --json name,description,updatedAt`
  );
};

export const resetTempFolder = async (suffix) => {
  const folderName = `/tmp/overview/${suffix}`;
  await fs.emptyDir(`/tmp/overview/${suffix}`); //let's make sure we don't delete the whole disk
  return folderName;
};

export const cloneFlarebyteRepositories = async (folder, repositories) => {
  cd(folder);
  for await (const repo of repositories) {
    const ghName = `flarebyte/${repo.name}`;
    await $`gh repo clone ${ghName}`;
  }
};
