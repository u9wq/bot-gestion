import db from '../../Events/loadDatabase.js';
import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
    name: 'setupstats',
	help: 'setupstats',
    helpname: 'setupstats',
    description: 'Créer les salons de statistiques',
    run: async (bot, message, args, config) => {
        if (await denyIfNoPerm(message, command.name, config)) return;

        const guild = message.guild;
        const s = await message.reply('🔄 Création des salons stats...');

        try {
            await guild.members.fetch().catch(() => {});

            const category = await guild.channels.create({
                name: '📊 → Statistique',
	help: 'setupstats',
                type: ChannelType.GuildCategory,
            });

            const perms = [{
                id: guild.roles.everyone.id,
                deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.SendMessages],
                allow: [PermissionFlagsBits.ViewChannel],
            }];

            const memberCh = await guild.channels.create({
                name: `👥・Membre : ${guild.memberCount}`,
	help: 'setupstats',
                type: ChannelType.GuildVoice,
                parent: category.id,
                permissionOverwrites: perms,
            });

            const onlineCount = guild.members.cache.filter(
                m => !m.user.bot && m.presence?.status && m.presence.status !== 'offline'
            ).size;
            const onlineCh = await guild.channels.create({
                name: `🌐・En ligne : ${onlineCount}`,
	help: 'setupstats',
                type: ChannelType.GuildVoice,
                parent: category.id,
                permissionOverwrites: perms,
            });

            const vocalCount = guild.channels.cache
                .filter(c => c.type === ChannelType.GuildVoice && c.parentId === category.id === false)
                .reduce((a, c) => a + (c.members?.filter(m => !m.user.bot).size || 0), 0);
            const vocalCh = await guild.channels.create({
                name: `🔉・En vocal : ${vocalCount}`,
	help: 'setupstats',
                type: ChannelType.GuildVoice,
                parent: category.id,
                permissionOverwrites: perms,
            });

            db.get('SELECT guildId FROM stats WHERE guildId = ?', [guild.id], (err, row) => {
                if (!row) {
                    db.run('INSERT INTO stats (guildId, categoryId, memberCh, onlineCh, vocalCh) VALUES (?, ?, ?, ?, ?)',
                        [guild.id, category.id, memberCh.id, onlineCh.id, vocalCh.id]);
                } else {
                    db.run('UPDATE stats SET categoryId = ?, memberCh = ?, onlineCh = ?, vocalCh = ? WHERE guildId = ?',
                        [category.id, memberCh.id, onlineCh.id, vocalCh.id, guild.id]);
                }
            });

            s.edit(`✅ Salons stats créés !\n👥 ${memberCh}\n🌐 ${onlineCh}\n🔉 ${vocalCh}`);
        } catch (err) {
            s.edit(`❌ Erreur : ${err.message}`);
        }
    }
};