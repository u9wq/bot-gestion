import db from '../../Events/loadDatabase.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
    name: 'deletestats',
	help: 'deletestats',
    helpname: 'deletestats',
    description: 'Supprimer les salons de statistiques',
    run: async (bot, message, args, config) => {
        if (await denyIfNoPerm(message, command.name, config)) return;

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