import { ChannelType, PermissionFlagsBits } from 'discord.js';
import db from '../../Events/loadDatabase.js';
import config from '../../config.json' with { type: 'json' };
import { denyIfNoPerm } from '../../Utils/perms.js';
export const command = {
	name: 'rolelog',
	help: 'rolelog [off]',
	helpname: 'rolelog [off]',
	description: 'Active/désactive les logs rôle',
	run: async (client, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;




		const action = args[0]?.toLowerCase();

		if (action === 'off') {
			let channelsObj = {};
			try {
				channelsObj = JSON.parse(
					await new Promise(res =>
						db.get(
							'SELECT channels FROM logs WHERE guild = ?',
							[message.guild.id],
							(err, row) => res(row?.channels || '{}')
						)
					)
				);
			} catch { channelsObj = {}; }

			const channelId = channelsObj["📁・role-logs"];
			if (channelId) {
				const channel = message.guild.channels.cache.get(channelId);
				if (channel) await channel.delete().catch(() => { });
				delete channelsObj["📁・role-logs"];
				db.run(
					`INSERT OR REPLACE INTO logs (guild, channels) VALUES (?, ?)`,
					[message.guild.id, JSON.stringify(channelsObj)]
				);
				return message.reply("Les logs de rôle sont désactivé.");
			} else {
				return message.reply("Pas de logs role configuré.");
			}
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
						deny: [PermissionFlagsBits.ViewChannel],
					},
					{
						id: message.guild.ownerId,
						allow: [PermissionFlagsBits.ViewChannel],
					},
				],
			});
		}

		const newChannel = message.mentions.channels.first() ||
			message.guild.channels.cache.get(args[0]) ||
			message.channel;

		if (!newChannel) {
			return message.reply("Salon invalide");
		}

		let finalChannel = newChannel;
		if (newChannel.parentId !== logsCategory.id) {
			finalChannel = await message.guild.channels.create({
				name: "📁・role-logs",
				type: ChannelType.GuildText,
				parent: logsCategory.id,
				permissionOverwrites: [
					{
						id: message.guild.roles.everyone,
						deny: [PermissionFlagsBits.ViewChannel],
					},
					{
						id: message.guild.ownerId,
						allow: [PermissionFlagsBits.ViewChannel],
					},
				],
			});
		}

		let channelsObj = {};
		try {
			channelsObj = JSON.parse(
				await new Promise(res =>
					db.get(
						'SELECT channels FROM logs WHERE guild = ?',
						[message.guild.id],
						(err, row) => res(row?.channels || '{}')
					)
				)
			);
		} catch {
			channelsObj = {};
		}

		channelsObj["📁・role-logs"] = finalChannel.id;

		db.run(
			`INSERT OR REPLACE INTO logs (guild, channels) VALUES (?, ?)`,
			[message.guild.id, JSON.stringify(channelsObj)]
		);

		await message.reply(`<#${finalChannel.id}>`);
	},
}