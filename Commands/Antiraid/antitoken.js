import db from '../../Events/loadDatabase.js';
import config from '../../Utils/config.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

const JOURS_DEFAUT = 7;
const JOURS_MIN = 1;
const JOURS_MAX = 90;

export const command = {
	name: 'antitoken',
	helpname: 'antitoken <on/off> [jours]',
	description: "Active/désactive l'antitoken",
	help: "antitoken <on/off> [jours]\nExpulse les comptes Discord créés depuis moins de X jours. Par défaut 7.",
	run: async (bot, message, args) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const guildId = message.guild.id;
		if (!args[0] || ['on', 'off'].includes(args[0].toLowerCase()) === false) {
			return message.reply({
				content: 'Usage : `' + config.prefix + 'antitoken <on/off> [jours]`',
				allowedMentions: { repliedUser: false }
			});
		}

		const status = args[0].toLowerCase() === 'on' ? 1 : 0;

		let jours = JOURS_DEFAUT;
		if (args[1]) {
			jours = parseInt(args[1], 10);
			if (Number.isNaN(jours) || jours < JOURS_MIN || jours > JOURS_MAX) {
				return message.reply({
					content: `Le nombre de jours doit être compris entre ${JOURS_MIN} et ${JOURS_MAX}.`,
					allowedMentions: { repliedUser: false }
				});
			}
		}

		db.run(`INSERT INTO antiraid (guild, antitoken, antitokenjours)
          VALUES (?, ?, ?)
          ON CONFLICT(guild) DO UPDATE SET antitoken = ?, antitokenjours = ?`,
			[guildId, status, jours, status, jours], (err) => {
				if (err) return message.reply('Erreur lors de la mise à jour des paramètres.');
				const response = status ?
					`L'antitoken a bien été activé : les comptes de moins de ${jours} jour${jours > 1 ? 's' : ''} seront expulsés.` :
					"L'antitoken a bien été désactivé.";
				message.reply(response);
			});
	},
}
