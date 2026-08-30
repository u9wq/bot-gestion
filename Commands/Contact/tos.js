import { EmbedBuilder } from 'discord.js';
import db from '../../Events/loadDatabase.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'tos',
	helpname: 'tos',
	description: 'Envoie les conditions de service dans un ticket',
	help: 'tos',
	run: async (bot, message, args, config) => {

		if (await denyIfNoPerm(message, command.name, config)) return;

		const isTicket = await new Promise(resolve => {
			db.get('SELECT channelId FROM ticketchannel WHERE channelId = ?', [message.channel.id], (err, row) => resolve(!!row));
		});

		if (!isTicket) {
			return message.reply('Cette commande ne peut être utilisée que dans un ticket.')
				.then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
		}

		const isOwner = config.owners.includes(message.author.id);
		const isDbOwner = await new Promise(resolve => {
			db.get('SELECT id FROM owner WHERE id = ?', [message.author.id], (err, row) => resolve(!!row));
		});
		const isWhitelisted = await new Promise(resolve => {
			db.get('SELECT id FROM whitelist WHERE id = ?', [message.author.id], (err, row) => resolve(!!row));
		});
		const hasRole = await new Promise(resolve => {
			const roles = message.member.roles.cache.map(r => r.id);
			if (roles.length === 0) return resolve(false);
			db.all('SELECT perm FROM permissions WHERE id IN (' + roles.map(() => '?').join(',') + ') AND guild = ?',
				[...roles, message.guild.id], (err, rows) => resolve(rows && rows.length > 0));
		});

		if (!isOwner && !isDbOwner && !isWhitelisted && !hasRole) {
			return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.')
				.then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
		}

		if (message.guild.members.me.permissionsIn(message.channel).has('ManageMessages')) {
			message.delete().catch(() => {});
		}

		const embed = new EmbedBuilder()
			.setTitle('Conditions de Service')
			.setColor(config.color)
			.setDescription([
				'En passant commande, vous acceptez les conditions suivantes :\n',
				'**1. Paiements**',
				'> Nous acceptons uniquement les paiements en **PayPal** et en **cryptomonnaies**.',
				'> Toute commande est traitée uniquement après réception du paiement.\n',
				'**2. Aucun remboursement**',
				'> Toutes les ventes sont **définitives**.',
				'> Aucun remboursement ne sera effectué une fois la commande passée, sauf en cas d\'impossibilité totale de fournir le service.\n',
				'**3. Délais de livraison**',
				'> Les délais affichés sont donnés à titre indicatif et peuvent varier.',
				'> Certains services peuvent prendre plus de temps selon la charge des fournisseurs.\n',
				'**4. Retards**',
				'> Si un retard inhabituel survient, il est généralement dû à notre fournisseur ou à un intermédiaire.',
				'> Ces retards sont indépendants de notre volonté et ne relèvent pas de notre responsabilité.',
				'> Nous nous engageons à faire tout notre possible pour accélérer le traitement et assurer un suivi.\n',
				'**5. Responsabilité**',
				'> Nous ne pouvons être tenus responsables des retards ou problèmes causés par un tiers.',
				'> En passant commande, vous reconnaissez que certains services dépendent d\'intermédiaires externes.\n',
				'**6. Preuves & Légitimité**',
				'> Consultez nos preuves de livraisons, retours clients et commandes dans le salon <#1522687279825682614>.',
				'> Ce salon permet de vérifier notre sérieux et de constater que les commandes sont bien traitées.',
				'> Si vous avez la moindre question avant de commander, n\'hésitez pas à nous contacter.',
			].join('\n'));

		message.channel.send({ embeds: [embed] });
	},
};