import db from '../../Events/loadDatabase.js';
import config from '../../Utils/config.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'antiban',
	helpname: 'antiban <on/off>',
	description: "Active/désactive l'antiban",
	help: 'antiban on/off',
	run: async (bot, message, args) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const guildId = message.guild.id;
		if (!args[0] || ['on', 'off'].includes(args[0].toLowerCase()) === false) {
			return message.reply({
				content: 'Usage : `' + config.prefix + 'antiban <on/off>`',
				allowedMentions: { repliedUser: false }
			});
		}

		const status = args[0].toLowerCase() === 'on' ? 1 : 0;

		db.run(`INSERT INTO antiraid (guild, antiban)
          VALUES (?, ?)
          ON CONFLICT(guild) DO UPDATE SET antiban = ?`,
			[guildId, status, status], (err) => {
				if (err) return message.reply('Erreur lors de la mise à jour des paramètres.');
				const response = status ?
					"L'antiban a bien été activé !" :
					"L'antiban a bien été désactivé.";
				message.reply(response);
			});

	},
}