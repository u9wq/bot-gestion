import db from '../../Events/loadDatabase.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
    name: 'setautorole',
	help: 'setautorole <@role/off>',
    helpname: 'setautorole <@role/off>',
    description: 'Configurer le rôle automatique aux nouveaux membres',
    run: async (bot, message, args, config) => {
        if (await denyIfNoPerm(message, command.name, config)) return;

        const arg = message.content.trim().split(/ +/g);

        if (arg[1]?.toLowerCase() === 'off') {
            db.run('DELETE FROM autorole WHERE guildId = ?', [message.guild.id]);
            return message.reply('✅ Auto-role désactivé.');
        }

        const role = message.mentions.roles.first() || message.guild.roles.cache.get(arg[1]);
        if (!role) return message.reply('❌ Usage: `+setautorole @role` ou `+setautorole off`');

        db.get('SELECT guildId FROM autorole WHERE guildId = ?', [message.guild.id], (err, row) => {
            if (!row) {
                db.run('INSERT INTO autorole (guildId, roleId) VALUES (?, ?)', [message.guild.id, role.id]);
            } else {
                db.run('UPDATE autorole SET roleId = ? WHERE guildId = ?', [role.id, message.guild.id]);
            }
            message.reply(`✅ Auto-role configuré : **${role.name}**`);
        });
    }
};