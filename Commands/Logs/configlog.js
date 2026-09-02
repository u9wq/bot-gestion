import { ChannelType, PermissionFlagsBits } from 'discord.js';
import db from '../../Events/loadDatabase.js';
import { denyIfNoPerm } from '../../Utils/perms.js';
import { notice, send } from '../../Utils/ui.js';
import { readChannels } from '../../Utils/logchannel.js';

const SALONS = [
	'📁・config-logs',
	'📁・mod-logs',
	'📁・message-logs',
	'📁・raid-logs',
	'📁・role-logs',
	'📁・ticket-logs',
	'📁・voice-logs',
	'📁・boost-logs'
];

const ecrire = (guildId, obj) => new Promise((resolve, reject) => {
	db.run('INSERT OR REPLACE INTO logs (guild, channels) VALUES (?, ?)',
		[guildId, JSON.stringify(obj)], (err) => (err ? reject(err) : resolve()));
});

async function listeOwners(message, config) {
	const enBase = await new Promise((resolve) => {
		db.all('SELECT id FROM owner', (err, rows) => resolve(err || !rows ? [] : rows.map(r => r.id)));
	});

	const ids = [...new Set([...(config.owners || []), ...enBase])];
	const membres = [];

	for (const id of ids) {
		const membre = await message.guild.members.fetch(id).catch(() => null);
		if (membre) membres.push(membre.id);
	}

	return membres;
}

export const command = {
	name: 'configlog',
	helpname: 'configlog <id catégorie/off>',
	description: 'Crée tous les salons de logs dans une catégorie, visibles par les owners',
	help: "configlog <id catégorie/off>\nCrée un salon par type de log dans la catégorie donnée. Sans argument, utilise la catégorie du salon courant.",
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const channels = await readChannels(message.guild.id);

		if (args[0] && args[0].toLowerCase() === 'off') {
			let supprimes = 0;
			for (const nom of SALONS) {
				const id = channels[nom];
				if (!id) continue;
				const salon = message.guild.channels.cache.get(id);
				if (salon) await salon.delete().catch(() => { });
				delete channels[nom];
				supprimes++;
			}
			await ecrire(message.guild.id, channels);
			return send(message.channel, notice(
				supprimes ? `${supprimes} salon${supprimes > 1 ? 's' : ''} de logs supprimé${supprimes > 1 ? 's' : ''}.` : 'Aucun salon de logs configuré.',
				config.color
			));
		}

		let categorie;
		if (args[0]) {
			categorie = message.guild.channels.cache.get(args[0].replace(/[<#>]/g, '').trim());
			if (!categorie || categorie.type !== ChannelType.GuildCategory) {
				return send(message.channel, notice('ID de catégorie invalide.', config.color));
			}
		} else {
			categorie = message.channel.parent;
			if (!categorie) {
				return send(message.channel, notice(
					`Ce salon n'est dans aucune catégorie. Précise un identifiant : \`${config.prefix}configlog <id catégorie>\``,
					config.color
				));
			}
		}

		const owners = await listeOwners(message, config);

		const overwrites = [
			{ id: message.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
			{
				id: bot.user.id,
				allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ReadMessageHistory]
			},
			...owners.map(id => ({
				id,
				allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]
			}))
		];

		const crees = [], reutilises = [];

		for (const nom of SALONS) {
			let salon = message.guild.channels.cache.find(c => c.name === nom && c.parentId === categorie.id);

			if (salon) {
				await salon.permissionOverwrites.set(overwrites).catch(() => { });
				reutilises.push(salon.id);
			} else {
				salon = await message.guild.channels.create({
					name: nom,
					type: ChannelType.GuildText,
					parent: categorie.id,
					permissionOverwrites: overwrites
				}).catch(() => null);

				if (!salon) continue;
				crees.push(salon.id);
			}

			channels[nom] = salon.id;
		}

		await ecrire(message.guild.id, channels);

		const lignes = [
			`Salons de logs installés dans **${categorie.name}**.`,
			`${crees.length} créé${crees.length > 1 ? 's' : ''}, ${reutilises.length} réutilisé${reutilises.length > 1 ? 's' : ''} sur ${SALONS.length}.`,
			`-# Visibles par ${owners.length} owner${owners.length > 1 ? 's' : ''} et personne d'autre.`
		];

		return send(message.channel, notice(lignes.join('\n'), config.color), {
			allowedMentions: { parse: [] }
		});
	},
}
