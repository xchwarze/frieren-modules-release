#!/usr/bin/env node

/*
 * Project: Frieren Framework
 * Copyright (C) 2026 DSR! <xchwarze@gmail.com>
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * More info at: https://github.com/xchwarze/frieren
 */
import { Command } from 'commander';
import chalk from 'chalk';

import { readNewsFile, saveNewsFile } from './news-store.js';

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

const listAction = async () => {
    try {
        const data = await readNewsFile();

        console.log(chalk.cyan('\n[*] Latest Version'));
        console.log(`    ${data.lastVersion.version} — ${data.lastVersion.comment || '(no comment)'}`);
        if (data.lastVersion.updateUrl) {
            console.log(`    URL: ${data.lastVersion.updateUrl}`);
        }

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
    .description('Manage news entries for the Frieren dashboard')
    .version('1.0.0');

program
    .command('add')
    .description('Add a news entry')
    .requiredOption('-t, --title <title>', 'News title')
    .requiredOption('-d, --description <description>', 'News description')
    .option('--date <date>', 'Date in YYYY-MM-DD format (defaults to today)')
    .action(addAction);

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
