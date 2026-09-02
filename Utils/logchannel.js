import db from '../Events/loadDatabase.js';

export const readChannels = (guildId) => new Promise((resolve) => {
	db.get('SELECT channels FROM logs WHERE guild = ?', [guildId], (err, row) => {
		try {
			resolve(JSON.parse(row?.channels || '{}'));
		} catch {
			resolve({});
		}
	});
});

export const writeChannels = (guildId, obj) => new Promise((resolve, reject) => {
	db.run('INSERT OR REPLACE INTO logs (guild, channels) VALUES (?, ?)',
		[guildId, JSON.stringify(obj)], (err) => (err ? reject(err) : resolve()));
});
