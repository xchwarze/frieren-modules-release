/*
 * Project: Frieren Framework
 * Copyright (C) 2026 DSR! <xchwarze@gmail.com>
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * More info at: https://github.com/xchwarze/frieren
 */
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NEWS_PATH = path.join(__dirname, '..', 'json', 'news.json');

const DEFAULT_DATA = {
    news: [],
    lastVersion: { version: '0.0.0', comment: '', updateUrl: '' },
};

export const readNewsFile = async () => {
    if (await fs.pathExists(NEWS_PATH)) {
        return fs.readJson(NEWS_PATH);
    }

    return structuredClone(DEFAULT_DATA);
};

export const saveNewsFile = async (data) => {
    await fs.writeJson(NEWS_PATH, data, { spaces: 2 });
};

export const isValidUrl = (urlString) => {
    try {
        const url = new URL(urlString);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};
