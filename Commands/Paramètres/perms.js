import config from '../../Utils/config.js';
import db from '../../Events/loadDatabase.js';
import * as Discord from "discord.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'perms',
	helpname: 'perms',
	description: "Permet de gérer les permissions",
	help: 'perms',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;



		db.all('SELECT * FROM permissions WHERE guild = ?', [message.guild.id], async (err, rows) => {
			if (err) {
				return;
			}

			const embed = new Discord.EmbedBuilder()
				.setTitle('Liste des rôles par permissions')
				.setColor(config.color);

			for (let i = 1; i <= 12; i++) {
				const roles = rows.filter(row => row.perm === i).map(row => {
					const role = message.guild.roles.cache.get(row.id);
					return role ? `${role} - \`${role.id}\`` : `${row.id}`;
				});
				embed.addFields({
					name: `Permissions ${i}`,
					value: roles.length > 0 ? roles.join('\n') : ' '
				});
			}
			embed.setImage('https://media.discordapp.net/attachments/1271399515877802049/1284775059705040947/sq2.png?ex=66e7db84&is=66e68a04&hm=e00d6a85d02276604e84836207bfa3970e3d1219c1132254849db3d560656971&=&format=webp&quality=lossless&width=705&height=11');
			message.reply({ embeds: [embed] });
		});
	},
}