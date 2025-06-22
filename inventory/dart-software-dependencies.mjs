#!/usr/bin/env zx
$.verbose = false;

const today = new Date();

/**
 * Fetch package metadata from pub.dev.
 * @param {string} name - The pub.dev package name.
 * @returns {Promise<object|undefined>} JSON response or undefined if failed.
 */
export async function fetchPubPackage ({ name, count }){
  const url = `https://pub.dev/api/packages/${name}`;
  try {
    const response = await fetch(url);

    if (response.status === 200) {
      const fullResponse = await response.json();
      const { name, version, description, repository } =
        fullResponse.latest.pubspec;
      const published = fullResponse.latest.published;
      const modifiedDate = new Date(published);
      const differenceInMs = today - modifiedDate;
      const modifiedInDays = differenceInMs / (1000 * 60 * 60 * 24);
      return {
        name,
        description,
        homepage: repository,
        version,
        modifiedInDays,
        count,
      };
    } else {
      console.error(
        chalk.red(`❌ Failed to fetch package `) +
          chalk.bold(name) +
          chalk.red(`. Status: ${response.status}`)
      );
      return undefined;
    }
  } catch (err) {
    console.error(
      chalk.red(`❌ Network error while fetching `) +
        chalk.bold(name) +
        chalk.red(`: ${err.message}`)
    );
    return undefined;
  }
}

const packageInfo = await fetchPubPackage({name: 'http', count: 1});
console.log(packageInfo);
