import { updateStats } from './updateStats.js';
import { applyPresence } from '../Utils/presence.js';
import { inviteCache } from './guildMemberAdd.js';

const INTERVALLE_STATS = 60 * 1000;

export default {
	name: 'clientReady',
	async execute(client, bot, config) {
		console.log(`[INFO] ${client.user.tag} est connecté`);
		console.log(`[INVITE] https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`);

		// Mono-serveur : on quitte toute guilde qui n'est pas celle configurée.
		for (const guild of client.guilds.cache.values()) {
			if (guild.id !== config.guildId) {
				await guild.leave().catch(() => { });
			}
		}

		await applyPresence(client).catch((error) =>
			console.error('[PRESENCE] application impossible :', error.message));

		await client.application.commands.set(client.arrayOfSlashCommands ?? []).catch((error) =>
			console.error('[SLASH-COMMAND] enregistrement impossible :', error.message));

		// Cache des invitations, utilisé pour le classement des giveaways.
		for (const guild of client.guilds.cache.values()) {
			try {
				const invitations = await guild.invites.fetch();
				inviteCache.set(guild.id, new Map(invitations.map((i) => [i.code, i.uses])));
			} catch {
				// Le bot n'a pas la permission de lire les invitations : on ignore.
			}
		}

		setInterval(() => {
			for (const guild of client.guilds.cache.values()) {
				updateStats(guild).catch((error) =>
					console.error('[STATS] mise à jour impossible :', error.message));
			}
		}, INTERVALLE_STATS);
	}
};
