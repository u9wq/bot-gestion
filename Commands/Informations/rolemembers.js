import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import config from '../../Utils/config.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'rolemembers',
	helpname: 'rolemembers <mention/id>',
	description: "Permet d'afficher un rôle avec ses membres",
	help: 'rolemembers <mention/id>',
	run: async (bot, message, args) => {
		if (await denyIfNoPerm(message, command.name, config)) return;


		const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);

		if (!role) {
			return message.reply({ content: "Le rôle n'existe pas ou n'est pas mentionné", allowedMentions: { repliedUser: false } });
		}


		if (role.members.size === 0) {
			return message.reply({ content: "Aucun membre n'a ce rôle", allowedMentions: { repliedUser: false } });
		}

		const membersArray = role.members.map(member => `<@${member.id}>`);
		const pageSize = 30;
		const totalPages = Math.ceil(membersArray.length / pageSize);
		let currentPage = 0;

		const embed = (page) => {
			const start = page * pageSize;
			const end = start + pageSize;
			const membersToShow = membersArray.slice(start, end).join('\n') || 'Aucun membre à afficher';

			return new EmbedBuilder()
				.setTitle(`Membres ayant le rôle ${role.name}`)
				.setDescription(membersToShow)
				.setColor(role.color || config.color)
				.setFooter({ text: `Page ${page + 1} / ${totalPages}` });
		};

		const actionrow = () => {
			const row = new ActionRowBuilder();

			if (currentPage > 0) {
				row.addComponents(
					new ButtonBuilder()
						.setCustomId('prev')
						.setLabel('<')
						.setStyle(ButtonStyle.Primary)
				);
			}

			if (currentPage < totalPages - 1) {
				row.addComponents(
					new ButtonBuilder()
						.setCustomId('next')
						.setLabel('>')
						.setStyle(ButtonStyle.Primary)
				);
			}

			return row.components.length > 0 ? row : null;
		};

		const actionRow = actionrow();
		const msg = await message.reply({ embeds: [embed(currentPage)], components: actionRow ? [actionRow] : [], allowedMentions: { repliedUser: false } });

		const filter = interaction => interaction.user.id === message.author.id && (interaction.customId === 'prev' || interaction.customId === 'next');
		const collector = msg.createMessageComponentCollector({ filter, time: 30000 });

		collector.on('collect', async (interaction) => {
			if (interaction.customId === 'prev' && currentPage > 0) {
				currentPage--;
			} else if (interaction.customId === 'next' && currentPage < totalPages - 1) {
				currentPage++;
			}

			await interaction.update({
				embeds: [embed(currentPage)],
				components: actionrow() ? [actionrow()] : []
			});
		});

		collector.on('end', () => {
			msg.edit({ components: [] });
		});
	},
}