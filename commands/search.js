const { Util, MessageEmbed } = require("discord.js");
const ytdl = require("ytdl-core");
const yts = require("yt-search");
const ytdlDiscord = require("ytdl-core-discord");
const YouTube = require("youtube-sr");
const sendError = require("../util/error");
const fs = require("fs");

module.exports = {
    info: {
        name: "search",
        description: "To search songs :D",
        usage: "<song_name>",
        aliases: ["sc"],
    },

    run: async function (client, message, args) {
        let channel = message.member.voice.channel;
        if (!channel) return sendError("Musisz byc na kanale glosowym by tego uzyc!", message.channel);

        const permissions = channel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT")) return sendError("Nie moge dolaczyc na kanal glosowy, upewnij sie ze mam odpowiednie uprawnienia!", message.channel);
        if (!permissions.has("SPEAK")) return sendError("Nie moge mowic na tym kanale glosowym, upewnij sie ze mam odpowiednie uprawnienia!", message.channel);

        var searchString = args.join(" ");
        if (!searchString) return sendError("Nie podalesz czego mam szukac", message.channel);

        var serverQueue = message.client.queue.get(message.guild.id);
        try {
            var searched = await YouTube.search(searchString, { limit: 10 });
            if (searched[0] == undefined) return sendError("Nie moge wyszukac tej piosenki na YouTub\`ie`", message.channel);
            let index = 0;
            let embedPlay = new MessageEmbed()
                .setColor("BLUE")
                .setAuthor(`Wyniki do \"${args.join(" ")}\"`, message.author.displayAvatarURL())
                .setDescription(`${searched.map((video2) => `**\`${++index}\`  |** [\`${video2.title}\`](${video2.url}) - \`${video2.durationFormatted}\``).join("\n")}`)
                .setFooter("Wybierz numer piosenki by dodac ja do listy odtwarzania");
            // eslint-disable-next-line max-depth
            message.channel.send(embedPlay).then((m) =>
                m.delete({
                    timeout: 15000,
                })
            );
            try {
                var response = await message.channel.awaitMessages((message2) => message2.content > 0 && message2.content < 11, {
                    max: 1,
                    time: 20000,
                    errors: ["time"],
                });
            } catch (err) {
                console.error(err);
                return message.channel.send({
                    embed: {
                        color: "RED",
                        description: "Nic nie wybrales w ciagu 20 sekund, zgloszenie zostaje usuniete.",
                    },
                });
            }
            const videoIndex = parseInt(response.first().content);
            var video = await searched[videoIndex - 1];
        } catch (err) {
            console.error(err);
            return message.channel.send({
                embed: {
                    color: "RED",
                    description: "🆘  **|**  Nie moge zobaczyc zadnego wyniku wyszukiwania",
                },
            });
        }

        response.delete();
        var songInfo = video;

        const song = {
            id: songInfo.id,
            title: Util.escapeMarkdown(songInfo.title),
            views: String(songInfo.views).padStart(10, " "),
            ago: songInfo.uploadedAt,
            duration: songInfo.durationFormatted,
            url: `https://www.youtube.com/watch?v=${songInfo.id}`,
            img: songInfo.thumbnail.url,
            req: message.author,
        };

        if (serverQueue) {
            serverQueue.songs.push(song);
            let thing = new MessageEmbed()
                .setAuthor("Piosenka zostala dodana do kolejki", "https://raw.githubusercontent.com/SudhanPlayz/Discord-MusicBot/master/assets/Music.gif")
                .setThumbnail(song.img)
                .setColor("YELLOW")
                .addField("Nazwa", song.title, true)
                .addField("Dlugosc", song.duration, true)
                .addField("Wlaczona przez", song.req.tag, true)
                .setFooter(`Wyswietlenia: ${song.views} | ${song.ago}`);
            return message.channel.send(thing);
        }

        const queueConstruct = {
            textChannel: message.channel,
            voiceChannel: channel,
            connection: null,
            songs: [],
            volume: 80,
            playing: true,
            loop: false,
        };
        message.client.queue.set(message.guild.id, queueConstruct);
        queueConstruct.songs.push(song);

        const play = async (song) => {
            const queue = message.client.queue.get(message.guild.id);
            if (!song) {
                sendError(
                    "Opuszczam kanal glosowy bo nie widze zadnej piosenki w kolejce",
                    message.channel
                );
                message.guild.me.voice.channel.leave(); //If you want your bot stay in vc 24/7 remove this line :D
                message.client.queue.delete(message.guild.id);
                return;
            }
            let stream = null;
            if (song.url.includes("youtube.com")) {
                stream = await ytdl(song.url);
                stream.on("error", function (er) {
                    if (er) {
                        if (queue) {
                            queue.songs.shift();
                            play(queue.songs[0]);
                            return sendError(`An unexpected error has occurred.\nPossible type \`${er}\``, message.channel);
                        }
                    }
                });
            }

            queue.connection.on("disconnect", () => message.client.queue.delete(message.guild.id));
            const dispatcher = queue.connection.play(ytdl(song.url, { quality: "highestaudio", highWaterMark: 1 << 25, type: "opus" })).on("finish", () => {
                const shiffed = queue.songs.shift();
                if (queue.loop === true) {
                    queue.songs.push(shiffed);
                }
                play(queue.songs[0]);
            });

            dispatcher.setVolumeLogarithmic(queue.volume / 100);
            let thing = new MessageEmbed()
                .setAuthor("Wlaczono odtwarzanie muzyki!", "https://raw.githubusercontent.com/SudhanPlayz/Discord-MusicBot/master/assets/Music.gif")
                .setThumbnail(song.img)
                .setColor("BLUE")
                .addField("Nazwa", song.title, true)
                .addField("Dlugosc", song.duration, true)
                .addField("Wlaczona przez", song.req.tag, true)
                .setFooter(`Wyswietlenia: ${song.views} | ${song.ago}`);
            queue.textChannel.send(thing);
        };

        try {
            const connection = await channel.join();
            queueConstruct.connection = connection;
            channel.guild.voice.setSelfDeaf(true);
            play(queueConstruct.songs[0]);
        } catch (error) {
            console.error(`Nie moge dolaczyc na kanal glosowy: ${error}`);
            message.client.queue.delete(message.guild.id);
            await channel.leave();
            return sendError(`Nie moge dolaczyc na kanal glosowy: ${error}`, message.channel);
        }
    },
};
