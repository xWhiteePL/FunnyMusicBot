const { Util, MessageEmbed } = require("discord.js");
const ytdl = require("ytdl-core");
const yts = require("yt-search");
const ytdlDiscord = require("ytdl-core-discord");
var ytpl = require("ytpl");
const sendError = require("../util/error");
const fs = require("fs");

module.exports = {
    info: {
        name: "playlist",
        description: "By wlaczyc muzke z playlisty :D",
        usage: "<YouTube Playlist URL | Playlist Name>",
        aliases: ["pl"],
    },

    run: async function (client, message, args) {
        const channel = message.member.voice.channel;
        if (!channel) return sendError("Musisz byc na kanale glosowym by uzyc tej komendy!", message.channel);
        const url = args[0] ? args[0].replace(/<(.+)>/g, "$1") : "";
        var searchString = args.join(" ");
        const permissions = channel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT")) return sendError("Nie moge dolaczyc na ten kanal glosowy, upewnij sie ze mam odpowiednie uprawnienia!", message.channel);
        if (!permissions.has("SPEAK")) return sendError("Nie moge grac na tym kanale, upewnij sie ze mam odpowiednie uprawnienia!", message.channel);

        if (!searchString || !url) return sendError(`Uzycie: ${message.client.config.prefix}playlist <YouTube Playlist URL | Playlist Name>`, message.channel);
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            try {
                const playlist = await ytpl(url.split("list=")[1]);
                if (!playlist) return sendError("Nie znalazlem tej playlisty", message.channel);
                const videos = await playlist.items;
                for (const video of videos) {
                    // eslint-disable-line no-await-in-loop
                    await handleVideo(video, message, channel, true); // eslint-disable-line no-await-in-loop
                }
                return message.channel.send({
                    embed: {
                        color: "GREEN",
                        description: `✅  **|**  Playlist\`a: **\`${videos[0].title}\`** zostala dodana do kolejki`,
                    },
                });
            } catch (error) {
                console.error(error);
                return sendError("Nie znalazlem playlisty :(", message.channel).catch(console.error);
            }
        } else {
            try {
                var searched = await yts.search(searchString);

                if (searched.playlists.length === 0) return sendError("Nie moge znalezc tej playlisty na YouTub\`ie", message.channel);
                var songInfo = searched.playlists[0];
                let listurl = songInfo.listId;
                const playlist = await ytpl(listurl);
                const videos = await playlist.items;
                for (const video of videos) {
                    // eslint-disable-line no-await-in-loop
                    await handleVideo(video, message, channel, true); // eslint-disable-line no-await-in-loop
                }
                let thing = new MessageEmbed()
                    .setAuthor("Playlista zostala dodana", "https://raw.githubusercontent.com/SudhanPlayz/Discord-MusicBot/master/assets/Music.gif")
                    .setThumbnail(songInfo.thumbnail)
                    .setColor("GREEN")
                    .setDescription(`✅  **|**  Playlist: **\`${songInfo.title}\`** has been added \`${songInfo.videoCount}\` video to the queue`);
                return message.channel.send(thing);
            } catch (error) {
                return sendError("An unexpected error has occurred", message.channel).catch(console.error);
            }
        }

        async function handleVideo(video, message, channel, playlist = false) {
            const serverQueue = message.client.queue.get(message.guild.id);
            const song = {
                id: video.id,
                title: Util.escapeMarkdown(video.title),
                views: video.views ? video.views : "-",
                ago: video.ago ? video.ago : "-",
                duration: video.duration,
                url: `https://www.youtube.com/watch?v=${video.id}`,
                img: video.thumbnail,
                req: message.author,
            };
            if (!serverQueue) {
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

                try {
                    var connection = await channel.join();
                    queueConstruct.connection = connection;
                    play(message.guild, queueConstruct.songs[0]);
                } catch (error) {
                    console.error(`Nie moge dolaczyc na kanal glosowy: ${error}`);
                    message.client.queue.delete(message.guild.id);
                    return sendError(`Nie moge dolaczyc na kanal glosowy: ${error}`, message.channel);
                }
            } else {
                serverQueue.songs.push(song);
                if (playlist) return;
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
            return;
        }

        async function play(guild, song) {
            const serverQueue = message.client.queue.get(message.guild.id);
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
                        if (serverQueue) {
                            serverQueue.songs.shift();
                            play(guild, serverQueue.songs[0]);
                            return sendError(`An unexpected error has occurred.\nPossible type \`${er}\``, message.channel);
                        }
                    }
                });
            }

            serverQueue.connection.on("disconnect", () => message.client.queue.delete(message.guild.id));
            const dispatcher = serverQueue.connection.play(ytdl(song.url, { quality: "highestaudio", highWaterMark: 1 << 25, type: "opus" })).on("finish", () => {
                const shiffed = serverQueue.songs.shift();
                if (serverQueue.loop === true) {
                    serverQueue.songs.push(shiffed);
                }
                play(guild, serverQueue.songs[0]);
            });

            dispatcher.setVolume(serverQueue.volume / 100);
            let thing = new MessageEmbed()
                .setAuthor("Zaczalem grac muzyke!", "https://raw.githubusercontent.com/SudhanPlayz/Discord-MusicBot/master/assets/Music.gif")
                .setThumbnail(song.img)
                .setColor("BLUE")
                .addField("Nazwa", song.title, true)
                .addField("Dlugosc", song.duration, true)
                .addField("Wlaczona przez", song.req.tag, true)
                .setFooter(`Wyswietlenia: ${song.views} | ${song.ago}`);
            serverQueue.textChannel.send(thing);
        }
    },
};
