import * as Discord from "discord.js";
import db from "../../Events/loadDatabase.js";
import { EmbedBuilder } from "discord.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

const ITEMS_PER_PAGE = 10;

export const command = {
	name: 'whitelist',
	helpname: 'whitelist [mention/id]',
	aliases: ['wl'],
	description: 'Permet de gérer la whitelist',
	help: 'whitelist [mention/id]\nwhitelist',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		if (args.length === 0) {
			db.all('SELECT id FROM whitelist', [], async (err, rows) => {
				if (err) {
					console.error('Erreur lors de la récupération de la whitelist:', err);
					return
				}

				if (rows.length === 0) {
					return message.reply("La whitelist est vide.");
				}

				const totalPages = Math.ceil(rows.length / ITEMS_PER_PAGE);
				let currentPage = 1;

				const generateEmbed = async (page) => {
					const embed = new Discord.EmbedBuilder()
						.setTitle('Whitelist')
						.setColor(config.color)
						.setFooter({ text: `${rows.length} personnes - ${page}/${totalPages}` });

					const start = (page - 1) * ITEMS_PER_PAGE;
					const end = Math.min(start + ITEMS_PER_PAGE, rows.length);

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
		} else {
			const user = message.mentions.users.first() || await bot.users.fetch(args[0]).catch(() => null);
			if (!user) {
				return message.reply({
					content: 'Utilisateur introuvable. Usage : `' + config.prefix + 'whitelist <mention/id>`',
					allowedMentions: { repliedUser: false }
				});
			}

			db.run(`INSERT OR IGNORE INTO whitelist (id) VALUES (?)`, [user.id], function (err) {
				if (err) {
					console.error('Erreur lors de l\'ajout à la whitelist:', err);
					return
				}

				if (this.changes === 0) {
					return message.reply(`<@${user.id}> est déjà dans la whitelist.`);
				}

				message.reply(`<@${user.id}> a été ajouté à la whitelist.`);
			});
		}
	},
}