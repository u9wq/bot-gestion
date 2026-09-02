import { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder, ComponentType } from 'discord.js';
import config from '../../Utils/config.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'embed',
	helpname: 'embed',
	description: 'Permet de créer un embed',
	help: 'embed',
	run: async (bot, message, args) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId("embedbuilder")
			.setPlaceholder("Choisissez une option")
			.addOptions(
				new StringSelectMenuOptionBuilder().setLabel("Modifier le Titre").setValue("embedtitle"),
				new StringSelectMenuOptionBuilder().setLabel("Modifier la Description").setValue("embeddescription"),
				new StringSelectMenuOptionBuilder().setLabel("Modifier l'Auteur").setValue("embedauthor"),
				new StringSelectMenuOptionBuilder().setLabel("Modifier le Footer").setValue("embedfooter"),
				new StringSelectMenuOptionBuilder().setLabel("Modifier le Thumbnail").setValue("embedthumbnail"),
				new StringSelectMenuOptionBuilder().setLabel("Modifier le Timestamp").setValue("embedtimestamp"),
				new StringSelectMenuOptionBuilder().setLabel("Modifier l'Image").setValue("embedimage"),
				new StringSelectMenuOptionBuilder().setLabel("Modifier l'URL").setValue("embedurl"),
				new StringSelectMenuOptionBuilder().setLabel("Modifier la Couleur").setValue("embedcolor"),
				new StringSelectMenuOptionBuilder().setLabel("Ajouter un Field").setValue("embedaddfield"),
				new StringSelectMenuOptionBuilder().setLabel("Supprimer un Field").setValue("embeddelfield"),
				new StringSelectMenuOptionBuilder().setLabel("Envoyer l'embed").setValue("embedsend")
			);

		const embedBuilderActionRow = new ActionRowBuilder().addComponents(selectMenu);
		let embed = new EmbedBuilder().setColor(config.color).setDescription(`\u200B`);

		const msg = await message.channel.send({
			content: `Bienvenue, ici vous pouvez créer un embed`,
		});
		const msgembed = await msg.channel.send({ embeds: [embed], components: [embedBuilderActionRow] });

		const filterSelect = i => message.author.id === i.user.id;
		const collector = msgembed.createMessageComponentCollector({
			filter: filterSelect,
			componentType: ComponentType.StringSelect
		});

		collector.on('collect', async (msgsd) => {
			msgsd.deferUpdate();
			const value = msgsd.values[0];
			const filter = m => m.author.id === message.author.id;

			if (value === "embedtitle") {
				const msgqst = await msgsd.message.channel.send({ content: "Quel sera le **Titre** de l'embed ?" });
				message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] })
					.then(async (collected) => {
						if (collected.first().content.length > 256) return msgsd.message.channel.send("Titre trop long (max 256 caractères).").then(async z => setTimeout(() => z.delete(), 2000));
						embed.setTitle(collected.first().content);
						collected.first().delete();
						msgqst.delete();
						msgembed.edit({ embeds: [embed] });
					});
			} else if (value === "embeddescription") {
				const msgqst = await msgsd.message.channel.send({ content: "Quel sera la **Description** de l'embed ?" });
				message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] })
					.then(async (collected) => {
						if (collected.first().content.length > 6000) return msgsd.message.channel.send({ content: "Description trop longue (max 6000 caractères)." }).then(async z => setTimeout(() => z.delete(), 2000));
						embed.setDescription(collected.first().content);
						collected.first().delete();
						msgqst.delete();
						msgembed.edit({ embeds: [embed] });
					});
			} else if (value === "embedcolor") {
				const msgqst = await msgsd.message.channel.send({ content: "Quel sera la **Couleur** de l'embed ? (ex: #6495ED)" });
				message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] })
					.then(async (collected) => {
						if (/^#[0-9A-F]{6}$/i.test(collected.first().content) !== true) return msgsd.message.channel.send({ content: "Couleur invalide." });
						embed.setColor(collected.first().content);
						collected.first().delete();
						msgqst.delete();
						msgembed.edit({ embeds: [embed] });
					});
			} else if (value === "embedauthor") {
				const msgqst = await msgsd.message.channel.send({ content: "Quel sera le nom de l'**Auteur** de l'embed ?" });
				message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] })
					.then(async (collected) => {
						embed.setAuthor({ name: collected.first().content });
						collected.first().delete();
						msgqst.delete();
						msgembed.edit({ embeds: [embed] });
					});
			} else if (value === "embedfooter") {
				const msgqst = await msgsd.message.channel.send({ content: "Quel sera le texte du **Footer** de l'embed ?" });
				message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] })
					.then(async (collected) => {
						embed.setFooter({ text: collected.first().content });
						collected.first().delete();
						msgqst.delete();
						msgembed.edit({ embeds: [embed] });
					});
			} else if (value === "embedthumbnail") {
				const msgqst = await msgsd.message.channel.send({ content: "Quel sera le **Thumbnail** de l'embed ? (URL d'image)" });
				message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] })
					.then(async (collected) => {
						embed.setThumbnail(collected.first().content);
						collected.first().delete();
						msgqst.delete();
						msgembed.edit({ embeds: [embed] });
					});
			} else if (value === "embedimage") {
				const msgqst = await msgsd.message.channel.send({ content: "Quelle sera l'**Image** de l'embed ? (URL d'image)" });
				message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] })
					.then(async (collected) => {
						embed.setImage(collected.first().content);
						collected.first().delete();
						msgqst.delete();
						msgembed.edit({ embeds: [embed] });
					});
			} else if (value === "embedtimestamp") {
				embed.setTimestamp(new Date());
				msgembed.edit({ embeds: [embed] });
			} else if (value === "embedurl") {
				const msgqst = await msgsd.message.channel.send({ content: "Quelle sera l'**URL** de l'embed ?" });
				message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] })
					.then(async (collected) => {
						embed.setURL(collected.first().content);
						collected.first().delete();
						msgqst.delete();
						msgembed.edit({ embeds: [embed] });
					});
			} else if (value === "embedaddfield") {
				const msgqst = await msgsd.message.channel.send({ content: "Quel sera le nom du **Field** ?" });
				message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] })
					.then(async (collected) => {
						const msgqsty = await msgsd.message.channel.send({ content: "Quel sera la description du **Field** ?" });
						message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] })
							.then(async (collected2) => {
								embed.addFields({ name: collected.first().content, value: collected2.first().content });
								collected.first().delete();
								collected2.first().delete();
								msgqst.delete();
								msgqsty.delete();
								msgembed.edit({ embeds: [embed] });
							});
					});
			} else if (value === "embeddelfield") {
				const msgqst = await msgsd.message.channel.send({ content: "Quel est le numéro du **Field** à supprimer ?" });
				message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] })
					.then(async (collected) => {
						const index = Number(collected.first().content) - 1;
						if (!isNaN(index) && embed.data.fields && embed.data.fields[index]) {
							embed.spliceFields(index, 1);
							msgembed.edit({ embeds: [embed] });
						}
						collected.first().delete();
						msgqst.delete();
					});
			} else if (value === "embedsend") {
				const msgqst = await msgsd.message.channel.send({ content: "Dans quel salon dois-je envoyer l'embed ? (mentionne ou donne l'ID)" });
				message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] })
					.then(async (collected) => {
						const channel = collected.first().mentions.channels.first() || message.guild.channels.cache.get(collected.first().content);
						if (!channel) return msgsd.message.channel.send({ content: "Salon introuvable." });
						channel.send({ embeds: [embed] });
						collected.first().delete();
						msgqst.delete();
					});
			}
		});
	},
}