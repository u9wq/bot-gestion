import * as Discord from "discord.js";
import db from "../../Events/loadDatabase.js";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder } from "discord.js";
import { formatDistanceToNow, parseISO, isToday, isYesterday } from 'date-fns'
import { fr } from "date-fns/locale";
import { denyIfNoPerm } from '../../Utils/perms.js';

const sancparpage = 5;

const footdate = (date) => {
	const now = new Date();
	const parsedDate = parseISO(date);

	if (isToday(parsedDate)) {
		return `Aujourd'hui à ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
	} else if (isYesterday(parsedDate)) {
		return `Hier à ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
	} else {
		return `${new Date(date).toLocaleDateString()} à ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
	}
};

export const command = {
	name: 'sanction',
	helpname: 'sanction [mention/id]',
	description: 'Permet de voir la liste des sanctions d\'un membre',
	help: 'sanction [mention/id]',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const user = message.mentions.users.first() || await bot.users.fetch(args[0]).catch(() => null);
		if (!user) return message.reply("L'utilisateur n'existe pas");

		db.all('SELECT id, reason, date FROM sanctions WHERE userId = ? AND guild = ? ORDER BY date DESC', [user.id, message.guild.id], async (err, rows) => {
			if (err) {
				console.error('Erreur lors de la récupération des sanctions:', err);
				return;
			}

			if (rows.length === 0) return message.reply(`${user.tag} n'a aucune sanction.`);

			const totalPages = Math.ceil(rows.length / sancparpage);
			let currentPage = 1;

			const generateEmbed = (page) => {
				const embed = new Discord.EmbedBuilder()
					.setTitle(`Sanctions de ${user.tag}`)
					.setColor(config.color)
					.setFooter({ text: `Page ${page} sur ${totalPages}` });

				const start = (page - 1) * sancparpage;
				const end = Math.min(start + sancparpage, rows.length);

				for (let i = start; i < end; i++) {
					embed.addFields({
						name: `**Sanction #${i + 1}**`,
						value: `**Date** : ${formatDistanceToNow(parseISO(rows[i].date), { locale: fr, addSuffix: true })}\n` +
							`**Raison** : ${rows[i].reason}`
					});
				}

				return embed;
			};

			const embed = generateEmbed(currentPage);

			const row = new Discord.ActionRowBuilder()
				.addComponents(
					new Discord.ButtonBuilder()
						.setCustomId('prev')
						.setLabel('Précédent')
						.setStyle('Secondary')
						.setDisabled(currentPage === 1),
					new Discord.ButtonBuilder()
						.setCustomId('next')
						.setLabel('Suivant')
						.setStyle('Secondary')
						.setDisabled(currentPage === totalPages)
				);

			const reply = await message.reply({ embeds: [embed], components: [row], allowedMentions: { repliedUser: false } });

			const filter = i => i.user.id === message.author.id;
			const collector = reply.createMessageComponentCollector({ filter, time: 60000 });

			collector.on('collect', async interaction => {
				if (interaction.customId === 'prev') {
					currentPage--;
				} else if (interaction.customId === 'next') {
					currentPage++;
				}

				const newEmbed = generateEmbed(currentPage);

				const newRow = new Discord.ActionRowBuilder()
					.addComponents(
						new Discord.ButtonBuilder()
							.setCustomId('prev')
							.setLabel('Précédent')
							.setStyle('Secondary')
							.setDisabled(currentPage === 1),
						new Discord.ButtonBuilder()
							.setCustomId('next')
							.setLabel('Suivant')
							.setStyle('Secondary')
							.setDisabled(currentPage === totalPages)
					);

				await interaction.update({ embeds: [newEmbed], components: [newRow] });
			});

			collector.on('end', collected => {
				if (collected.size === 0) {
					reply.edit({ components: [] });
				}
			});
		});
	},
}