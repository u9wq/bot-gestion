import db from '../../Events/loadDatabase.js';
import { PermissionFlagsBits } from 'discord.js';

export const command = {
    name: 'deletestats',
    helpname: 'deletestats',
    description: 'Supprimer les salons de statistiques',
    run: async (bot, message, args, config) => {
        if (!config.owners.includes(message.author.id) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply("Vous n'avez pas la permission.");
        }

        db.get('SELECT * FROM stats WHERE guildId = ?', [message.guild.id], async (err, row) => {
            if (!row) return message.reply('❌ Aucun salon stats configuré.');
            for (const id of [row.memberCh, row.onlineCh, row.vocalCh, row.categoryId]) {
                const ch = message.guild.channels.cache.get(id);
                if (ch) await ch.delete().catch(() => {});
            }
            db.run('DELETE FROM stats WHERE guildId = ?', [message.guild.id]);
            message.reply('✅ Salons stats supprimés !');
        });
    }
};