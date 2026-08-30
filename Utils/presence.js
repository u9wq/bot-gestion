import { ActivityType } from 'discord.js';
import db from '../Events/loadDatabase.js';

export const ACTIVITY_TYPES = {
	listen: ActivityType.Listening,
	play: ActivityType.Playing,
	stream: ActivityType.Streaming,
	watch: ActivityType.Watching,
	compet: ActivityType.Competing,
	custom: ActivityType.Custom
};

export const STATUSES = ['online', 'idle', 'dnd', 'invisible'];

export function getPresence() {
	return new Promise((resolve) => {
		db.get('SELECT type, text, url, status FROM botpresence WHERE id = 1', (err, row) => {
			if (err || !row) return resolve({ type: null, text: null, url: null, status: null });
			resolve({ type: row.type, text: row.text, url: row.url, status: row.status });
		});
	});
}

export async function savePresence(patch) {
	const next = { ...(await getPresence()), ...patch };
	return new Promise((resolve, reject) => {
		db.run(
			'INSERT OR REPLACE INTO botpresence (id, type, text, url, status) VALUES (1, ?, ?, ?, ?)',
			[next.type, next.text, next.url, next.status],
			(err) => (err ? reject(err) : resolve(next))
		);
	});
}

export function buildActivity({ type, text, url }) {
	if (!type || type === 'stop') return null;

	const activityType = ACTIVITY_TYPES[type];
	if (activityType === undefined) return null;

	const name = text || 'Sans titre';

	if (activityType === ActivityType.Streaming) {
		if (!url) return { name, type: ActivityType.Playing };
		return { name, type: ActivityType.Streaming, url };
	}

	return { name, type: activityType };
}

export async function applyPresence(bot) {
	const stored = await getPresence();
	const activity = buildActivity(stored);
	const status = STATUSES.includes(stored.status) ? stored.status : 'online';

	bot.user.setPresence({ activities: activity ? [activity] : [], status });

	return { activity, status };
}
