import { EmbedBuilder } from 'discord.js';
import db from '../../Events/loadDatabase.js';
import config from '../../Utils/config.js';
import Discord from 'discord.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'owner',
	helpname: 'owner',
	description: 'Permet de voir la liste des owner',
	help: 'owner',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		if (args.length === 0) {
			db.all('SELECT id FROM owner', [], async (err, rows) => {
				if (err) {
					console.error('Erreur lors de la récupération de la liste owner:', err);
					return
				}

				if (rows.length === 0) {
					return message.reply("La liste des owners est vide.");
				}

				const totalPages = Math.ceil(rows.length / 10);
				let currentPage = 1;

				const generateEmbed = async (page) => {
					const embed = new Discord.EmbedBuilder()
						.setTitle('Owner')
						.setColor(config.color)
						.setFooter({ text: `${rows.length} personnes - ${page}/${totalPages}` });

					const start = (page - 1) * 10;
					const end = Math.min(start + 10, rows.length);

					for (let i = start; i < end; i++) {
						const user = await bot.users.fetch(rows[i].id).catch(() => null);
						if (user) {
							embed.addFields({
								name: user.tag,
								value: user.id,
								inline: false
							});
						} else {
							embed.addFields({
								name: 'Utilisateur non trouvé',
								value: rows[i].id,
								inline: false
							});
						}
					}

					return embed;
				};

				const embed = await generateEmbed(currentPage);

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

					const newEmbed = await generateEmbed(currentPage);

					const newRow = new Discord.ActionRowBuilder()
						.addComponents(
							new Discord.ButtonBuilder()
								.setCustomId('prev')
								.setLabel('Précédent')
								.setStyle('Primary')
								.setDisabled(currentPage === 1),
							new Discord.ButtonBuilder()
								.setCustomId('next')
								.setLabel('Suivant')
								.setStyle('Primary')
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
		}
	},
}