import db from '../../Events/loadDatabase.js';
import config from '../../Utils/config.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'antilink',
	helpname: 'antilink <on/off> [invite/all]',
	description: "Active ou désactive l'antilink",
	help: 'antilink on/off [invite/all]',
	run: async (bot, message, args) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		if (!args[0] || ['on', 'off'].includes(args[0].toLowerCase()) === false) {
			return message.reply({
				content: 'Usage : `' + config.prefix + 'antilink <on/off> [invite/all]`',
				allowedMentions: { repliedUser: false }
			});
		}

		const guildId = message.guild.id;
		const status = args[0].toLowerCase() === 'on' ? 1 : 0;
		const type = args[1]?.toLowerCase() || 'all';

		if (!['invite', 'all'].includes(type)) {
			return
		}

		db.run(`INSERT INTO antiraid (guild, antilink, type) VALUES (?, ?, ?)
          ON CONFLICT(guild) DO UPDATE SET antilink = ?, type = ?`,
			[guildId, status, type, status, type], (err) => {
				if (err) return message.reply('Erreur lors de la mise à jour des paramètres.');

				const response = status ?
					`L'antilink a bien été activée.` :
					"L'antilink a bien été désactivée.";
				message.reply(response);
			});
	},
}