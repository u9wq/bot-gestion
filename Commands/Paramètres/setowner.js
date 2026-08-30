import db from "../../Events/loadDatabase.js";
import { denyIfNoPerm } from '../../Utils/perms.js';
import { notice, send } from '../../Utils/ui.js';

const addOwner = (id) => new Promise((resolve, reject) => {
	db.run('INSERT OR IGNORE INTO owner (id) VALUES (?)', [id], function (err) {
		if (err) return reject(err);
		resolve(this.changes > 0);
	});
});

export const command = {
	name: 'setowner',
	helpname: 'setowner <mention/id> [mention/id...]',
	description: "Permet d'ajouter des owners",
	help: "setowner <mention/id> [mention/id...]\nUn owner a accès à toutes les commandes, sans passer par les niveaux.",
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		if (!args[0]) {
			return send(message.channel, notice(
				`Usage : \`${config.prefix}setowner <mention/id>\`\n-# Plusieurs mentions ou identifiants peuvent être donnés d'un coup.`,
				config.color
			));
		}

		const ids = [...new Set(args.map(a => a.replace(/[<@!>]/g, '').trim()).filter(Boolean))];
		const ajoutes = [], deja = [], introuvables = [];

		for (const id of ids) {
			const user = await bot.users.fetch(id).catch(() => null);
			if (!user) {
				introuvables.push(`\`${id}\``);
				continue;
			}
			try {
				const nouveau = await addOwner(user.id);
				(nouveau ? ajoutes : deja).push(`<@${user.id}>`);
			} catch (err) {
				console.error("Erreur lors de l'ajout d'un owner :", err);
				introuvables.push(`\`${id}\``);
			}
		}

		const lignes = [];
		if (ajoutes.length) lignes.push(`${ajoutes.length > 1 ? 'Nouveaux owners' : 'Nouvel owner'} : ${ajoutes.join(', ')}`);
		if (deja.length) lignes.push(`Déjà owner : ${deja.join(', ')}`);
		if (introuvables.length) lignes.push(`-# Introuvable : ${introuvables.join(', ')}`);

		return send(message.channel, notice(lignes.join('\n'), config.color), {
			allowedMentions: { parse: [] }
		});
	},
}
