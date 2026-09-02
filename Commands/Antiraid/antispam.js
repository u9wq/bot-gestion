import db from '../../Events/loadDatabase.js';
import config from '../../Utils/config.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

function parseTime(str) {
	const match = /^(\d+)(s|m|h|d)$/i.exec(str);
	if (!match) return null;
	const num = parseInt(match[1]);
	const unit = match[2].toLowerCase();
	const ms = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
	return { value: num, unit, ms: num * (ms[unit] || 1000) };
}

export const command = {
	name: 'antispam',
	helpname: 'antispam <on/off> [nombre de messages]',
	description: "Active ou désactive l'antispam",
	help: 'antispam on/off <message> <sous> <durée du timeout>\nExemple: antispam on 3 10s 1m \n(3 messages en 10 secondes, timeout de 1 minute)\nTemps: 1s, 1m, 1h, 1h (exemples)',
	run: async (bot, message, args) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const guildId = message.guild.id;
		if (!args[0] || ['on', 'off'].includes(args[0].toLowerCase()) === false) {
			return message.reply({
				content: 'Usage : `' + config.prefix + 'antispam <on/off> [nombre de messages]`',
				allowedMentions: { repliedUser: false }
			});
		}

		const status = args[0].toLowerCase() === 'on' ? 1 : 0;

		if (status === 0) {
			db.run(
				`INSERT INTO antiraid (guild, antispam) VALUES (?, ?) ON CONFLICT(guild) DO UPDATE SET antispam = ?`,
				[guildId, 0, 0],
				(err) => {
					if (err) {
						console.error(err);
						return
					}
					message.reply("L'antispam a bien été désactivé.");
				}
			);
			return;
		}

		let count = parseInt(args[1]) || 3;
		let sousparse = parseTime(args[2] || '10s');
		let toparse = parseTime(args[3] || '1m');

		if (!sousparse || !toparse) {
			return
		}

		let sous = sousparse.ms;
		let timeoutMs = toparse.ms;

		db.run(
			`INSERT INTO antiraid (guild, antispam, nombremessage, sous, timeout)
   VALUES (?, ?, ?, ?, ?)
   ON CONFLICT(guild) DO UPDATE SET antispam = ?, nombremessage = ?, sous = ?, timeout = ?`,
			[guildId, status, count, sous, timeoutMs, status, count, sous, timeoutMs],
			(err) => {
				if (err) {
					console.error(err);
					return
				}
				message.reply(`L'antispam a bien été activé`);
			}
		);

	},
}