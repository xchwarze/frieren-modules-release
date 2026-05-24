#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NEWS_PATH = path.join(__dirname, '..', 'json', 'news.json');

const readNewsFile = async () => {
    if (await fs.pathExists(NEWS_PATH)) {
        return fs.readJson(NEWS_PATH);
    }

    return { news: [], lastVersion: { version: '0.0.0', comment: '' } };
};

const saveNewsFile = async (data) => {
    await fs.writeJson(NEWS_PATH, data, { spaces: 2 });
    console.log(chalk.green(`[+] Saved to ${NEWS_PATH}`));
};

const addAction = async (options) => {
    const { title, description, date } = options;
    const newsDate = date || new Date().toISOString().split('T')[0];

    try {
        const data = await readNewsFile();
        data.news.push({
            date: newsDate,
            title,
            description,
        });
        data.news.sort((older, newer) => newer.date.localeCompare(older.date));

        await saveNewsFile(data);
        console.log(chalk.green(`[+] Added news: "${title}"`));
    } catch (error) {
        console.error(chalk.red('[!] Failed to add news:'), error);
        process.exit(1);
    }
};

const setVersionAction = async (options) => {
    const { version, comment } = options;

    try {
        const data = await readNewsFile();
        data.lastVersion = { version, comment: comment || '' };

        await saveNewsFile(data);
        console.log(chalk.green(`[+] Set latest version: ${version}`));
    } catch (error) {
        console.error(chalk.red('[!] Failed to set version:'), error);
        process.exit(1);
    }
};

const listAction = async () => {
    try {
        const data = await readNewsFile();

        console.log(chalk.cyan('\n[*] Latest Version'));
        console.log(`    ${data.lastVersion.version} — ${data.lastVersion.comment || '(no comment)'}`);

        console.log(chalk.cyan(`\n[*] News (${data.news.length} entries)`));
        if (data.news.length === 0) {
            console.log('    (empty)');
        } else {
            data.news.forEach((item, index) => {
                console.log(`    [${index}] ${item.date} — ${item.title}: ${item.description}`);
            });
        }

        console.log('');
    } catch (error) {
        console.error(chalk.red('[!] Failed to read news:'), error);
        process.exit(1);
    }
};

const removeAction = async (options) => {
    const { index } = options;

    try {
        const data = await readNewsFile();
        if (index < 0 || index >= data.news.length) {
            console.error(chalk.red(`[!] Invalid index ${index}. Use "list" to see entries.`));
            process.exit(1);
        }

        const removed = data.news.splice(index, 1)[0];
        await saveNewsFile(data);
        console.log(chalk.green(`[+] Removed: "${removed.title}"`));
    } catch (error) {
        console.error(chalk.red('[!] Failed to remove news:'), error);
        process.exit(1);
    }
};

const program = new Command();
program
    .name('frieren-news')
    .description('Manage news.json for Frieren dashboard')
    .version('1.0.0');

program
    .command('add')
    .description('Add a news entry')
    .requiredOption('-t, --title <title>', 'News title')
    .requiredOption('-d, --description <description>', 'News description')
    .option('--date <date>', 'Date in YYYY-MM-DD format (defaults to today)')
    .action(addAction);

program
    .command('set-version')
    .description('Set the latest version info')
    .requiredOption('-v, --version <version>', 'Version number')
    .option('-c, --comment <comment>', 'Version comment')
    .action(setVersionAction);

program
    .command('list')
    .description('List all news entries and version info')
    .action(listAction);

program
    .command('remove')
    .description('Remove a news entry by index')
    .requiredOption('-i, --index <number>', 'Index to remove (use "list" to see indices)', Number)
    .action(removeAction);

program.parse(process.argv);
