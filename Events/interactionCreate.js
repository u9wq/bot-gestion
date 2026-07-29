import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import Discord from "discord.js"
import db from "./loadDatabase.js";

async function createTicket(interaction, optiontxt, roleIds, config, db) {
	const existing = interaction.guild.channels.cache.find(c =>
		c.topic === `${optiontxt} - ${interaction.user.username}`
	);
	if (existing) {
		return interaction.reply({ content: 'Vous avez déjà un ticket ouvert.', flags: Discord.MessageFlags.Ephemeral });
	}

	db.get('SELECT category FROM ticket WHERE guild = ?', [interaction.guild.id], async (err, row) => {
		if (err) return console.error(err);
		let parent = row?.category || null;
		if (parent && typeof parent !== 'string') parent = String(parent);

		const category = interaction.guild.channels.cache.get(parent);
		if (!category) return interaction.reply({ content: 'Catégorie invalide.', flags: Discord.MessageFlags.Ephemeral });

		const permissionOverwrites = [
			{
				id: interaction.guild.roles.everyone.id,
				deny: ["ViewChannel"],
			},
			{
				id: interaction.user.id,
				allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
			},
		];

		(roleIds || []).forEach(roleId => {
			permissionOverwrites.push({
				id: roleId,
				allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
			});
		});

		const ticketChannel = await interaction.guild.channels.create({
			name: `ticket-${interaction.user.username}`,
			type: 0,
			topic: `${optiontxt} - ${interaction.user.username}`,
			parent: category,
			permissionOverwrites,
		});

		db.run('INSERT INTO ticketchannel (channelId) VALUES (?)', [ticketChannel.id], (err) => { if (err) console.error(err); });

		const mentionRoles = (roleIds || []).map(id => `<@&${id}>`).join(' ');

		const close = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('ticket_close')
				.setLabel('Fermer le ticket')
				.setStyle(ButtonStyle.Danger)
		);

		await ticketChannel.send({
			content: `<@${interaction.user.id}> ${mentionRoles}`,
			embeds: [
				new EmbedBuilder()
					.setTitle('Ticket - ' + optiontxt)
					.setDescription('Expliquez votre problème, un membre du staff va vous répondre.\n\nPour fermer le ticket, cliquez sur le bouton fermer le ticket')
					.setColor(config.color)
					.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
					.setThumbnail(interaction.user.displayAvatarURL())
					.setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
					.setTimestamp()
			],
			components: [close]
		});

		return interaction.reply({ content: `${ticketChannel}`, flags: Discord.MessageFlags.Ephemeral });
	});
}

