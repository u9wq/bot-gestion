import db from "./loadDatabase.js";

const types = {
	modlog: '📁・mod-logs',
	boostlog: '📁・boost-logs',
	messagelog: '📁・message-logs',
	raidlog: '📁・raid-logs',
	rolelog: '📁・role-logs',
	voicelog: '📁・voice-logs',
	ticketlog: '📁・ticket-logs',
	configlog: '📁・config-logs'
};

async function sendLog(guild, embed, type = 'modlog') {
	const channelKey = types[type];
	db.get('SELECT channels FROM logs WHERE guild = ?', [guild.id], (err, row) => {
		if (err || !row) return;
		let channelsObj;
		try {
			channelsObj = JSON.parse(row.channels);
		} catch {
			return;
		}
		const logChannelId = channelsObj[channelKey];
		if (!logChannelId) return;
		const logChannel = guild.channels.cache.get(logChannelId);
		if (logChannel) {
			logChannel.send({ embeds: [embed] }).catch(() => { });
		}
	});
}

export default sendLog;