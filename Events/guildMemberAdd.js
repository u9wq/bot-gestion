import { ActivityType } from 'discord.js';
import { updateStats } from './updateStats.js';
import db from './loadDatabase.js';
import { EmbedBuilder } from 'discord.js';
import sendLog from './sendlog.js';

export const inviteCache = new Map();

export default {
	name: 'guildMemberAdd',
	async execute(member, bot, config) {

		db.get('SELECT channels FROM ghostping WHERE guild = ?', [member.guild.id], async (err, row) => {
			if (err || !row) return;
			const channelIds = row.channels.split(',').filter(Boolean);
			for (const id of channelIds) {
				const channel = member.guild.channels.cache.get(id);
				if (channel && channel.isTextBased()) {
					try {
						const msg = await channel.send(`<@${member.id}>`);
						setTimeout(() => msg.delete().catch(() => { }), 1500);
					} catch { }
				}
			}
		});

		db.get('SELECT antibot FROM antiraid WHERE guild = ?', [member.guild.id], async (err, row) => {
			if (row && row.antibot === 1 && member.user.bot) {
				try {
					await member.kick('Antibot');
				} catch (error) {
					console.error(`Impossible de kick ${member.user.tag}:`, error);
				}
				return;
			}
		});


		db.get('SELECT antitoken, antitokenjours FROM antiraid WHERE guild = ?', [member.guild.id], async (err, row) => {
			if (err || !row?.antitoken) return;

			const jours = row.antitokenjours || 7;
			const ageMs = Date.now() - member.user.createdTimestamp;
			if (ageMs >= jours * 24 * 60 * 60 * 1000) return;

			try {
				await member.kick(`Compte de moins de ${jours} jours - Antitoken`);

				const embed = new EmbedBuilder()
					.setDescription(`<@${member.id}> (${member.id}) a été expulsé : compte créé <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>, minimum requis ${jours} jour(s).`)
					.setColor(config?.color || 0xED4245)
					.setTimestamp();

				sendLog(member.guild, embed, 'raidlog');
			} catch (error) {
				console.error(`[ANTITOKEN] expulsion impossible pour ${member.user.tag} :`, error.message);
			}
		});

		db.get('SELECT id, texte FROM soutien WHERE guild = ?', [member.guild.id], async (err, row) => {
			if (err || !row) return;
			const soutienRoleId = row.id;
			const soutienText = row.texte;
			const customStatus = member.presence?.activities?.find(a => a.type === ActivityType.Custom);
			function escapeRegExp(string) {
				return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			}
			if (
				customStatus &&
				customStatus.state &&
				new RegExp(`(^|\\s)${escapeRegExp(soutienText)}(\\s|$)`, 'i').test(customStatus.state)
			) {
				try {
					await member.roles.add(soutienRoleId, 'Soutien');
				} catch (e) {
					console.error('Erreur lors de l\'attribution du rôle soutien :', e);
				}
			}
		});

		db.get('SELECT roleId FROM autorole WHERE guildId = ?', [member.guild.id], async (err, row) => {
			if (err || !row) return;
			const role = member.guild.roles.cache.get(row.roleId);
			if (role) await member.roles.add(role).catch(() => {});
		});

		db.get('SELECT channel, message FROM joinsettings WHERE guildId = ?', [member.guild.id], async (err, row) => {
			if (err || !row || row.channel === 'off') return;
			const channel = member.guild.channels.cache.get(row.channel);
			if (!channel) return;
			let msg = row.message
				.replace(/{user}/g, `<@${member.id}>`)
				.replace(/{user.name}/g, member.user.username)
				.replace(/{user.tag}/g, member.user.tag)
				.replace(/{user.id}/g, member.id)
				.replace(/{guild}/g, member.guild.name)
				.replace(/{guild.memberCount}/g, member.guild.memberCount);
			channel.send({ content: msg }).catch(() => { });
		});

		// Suivi des invitations pour les giveaways (une invitation créée par un bot ne compte pas)
		try {
			const newInvites = await member.guild.invites.fetch();
			const cachedInvites = inviteCache.get(member.guild.id) || new Map();
			const used = newInvites.find(i => (cachedInvites.get(i.code) ?? 0) < i.uses);
			inviteCache.set(member.guild.id, new Map(newInvites.map(i => [i.code, i.uses])));

			if (used?.inviter && !used.inviter.bot) {
				db.run(
					`INSERT INTO giveaway_invites (guildId, userId, invites) VALUES (?, ?, 1)
					ON CONFLICT(guildId, userId) DO UPDATE SET invites = invites + 1`,
					[member.guild.id, used.inviter.id]
				);
			}
		} catch {}

		updateStats(member.guild);
	}
};