#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { glob } from 'glob';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import pLimit from 'p-limit';

const limit = pLimit(5);

const validateDirectory = (inputPath) => {
    if (!fs.existsSync(inputPath) || !fs.lstatSync(inputPath).isDirectory()) {
        throw new Error(`The provided path (${inputPath}) is not a valid directory.`);
    }

    return inputPath;
};

const hashFile = async (algorithm, path) => {
    const fileBuffer = await fs.readFile(path);
    const hashSum = crypto.createHash(algorithm);
    hashSum.update(fileBuffer);

    return hashSum.digest('hex');
};

const processModuleFile = async (dir, build) => {
    const manifestPath = path.join(dir, 'public', 'manifest.json');
    const manifest = await fs.readJson(manifestPath);

    const expectedFileName = `${manifest.name}-${manifest.version}.tar.gz`;
    const filePath = path.join(build, expectedFileName);
    const stats = await fs.stat(filePath);
    const moduleChecksum = await hashFile('sha256', filePath);

    console.log(
        chalk.green(`    [+] Adding module: ${manifest.name}`)
    );

    return {
        name: manifest.name,
        title: manifest.title,
        version: manifest.version,
        description: manifest.description,
        author: manifest.author.name,
        keywords: manifest.keywords || [],
        repository: manifest.repository || '',
        size: stats.size,
        sizeHuman: `${(stats.size / 1024).toFixed(2)} KiB`,
        checksum: moduleChecksum,
    };
};

const generateModulesJson = async (directories, build) => {
    console.log(
        chalk.green(`[*] Iterating through ${directories.length} modules...`)
    );
    const modules = await Promise.all(
        directories.map(
            (dir) => limit(() => processModuleFile(dir, build))
        )
    );

    console.log(
        chalk.green('[*] Json file has been generated. Saving...')
    );
    await fs.writeJson(
        path.join(process.cwd(), '..', 'json', 'modules.json'),
        modules,
        { spaces: 2 }
    );

    console.log(
        chalk.green('[*] Modules file has been generated successfully!')
    );
};

const mainAction = async (options) => {
    const { source, build } = options;

    try {
        const directories = glob.sync('*/', {
            cwd: source,
            onlyDirectories: true,
            absolute: true
        });
        await generateModulesJson(directories, build);
    } catch (error) {
        console.error(chalk.red('Failed to generate modules file:'), error);

        process.exit(1);
    }
};


/**
 * Implementation...
 */
console.log(chalk.yellow(`
 ________  ________      ___      _______       ________      _______       ________      
|\\  _____\\|\\   __  \\    |\\  \\    |\\  ___ \\     |\\   __  \\    |\\  ___ \\     |\\   ___  \\    
\\ \\  \\__/ \\ \\  \\|\\  \\   \\ \\  \\   \\ \\   __/|    \\ \\  \\|\\  \\   \\ \\   __/|    \\ \\  \\\\ \\  \\   
 \\ \\   __\\ \\ \\   _  _\\   \\ \\  \\   \\ \\  \\_|/__   \\ \\   _  _\\   \\ \\  \\_|/__   \\ \\  \\\\ \\  \\  
  \\ \\  \\_|  \\ \\  \\\\  \\|   \\ \\  \\   \\ \\  \\_|\\ \\   \\ \\  \\\\  \\|   \\ \\  \\_|\\ \\   \\ \\  \\\\ \\  \\ 
   \\ \\__\\    \\ \\__\\\\ _\\    \\ \\__\\   \\ \\_______\\   \\ \\__\\\\ _\\    \\ \\_______\\   \\ \\__\\\\ \\__\\
    \\|__|     \\|__|\\|__|    \\|__|    \\|_______|    \\|__|\\|__|    \\|_______|    \\|__| \\|__|
                                                                                          
 Release Frieren Modules - by DSR!
`));

const program = new Command();
program
    .name('release-frieren-modules')
    .description('CLI to create the modules.json file from a modules folder')
    .version('1.0.0')
    .requiredOption('-s, --source <path>', 'Path to the source folder', validateDirectory)
    .requiredOption('-b, --build <path>', 'Path to the build folder', validateDirectory)
    .action(mainAction);

program.parse(process.argv);
