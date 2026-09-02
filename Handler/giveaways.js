import { EmbedBuilder } from 'discord.js';
import path from 'node:path';
import { GiveawaysManager } from 'discord-giveaways';
import { RACINE } from '../Utils/config.js';

/**
 * Branche le gestionnaire de giveaways et le récapitulatif de fin de tirage.
 */
export default function giveawayHandler(bot, config) {
	bot.giveawaysManager = new GiveawaysManager(bot, {
		storage: path.join(RACINE, 'giveaways.json'),
		updateCountdownEvery: 5000,
		default: {
			botsCanWin: false,
			embedColor: config.color,
			reaction: '🎉'
		}
	});

	bot.giveawaysManager.on('giveawayEnded', async (giveaway, gagnants) => {
		try {
			const salon = await bot.channels.fetch(giveaway.channelId);
			const message = await salon.messages.fetch(giveaway.messageId);

			const reaction = message.reactions.cache.get('🎉');
			let participants = 0;
			if (reaction) {
				const utilisateurs = await reaction.users.fetch();
				participants = utilisateurs.filter((u) => !u.bot).size;
			}

			const fin = Math.floor(giveaway.endAt / 1000);
			const embed = new EmbedBuilder()
				.setTitle(giveaway.prize)
				.setDescription(
					`Fin: <t:${fin}:R> <t:${fin}:F>\n` +
					`Organisé par: ${giveaway.hostedBy?.id || giveaway.hostedBy}\n` +
					`Participants: ${participants}\n` +
					`Gagnant(s): ${gagnants.map((g) => `<@${g.id}>`).join(', ') || 'Aucun'}\n`
				)
				.setColor(config.color);

			await message.edit({ embeds: [embed], components: [] });
		} catch (error) {
			console.error('[GIVEAWAY] impossible de mettre à jour le tirage :', error.message);
		}
	});

	return bot.giveawaysManager;
}
