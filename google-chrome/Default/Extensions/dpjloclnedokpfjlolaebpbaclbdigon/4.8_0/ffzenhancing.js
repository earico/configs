'use strict';
(() => {
    var ffzenhancing_focus_input_area_after_emote_select;
    var ffzenhancing_keep_delay_low;
    var ffzenhancing_keep_delay_low_delay;
    var ffzenhancing_keep_delay_low_delay_low_latency;
    var ffzenhancing_keep_delay_low_rate;
    var ffzenhancing_fix_tooltips;
    var timeoutPeriodicCheckVideoInfo;
    var handlers_already_attached = {};


    function checkExistance(attempts) {
        if (window.FrankerFaceZ) {
            main_init();
        } else {
            const newAttempts = (attempts || 0) + 1;
            if (newAttempts < 60)
                return setTimeout(checkExistance.bind(this, newAttempts), 1000);
            console.warn(`[FFZ:FFZ Enhancing Add-On] Could not find FFZ. Injection unsuccessful. (Host: ${window.location.host})`);
        }
    };


    function schedulePeriodicCheckVideoInfo(ms) {
        if (timeoutPeriodicCheckVideoInfo) clearTimeout(timeoutPeriodicCheckVideoInfo);
        timeoutPeriodicCheckVideoInfo = setTimeout(periodicCheckVideoInfo, ms || 500);
    }


    function periodicCheckVideoInfo() {
        const video = document.querySelector('video');
        if (video) {
            var player = FrankerFaceZ.get().resolve('site.player');
            if (player.current) player = player.current;
            if (player.player) player = player.player;
            const stats = player && player.getStats && player.getStats();
            if (stats && stats.latencyMode) { // stats.latencyMode is present when video is live
                const lat = Math.max(stats.hlsLatencyBroadcaster, stats.bufferSize);
                const isLowDelayEnabled = stats.latencyMode && stats.latencyMode == 'Low Latency';
                const delay = isLowDelayEnabled ? ffzenhancing_keep_delay_low_delay_low_latency : ffzenhancing_keep_delay_low_delay;
                if (lat > delay) {
                    video.playbackRate = ffzenhancing_keep_delay_low_rate;
                    schedulePeriodicCheckVideoInfo();
                    return;
                } else {
                    video.playbackRate = 1;
                }
            }
        }
        if (ffzenhancing_keep_delay_low) schedulePeriodicCheckVideoInfo(5000);
    }


    function main_init() {
        class FFZEnhancingAddOn extends FrankerFaceZ.utilities.module.Module {
            constructor(...args) {
                super(...args);
                this.inject('settings');
                this.settings.add('ffzenhancing.focus_input_area_after_emote_select', {
                    default: true,
                    ui: {
                        path: 'Add-Ons > FFZ Enhancing Add-On >> General',
                        title: 'Focus Input Area After Emote Select',
                        description: 'Move focus to input area after emote is selected.',
                        component: 'setting-check-box',
                    },
                    changed: (val) => ffzenhancing_focus_input_area_after_emote_select = val
                });
                this.settings.add('ffzenhancing.keep_delay_low', {
                    default: true,
                    ui: {
                        path: 'Add-Ons > FFZ Enhancing Add-On >> General',
                        title: 'Keep Video Delay Low',
                        description: 'Keep video delay low by increasing video playing speed.',
                        component: 'setting-check-box',
                    },
                    changed: (val) => {
                        ffzenhancing_keep_delay_low = val;
                        schedulePeriodicCheckVideoInfo();
                    }
                });
                this.settings.add('ffzenhancing.keep_delay_low_delay', {
                    default: 8.5,
                    ui: {
                        path: 'Add-Ons > FFZ Enhancing Add-On >> General',
                        title: 'Maximum Video Delay',
                        description: 'Maximum video delay after which video speed will be increased.',
                        component: 'setting-text-box',
                        process: (val) => parseFloat(val)
                    },
                    changed: (val) => ffzenhancing_keep_delay_low_delay = val
                });
                this.settings.add('ffzenhancing.keep_delay_low_delay_low_latency', {
                    default: 5,
                    ui: {
                        path: 'Add-Ons > FFZ Enhancing Add-On >> General',
                        title: 'Maximum Video Delay in Low Latency',
                        description: 'Maximum video delay in low latency mode after which video speed will be increased.',
                        component: 'setting-text-box',
                        process: (val) => parseFloat(val)
                    },
                    changed: (val) => ffzenhancing_keep_delay_low_delay_low_latency = val
                });
                this.settings.add('ffzenhancing.keep_delay_low_rate', {
                    default: 1.05,
                    ui: {
                        path: 'Add-Ons > FFZ Enhancing Add-On >> General',
                        title: 'Increased Video Playback Rate',
                        description: 'Video playback rate which will be set after Maximum Video Delay is reached.',
                        component: 'setting-text-box',
                        process: (val) => {
                            val = parseFloat(val);
                            if (isNaN(val) || !isFinite(val)) val = 1.05;
                            if (val < 1.01) val = 1.01;
                            if (val > 5) val = 5;
                            return val;
                        }
                    },
                    changed: (val) => ffzenhancing_keep_delay_low_rate = val
                });
                this.settings.add('ffzenhancing.fix_tooltips', {
                    default: false,
                    ui: {
                        path: 'Add-Ons > FFZ Enhancing Add-On >> General',
                        title: 'Fix FFZ Tooltips',
                        description: 'Hide hanged tooltips on mouse click.',
                        component: 'setting-check-box',
                    },
                    changed: (val) => ffzenhancing_fix_tooltips = val
                });
            }
            onEnable() {
                this.log.debug('FFZ:FFZ Enhancing Add-On was enabled successfully.');
                ffzenhancing_focus_input_area_after_emote_select = this.settings.get('ffzenhancing.focus_input_area_after_emote_select');
                ffzenhancing_keep_delay_low = this.settings.get('ffzenhancing.keep_delay_low');
                ffzenhancing_keep_delay_low_delay = this.settings.get('ffzenhancing.keep_delay_low_delay');
                ffzenhancing_keep_delay_low_delay_low_latency = this.settings.get('ffzenhancing.keep_delay_low_delay_low_latency');
                ffzenhancing_keep_delay_low_rate = this.settings.get('ffzenhancing.keep_delay_low_rate');
                ffzenhancing_fix_tooltips = this.settings.get('ffzenhancing.fix_tooltips');
                schedulePeriodicCheckVideoInfo();

                if (!handlers_already_attached['ffzenhancing_focus_input_area_after_emote_select']) {
                    handlers_already_attached['ffzenhancing_focus_input_area_after_emote_select'] = true;
                    document.body.addEventListener('click', (e) => {
                        if (ffzenhancing_focus_input_area_after_emote_select && e.target.classList.contains('emote-picker__emote-link')) {
                            setTimeout(() => {
                                var el = document.querySelector('.chat-input textarea');
                                if (!el) return;
                                var txt = el.value;
                                if (txt && txt.substr(-1) != ' ')
                                    txt = txt + ' ';
                                el.value = txt;
                                el.selectionStart = txt.length;
                                el.selectionEnd = txt.length;
                                el.focus();
                            }, 0);
                        }
                        if (ffzenhancing_fix_tooltips) {
                            setTimeout(() => {
                                var el = document.querySelector('.ffz__tooltip');
                                if (!el) return;
                                el.parentNode.removeChild(el);
                            }, 0);
                        }
                    });
                }
            }
        }
        FrankerFaceZ.get().register('addon.ffzenhancing', FFZEnhancingAddOn).enable();
    }


    setTimeout(checkExistance, 1000);
})();
