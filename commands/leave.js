const { MessageEmbed } = require("discord.js");
const sendError = require("../util/error");

module.exports = {
    info: {
        name: "leave",
        aliases: ["disconnect", "rozlacz"],
        description: "Opuszcza kanal glosowy!",
        usage: "leave",
    },

    run: async function (client, message, args) {
        let channel = message.member.voice.channel;
        if (!channel) return sendError("Musisz byc na kanale glosowym!", message.channel);
        if (!message.guild.me.voice.channel) return sendError("Nie jestem na kanale glosowym!", message.channel);

        try {
            await message.guild.me.voice.channel.leave();
        } catch (error) {
            await message.guild.me.voice.kick(message.guild.me.id);
            return sendError("Proba opuszczenia kanalu...", message.channel);
        }

        const Embed = new MessageEmbed()
            .setAuthor("Rozlaczam sie", "https://raw.githubusercontent.com/SudhanPlayz/Discord-MusicBot/master/assets/Music.gif")
            .setColor("GREEN")
            .setTitle("Sukces")
            .setDescription("🎶 Rozlaczono.")
            .setTimestamp();

        return message.channel.send(Embed).catch(() => message.channel.send("🎶 Wyszedlem z kanalu glosowego :C"));
    },
};