export default {
	name: 'interactionCreate',
	async execute(interaction, bot, config) {

		if (interaction.isCommand()) {
			const cmd = bot.slashCommands.get(interaction.commandName);
			const args = [];
			for (let option of interaction.options.data) {
				if (option.type === 1) {
					if (option.name) args.push(option.name);
					option.options?.forEach((x) => {
						if (x.value) args.push(x.value);
					});
				} else if (option.value) args.push(option.value);
			}
			cmd.run(bot, interaction, args, config);
			return;
		}

		if (interaction.isButton() && interaction.customId === 'confess_open') {
			const modal = new ModalBuilder()
				.setCustomId('confess_modal')
				.setTitle('Faire une confession');

			const input = new TextInputBuilder()
				.setCustomId('confess_text')
				.setLabel('Ta confession')
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(true)
				.setMaxLength(2000);

			modal.addComponents(new ActionRowBuilder().addComponents(input));
			return interaction.showModal(modal);
		}

		if (interaction.isModalSubmit() && interaction.customId === 'confess_modal') {
			const confession = interaction.fields.getTextInputValue('confess_text');
			db.get('SELECT channel FROM Confess WHERE guildId = ?', [interaction.guild.id], async (err, row) => {
				if (err || !row || row.channel === 'off') {
					return interaction.reply({ content: "Le salon de confession n'est pas configuré.", flags: Discord.MessageFlags.Ephemeral });
				}
				const confessChannel = interaction.guild.channels.cache.get(row.channel);
				if (!confessChannel) {
					return interaction.reply({ content: "Le salon de confession est introuvable.", flags: Discord.MessageFlags.Ephemeral });
				}

				const confessionNumber = await new Promise((resolve) => {
					db.get('SELECT COUNT(*) as count FROM confesslogs WHERE guildId = ?', [interaction.guild.id], (err2, row2) => {
						if (!err2 && row2) return resolve(row2.count + 1);
						resolve(1);
					});
				});

				db.run('INSERT INTO confesslogs (guildId, userId, message) VALUES (?, ?, ?)', [interaction.guild.id, interaction.user.id, confession]);

				const embed = new EmbedBuilder()
					.setTitle(`Confession #${confessionNumber}`)
					.setDescription(confession)
					.setColor(config.color);

				const messages = await confessChannel.messages.fetch({ limit: 10 });
				const lastBotMsg = messages.find(m => m.author.id === interaction.client.user.id && m.components.length > 0);
				if (lastBotMsg) {
					await lastBotMsg.edit({ components: [] }).catch(() => { });
				}

				const rowBtn = new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId('confess_open')
						.setLabel('Se confesser')
						.setStyle(ButtonStyle.Primary)
				);

				await confessChannel.send({ embeds: [embed], components: [rowBtn] });
			});
		}

		if (interaction.isButton() && interaction.customId.startsWith('giveaway_')) {
			const [, action, messageId] = interaction.customId.split('_');
			if (action === 'reroll') {
				await bot.giveawaysManager.reroll(messageId)
					.then(() => interaction.reply({ content: "Reroll", flags: Discord.MessageFlags.Ephemeral }))
					.catch(() => interaction.reply({ content: "Erreur lors du reroll.", flags: Discord.MessageFlags.Ephemeral }));
			}
			if (action === 'end') {
				await bot.giveawaysManager.end(messageId)
					.then(() => interaction.reply({ content: "Giveaway terminé !", flags: Discord.MessageFlags.Ephemeral }))
					.catch(() => interaction.reply({ content: "Erreur lors de la fin du giveaway.", flags: Discord.MessageFlags.Ephemeral }));
			}
		}

		if (interaction.isButton() && interaction.customId === 'cbutton') {
			db.get('SELECT id FROM captcha WHERE guild = ?', [interaction.guild.id], async (err, row) => {
				if (err) {
					console.error(err);
				}
				const role = interaction.guild.roles.cache.get(row.id);
				try {
					await interaction.member.roles.add(role);
				} catch (e) {
					console.error(e);
				}
			});
		}

		if (interaction.isButton() && interaction.customId === 'suggest_open') {
			const cooldown = await new Promise((resolve) => {
				db.get('SELECT lastSuggest FROM suggestcooldown WHERE userId = ? AND guildId = ?',
					[interaction.user.id, interaction.guild.id], (err, row) => resolve(row));
			});

			if (cooldown) {
				const elapsed = Date.now() - parseInt(cooldown.lastSuggest);
				const limit = 12 * 60 * 60 * 1000;
				if (elapsed < limit) {
					const remaining = limit - elapsed;
					const unlockTimestamp = Math.floor((Date.now() + remaining) / 1000);
					return interaction.reply({
						content: `Tu pourras refaire une suggestion <t:${unlockTimestamp}:R>.`,
						flags: Discord.MessageFlags.Ephemeral,
					});
				}
			}

			const modal = new ModalBuilder()
				.setCustomId('suggest_modal')
				.setTitle('Faire une suggestion');

			const input = new TextInputBuilder()
				.setCustomId('suggest_text')
				.setLabel('Ta suggestion')
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(true)
				.setMaxLength(2000);

			modal.addComponents(new ActionRowBuilder().addComponents(input));
			return interaction.showModal(modal);
		}

		if (interaction.isModalSubmit() && interaction.customId === 'suggest_modal') {
			const suggestion = interaction.fields.getTextInputValue('suggest_text');
			db.get('SELECT channel FROM Suggest WHERE guildId = ?', [interaction.guild.id], async (err, row) => {
				if (err || !row || row.channel === 'off') {
					return interaction.reply({ content: "Le salon de suggestion n'est pas configuré.", flags: Discord.MessageFlags.Ephemeral });
				}
				const suggestChannel = interaction.guild.channels.cache.get(row.channel);
				if (!suggestChannel) {
					return interaction.reply({ content: "Le salon de suggestion est introuvable.", flags: Discord.MessageFlags.Ephemeral });
				}

				const messages = await suggestChannel.messages.fetch({ limit: 10 });
				const lastBotMsg = messages.find(m => m.author.id === interaction.client.user.id && m.components.length > 0);
				if (lastBotMsg) {
					await lastBotMsg.edit({ components: [] }).catch(() => { });
				}

				const embed = new EmbedBuilder()
					.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
					.setTitle('Suggestion')
					.setDescription(suggestion)
					.setColor(config.color);

				const rowBtn = new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId('suggest_open')
						.setLabel('Faire une suggestion')
						.setStyle(ButtonStyle.Danger)
				);

				const sentMsg = await suggestChannel.send({ embeds: [embed], components: [rowBtn] });
				await sentMsg.react('✅');
				await sentMsg.react('❌');

				db.run('INSERT OR REPLACE INTO suggestcooldown (userId, guildId, lastSuggest) VALUES (?, ?, ?)',
					[interaction.user.id, interaction.guild.id, Date.now().toString()]);

				await interaction.reply({ content: 'Ta suggestion a été envoyée.', flags: Discord.MessageFlags.Ephemeral });
			});
		}

		if (interaction.isButton() && interaction.customId === 'ticket_close') {
			db.run('DELETE FROM ticketchannel WHERE channelId = ?', [interaction.channel.id], (err) => {
				if (err) console.error(err);
			});
			interaction.channel.delete().catch(() => { });
		}

		if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
			const optionId = interaction.values[0];

			db.get('SELECT * FROM ticketoptions WHERE id = ? AND guild = ?', [optionId, interaction.guild.id], async (err, opt) => {
				if (err || !opt) {
					return interaction.reply({ content: 'Option invalide.', flags: Discord.MessageFlags.Ephemeral });
				}

				db.all('SELECT * FROM ticketsuboptions WHERE guild = ? AND parentId = ?', [interaction.guild.id, opt.id], async (err2, subRows) => {
					if (err2) console.error(err2);

					if (subRows && subRows.length > 0) {
						const subMenu = new Discord.StringSelectMenuBuilder()
							.setCustomId(`ticket_sub_select_${opt.id}`)
							.setPlaceholder('Choisissez une sous-catégorie')
							.addOptions(subRows.map(sub => ({ label: sub.label, value: String(sub.id) })));

						const embed = new EmbedBuilder()
							.setTitle(opt.label)
							.setDescription('Sélectionnez une sous-catégorie pour votre ticket.')
							.setColor(config.color);

						return interaction.reply({
							embeds: [embed],
							components: [new ActionRowBuilder().addComponents(subMenu)],
							flags: Discord.MessageFlags.Ephemeral
						});
					}

					const roleIds = opt.roles ? opt.roles.split(',').filter(Boolean) : [];
					await createTicket(interaction, opt.label, roleIds, config, db);
				});
			});
		}

		if (interaction.isStringSelectMenu() && interaction.customId.startsWith('ticket_sub_select_')) {
			const optId = interaction.customId.split('_').pop();
			const subId = interaction.values[0];

			db.get('SELECT * FROM ticketoptions WHERE id = ? AND guild = ?', [optId, interaction.guild.id], async (err, opt) => {
				if (err || !opt) {
					return interaction.reply({ content: 'Option invalide.', flags: Discord.MessageFlags.Ephemeral });
				}

				db.get('SELECT * FROM ticketsuboptions WHERE id = ? AND guild = ?', [subId, interaction.guild.id], async (err2, sub) => {
					if (err2 || !sub) {
						return interaction.reply({ content: 'Sous-catégorie invalide.', flags: Discord.MessageFlags.Ephemeral });
					}

					const parentRoles = opt.roles ? opt.roles.split(',').filter(Boolean) : [];
					const subRoles = sub.roles ? sub.roles.split(',').filter(Boolean) : [];
					const roleIds = [...new Set([...parentRoles, ...subRoles])];

					const optiontxt = `${opt.label} - ${sub.label}`;
					await createTicket(interaction, optiontxt, roleIds, config, db);
				});
			});
		}
	}
};