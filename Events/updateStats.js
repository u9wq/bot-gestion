import db from './loadDatabase.js';
import { ChannelType } from 'discord.js';

const lastUpdate = new Map();
const COOLDOWN = 10 * 60 * 1000;

export async function updateStats(guild) {
    const now = Date.now();
    if (now - (lastUpdate.get(guild.id) || 0) < COOLDOWN) return;
    lastUpdate.set(guild.id, now);

    db.get('SELECT * FROM stats WHERE guildId = ?', [guild.id], async (err, row) => {
        if (err || !row) return;

        if (row.memberCh) {
            const ch = guild.channels.cache.get(row.memberCh);
            if (ch) await ch.setName(`👥・Membre : ${guild.memberCount}`).catch(() => {});
        }
        if (row.onlineCh) {
            const ch = guild.channels.cache.get(row.onlineCh);
            if (ch) {
                const count = guild.members.cache.filter(
                    m => !m.user.bot && m.presence?.status && m.presence.status !== 'offline'
                ).size;
                await ch.setName(`🌐・En ligne : ${count}`).catch(() => {});
            }
        }
        if (row.vocalCh) {
            const ch = guild.channels.cache.get(row.vocalCh);
            if (ch) {
                const count = guild.channels.cache
                    .filter(c => c.type === ChannelType.GuildVoice && c.id !== row.vocalCh && c.id !== row.onlineCh && c.id !== row.memberCh)
                    .reduce((a, c) => a + (c.members?.filter(m => !m.user.bot).size || 0), 0);
                await ch.setName(`🔉・En vocal : ${count}`).catch(() => {});
            }
        }
    });
}