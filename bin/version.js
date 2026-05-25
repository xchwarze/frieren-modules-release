#!/usr/bin/env node

/*
 * Project: Frieren Framework
 * Copyright (C) 2026 DSR! <xchwarze@gmail.com>
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * More info at: https://github.com/xchwarze/frieren
 */
import { Command } from 'commander';
import chalk from 'chalk';
import semver from 'semver';

import { readNewsFile, saveNewsFile, isValidUrl } from './news-store.js';

const setAction = async (options) => {
    const { version, comment, updateUrl } = options;

    if (!semver.valid(version)) {
        console.error(chalk.red(`[!] Invalid semver version: "${version}"`));
        process.exit(1);
    }

    if (updateUrl && !isValidUrl(updateUrl)) {
        console.error(chalk.red(`[!] Invalid URL: "${updateUrl}"`));
        process.exit(1);
    }

    try {
        const data = await readNewsFile();
        const currentVersion = data.lastVersion?.version || '0.0.0';

        if (semver.valid(currentVersion) && !semver.gt(version, currentVersion)) {
            console.error(chalk.red(`[!] New version (${version}) must be greater than current (${currentVersion}).`));
            process.exit(1);
        }

        data.lastVersion = {
            version,
            comment: comment || '',
            updateUrl: updateUrl || '',
        };

        await saveNewsFile(data);
        console.log(chalk.green(`[+] Set latest version: ${version}`));
    } catch (error) {
        console.error(chalk.red('[!] Failed to set version:'), error);
        process.exit(1);
    }
};

const updateAction = async (options) => {
    const { comment, updateUrl } = options;

    if (updateUrl && !isValidUrl(updateUrl)) {
        console.error(chalk.red(`[!] Invalid URL: "${updateUrl}"`));
        process.exit(1);
    }

    if (!comment && !updateUrl) {
        console.error(chalk.red('[!] Provide at least --comment or --update-url.'));
        process.exit(1);
    }

    try {
        const data = await readNewsFile();
        const current = data.lastVersion;

        if (!current?.version || current.version === '0.0.0') {
            console.error(chalk.red('[!] No version set yet. Use "set" first.'));
            process.exit(1);
        }

        if (comment !== undefined) {
            current.comment = comment;
        }
        if (updateUrl !== undefined) {
            current.updateUrl = updateUrl;
        }

        await saveNewsFile(data);
        console.log(chalk.green(`[+] Updated version ${current.version} metadata`));
    } catch (error) {
        console.error(chalk.red('[!] Failed to update version:'), error);
        process.exit(1);
    }
};

const showAction = async () => {
    try {
        const data = await readNewsFile();
        const lv = data.lastVersion;

        console.log(chalk.cyan('\n[*] Latest Version'));
        console.log(`    Version:  ${lv.version}`);
        console.log(`    Comment:  ${lv.comment || '(none)'}`);
        console.log(`    URL:      ${lv.updateUrl || '(none)'}`);
        console.log('');
    } catch (error) {
        console.error(chalk.red('[!] Failed to read version:'), error);
        process.exit(1);
    }
};

const program = new Command();
program
    .name('frieren-version')
    .description('Manage lastVersion in news.json for Frieren update alerts')
    .version('1.0.0');

program
    .command('set')
    .description('Set a new latest version (must be greater than current)')
    .requiredOption('-v, --version <version>', 'Semver version')
    .option('-c, --comment <comment>', 'Version comment')
    .option('-u, --update-url <url>', 'URL to the release page or changelog')
    .action(setAction);

program
    .command('update')
    .description('Update comment or URL of the current version')
    .option('-c, --comment <comment>', 'Version comment')
    .option('-u, --update-url <url>', 'URL to the release page or changelog')
    .action(updateAction);

program
    .command('show')
    .description('Show current version info')
    .action(showAction);

program.parse(process.argv);
