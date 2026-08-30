import { denyIfNoPerm } from '../../Utils/perms.js';
import { getFooterName, setFooterName, clearFooterName, notice, send } from '../../Utils/ui.js';

export const command = {
	name: 'setfooter',
	helpname: 'setfooter <nom/reset>',
	aliases: ['footer'],
	description: 'Permet de choisir le nom affiché dans le bas des panneaux',
	help: 'setfooter <nom/reset>\nSans argument, affiche le nom actuel. `reset` remet le nom du serveur.',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const current = await getFooterName(message.guild, config);

		if (!args[0]) {
			return send(message.channel, notice(
				`Nom actuel du footer : **${current}**\nPour le changer : \`${config.prefix}setfooter <nom>\``,
				config.color
			));
		}

		if (args[0].toLowerCase() === 'reset') {
			await clearFooterName(message.guild);
			return send(message.channel, notice(
				`Le footer utilise à nouveau le nom par défaut : **${await getFooterName(message.guild, config)}**`,
				config.color
			));
		}

		const name = args.join(' ').trim();

		if (name.length > 60) {
			return send(message.channel, notice('Le nom du footer ne peut pas dépasser 60 caractères.', config.color));
		}

		await setFooterName(message.guild, name);

		return send(message.channel, notice(
			`Le footer affichera désormais : **${name}**\n-# ${name} · MAJ <t:${Math.floor(Date.now() / 1000)}:R>`,
			config.color
		));
	},
};
