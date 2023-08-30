import config from 'config';
import { EmbedBuilder, Guild, SlashCommandBuilder } from 'discord.js';
import osu from 'node-os-utils';
import { Logger } from 'pino';
// @ts-ignore
import { version } from '../../../../package.json';
import loggerModule from '../../../services/logger';
import { EmbedOptions } from '../../../types/configTypes';
import { CustomSlashCommandInteraction } from '../../../types/interactionTypes';
import { getUptimeFormatted } from '../../../utils/system/getUptimeFormatted';

const embedOptions: EmbedOptions = config.get('embedOptions');

const command: CustomSlashCommandInteraction = {
    isNew: false,
    isBeta: false,
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Show the bot and system status.')
        .setDMPermission(false)
        .setNSFW(false),
    execute: async ({ interaction, client, executionId }) => {
        const logger: Logger = loggerModule.child({
            source: 'status.js',
            module: 'slashCommand',
            name: '/status',
            executionId: executionId,
            shardId: interaction.guild?.shardId,
            guildId: interaction.guild?.id
        });

        const uptimeString: string = await getUptimeFormatted({ executionId });
        const usedMemoryInMB: string = Math.ceil((await osu.mem.info()).usedMemMb).toLocaleString('en-US');
        const cpuUsage: number = await osu.cpu.usage();
        const releaseVersion: string = version;
        let guildCount: number = 0;
        let memberCount: number = 0;
        let activeVoiceConnections: number = 0;
        let totalTracks: number = 0;
        let totalListeners: number = 0;

        await client!
            .shard!.broadcastEval(() => {
                /* eslint-disable no-undef */
                return player.generateStatistics();
            })
            .then((results) => {
                results.map((result) => {
                    activeVoiceConnections += result.queues.length;
                    result.queues.map((queue) => {
                        totalTracks += queue.status.playing ? queue.tracksCount + 1 : queue.tracksCount;
                        totalListeners += queue.listeners;
                    });
                });

                logger.debug('Successfully fetched player statistics from shards.');
            })
            .catch((error) => {
                logger.error(error, 'Failed to fetch player statistics from shards.');
            });

        await client!
            .shard!.fetchClientValues('guilds.cache')
            .then((results) => {
                const guildCaches: Guild[][] = results as Guild[][];
                guildCaches.map((guildCache: Guild[]) => {
                    if (guildCache) {
                        guildCount += guildCache.length;
                        memberCount += guildCache.reduce((acc: number, guild: Guild) => acc + guild.memberCount, 0);
                    }
                });

                logger.debug('Successfully fetched client values from shards.');
            })
            .catch((error) => {
                logger.error(error, 'Failed to fetch client values from shards.');
            });

        const botStatusString =
            `**${guildCount.toLocaleString('en-US')}** Joined servers\n` +
            `**${memberCount.toLocaleString('en-US')}** Total members\n` +
            `**v${releaseVersion}** Release version`;

        const queueStatusString =
            `**${activeVoiceConnections.toLocaleString('en-US')}** Voice connections\n` +
            `**${totalTracks.toLocaleString('en-US')}** Tracks in queues\n` +
            `**${totalListeners.toLocaleString('en-US')}** Users listening`;

        const systemStatusString =
            `**${uptimeString}** Uptime\n` + `**${cpuUsage}%** CPU usage\n` + `**${usedMemoryInMB} MB** Memory usage`;

        const discordStatusString: string = `**${client!.ws.ping} ms** Discord API latency`;

        logger.debug('Transformed status into into embed description.');

        logger.debug('Responding with info embed.');
        return await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`**${embedOptions.icons.bot} Bot status**\n` + botStatusString)
                    .addFields(
                        {
                            name: `**${embedOptions.icons.queue} Queue status**`,
                            value: queueStatusString,
                            inline: false
                        },
                        {
                            name: `**${embedOptions.icons.server} System status**`,
                            value: systemStatusString,
                            inline: false
                        },
                        {
                            name: `**${embedOptions.icons.discord} Discord status**`,
                            value: discordStatusString,
                            inline: false
                        }
                    )
                    .setColor(embedOptions.colors.info)
            ]
        });
    }
};

export default command;