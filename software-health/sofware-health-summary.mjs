#!/usr/bin/env zx

const healthFiles = await glob('software-health/*.software-health.yaml')
for (const healthFile of healthFiles) {
  const content = await fs.readFile(healthFile, { encoding: 'utf8'})
  console.log(YAML.parse(content))
}