import { ChannelType, PermissionFlagsBits } from 'discord.js';
import db from '../../Events/loadDatabase.js';
import config from '../../Utils/config.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

const logChannels = [
	"📁・boost-logs",
	"📁・message-logs",
	"📁・mod-logs",
	"📁・raid-logs",
	"📁・role-logs",
	"📁・ticket-logs",
	"📁・voice-logs"
];

export const command = {
	name: 'presetlogs',
	helpname: 'presetlogs [off]',
	description: "Active/désactive les logs prédéfinis",
	help: 'presetlogs [off]',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		if (args[0]?.toLowerCase() === 'off') {
			let channelsObj = {};
			try {
				channelsObj = JSON.parse(
					await new Promise(res =>
						db.get('SELECT channels FROM logs WHERE guild = ?', [message.guild.id], (e, r) => res(r?.channels || '{}'))
					)
				);
			} catch { channelsObj = {}; }

			for (const name of logChannels) {
				const channelId = channelsObj[name];
				if (channelId) {
					const channel = message.guild.channels.cache.get(channelId);
					if (channel) await channel.delete().catch(() => { });
				}
			}

			db.run('DELETE FROM logs WHERE guild = ?', [message.guild.id]);
			return message.reply("Tous les salons de logs ont été supprimés");
		}

		let logsCategory = message.guild.channels.cache.find(
			c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === 'logs'
		);

		if (!logsCategory) {
			logsCategory = await message.guild.channels.create({
				name: 'Logs',
				type: ChannelType.GuildCategory,
				permissionOverwrites: [
					{
						id: message.guild.roles.everyone,
						deny: [PermissionFlagsBits.ViewChannel]
					},
					{
						id: message.guild.ownerId,
						allow: [PermissionFlagsBits.ViewChannel]
					}
				]
			});
		}

		let channelsObj = {};
		try {
			channelsObj = JSON.parse(
				await new Promise(res =>
					db.get('SELECT channels FROM logs WHERE guild = ?', [message.guild.id], (e, r) => res(r?.channels || '{}'))
				)
			);
		} catch { channelsObj = {}; }

		for (const name of logChannels) {
			let channel = message.guild.channels.cache.find(
				c => c.name === name && c.parentId === logsCategory.id
			);
			if (!channel) {
				channel = await message.guild.channels.create({
					name: name,
					type: ChannelType.GuildText,
					parent: logsCategory.id,
					permissionOverwrites: [
						{
							id: message.guild.roles.everyone,
							deny: [PermissionFlagsBits.ViewChannel]
						},
						{
							id: message.guild.ownerId,
							allow: [PermissionFlagsBits.ViewChannel]
						}
					]
				});
			}
			channelsObj[name] = channel.id;
		}

		db.run(
			`INSERT OR REPLACE INTO logs (guild, channels) VALUES (?, ?)`,
			[message.guild.id, JSON.stringify(channelsObj)]
		);

		return message.reply("Les salons de logs ont été créés.");
	},
}