let recentKey = -1
let recentInput = []
let notificationId = 0;
let helpNotifyTimeout = null;
let helpNotifyActive = false;
let isSpeedoActive = false; 
let zoneTimeouts = {}; 
let mutedTimeout = null; 
let helpSectionTimeout = null; 
let progressInterval = null;
let progressHideTimeout = null;
let robberyTimeout = null; 
let statusTopTimeout = null;
let hasWeaponEquipped = false;
let currentSettings = {
    voice_range: true,
    radio_display: true,
    hungry: true,
    thirst: true,
    notifications: true,
    street_display: true,
    date_time: true,
    player_id: true,
    online_count: true,
    cash_money: true,
    bank_money: true,
    ammo_display: true,
    radio_list: true,
    job_display: true,
    help_notify: true,
    speedometer: true
};

const cachedElements = {
    speedoIcons: null,
    speedoBoxes: null,
    speedoTexts: null,
    lastSpeedoStates: {
        engine: null,
        lock: null,
        light: null,
        seatbelt: null
    },
    init() {
        this.speedoIcons = {
            wrap: {
                engine: $(".speedo_wrap #engine"),
                lock: $(".speedo_wrap #lock"),
                light: $(".speedo_wrap #light"),
                seatbelt: $(".speedo_wrap #seatbelt")
            },
            lock: $('.speedo_second .flex_icons_sp svg').eq(0),
            light: $('.speedo_second .flex_icons_sp svg').eq(1),
            engine: $('.speedo_second .flex_icons_sp svg').eq(2),
            seatbelt: $('.speedo_second #seatbelt') 
        };
        this.speedoTexts = {
            grTxSp: $('.gr_tx_sp'),
            flWh: $('.fl_wh'),
            whFuel: $('.wh_fuel'),
            valueFuel: $('.value_fuel'),
            valueRpm: $('.value_rpm'),
            valueSp: $('.value_sp'),
            speedProgress: $('#speed_progress'),
            arrowSp: $('.arrow_sp'),
            odoWrap: $('#odo_wrap_val'),
            odoSec:  $('#odo_sec_val'),
        };
    }
};

function updateTimeAndDate() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('ru-RU');
    const timeElem = document.getElementById('time');
    if (timeElem) timeElem.textContent = timeStr;
    const dateElem = document.getElementById('date');
    if (dateElem) dateElem.textContent = dateStr;
}

setInterval(updateTimeAndDate, 60000);


function applyServerBranding(branding) {
    const config = branding || {};
    const $wrapper = $('#server_branding');
    const $logo = $('#server_branding_logo');
    const $text = $('#server_branding_text');

    if (!$wrapper.length) return;

    if (config.enabled === false) {
        $wrapper.hide();
        return;
    }

    const mode = String(config.mode || 'both').toLowerCase();
    const validMode = ['logo', 'text', 'both'].includes(mode) ? mode : 'both';
    const text = String(config.text || '').trim();
    const logo = String(config.logo || '').trim();
    const logoSide = String(config.logoSide || 'right').toLowerCase() === 'left' ? 'left' : 'right';

    $wrapper
        .removeClass('brand-logo-only brand-text-only brand-both brand-logo-left brand-logo-right')
        .addClass(validMode === 'logo' ? 'brand-logo-only' : validMode === 'text' ? 'brand-text-only' : 'brand-both')
        .addClass(logoSide === 'right' ? 'brand-logo-right' : 'brand-logo-left')
        .show();

    $text.text(text || 'TimeLine');

    if (logo) {
        $logo.attr('src', logo).show();
    } else {
        $logo.hide();
    }

    if (validMode === 'text' || !logo) $logo.hide();
    if (validMode === 'logo') $text.hide(); else $text.show();

    const root = document.documentElement;
    if (config.logoHeight) root.style.setProperty('--timeline-brand-logo-height', String(config.logoHeight));
    if (config.textSize) root.style.setProperty('--timeline-brand-text-size', String(config.textSize));
    if (config.gap) root.style.setProperty('--timeline-brand-gap', String(config.gap));

    $logo.off('error.timelineBrand').on('error.timelineBrand', function() {
        $(this).hide();
        if (validMode === 'logo') $wrapper.hide();
    });
}

function applyJobDutyDisplay(fraction) {
    const el = $("#data_job_duty");
    if (!el.length) return;
    const state = fraction && fraction.duty_state;
    el.removeClass("duty-on duty-off duty-hide");
    if (!state || state === "hide") {
        el.text("").addClass("duty-hide");
        return;
    }
    el.text((fraction && fraction.duty) || "");
    if (state === "on") el.addClass("duty-on");
    else if (state === "off") el.addClass("duty-off");
}

window.addEventListener('message', function(event) {
    const item = event.data

    switch (item.action) {
        case "LoadHudLayout":
            applyElementPositions(item.layout);
        break;
        case "LoadHudPreferences": {
            const prefs = item.preferences || {};
            if (prefs.settings && typeof prefs.settings === 'object') {
                Object.keys(currentSettings).forEach(setting => {
                    if (typeof prefs.settings[setting] === 'boolean') {
                        currentSettings[setting] = prefs.settings[setting];
                    }
                });
                Object.keys(currentSettings).forEach(setting => {
                    updateSwitchDisplay(setting, currentSettings[setting]);
                    applySetting(setting, currentSettings[setting]);
                });
            }

            const speedVariant = Number(prefs.speedoVariant);
            const foodVariant = Number(prefs.foodVariant);
            currentSpeedoVariant = speedVariant === 2 ? 2 : 1;
            currentFoodVariant = foodVariant === 2 ? 2 : 1;

            $('#speedo_option .sect_opt').removeClass('sect_opt_selected');
            $('#speedo_option .sect_opt').eq(currentSpeedoVariant - 1).addClass('sect_opt_selected');
            $('#food_option .sect_opt').removeClass('sect_opt_selected');
            $('#food_option .sect_opt').eq(currentFoodVariant - 1).addClass('sect_opt_selected');
            applySpeedoVariant(currentSpeedoVariant);
            applyFoodVariant(currentFoodVariant);

            // Alte Browser-Speicherung nach erfolgreicher KVP-Ladung entfernen.
            localStorage.removeItem('hudSettings');
            localStorage.removeItem('speedoVariant');
            localStorage.removeItem('foodVariant');
            break;
        }
        case "MigrateLegacyHudPreferences":
            saveSettings();
            localStorage.removeItem('hudSettings');
            localStorage.removeItem('speedoVariant');
            localStorage.removeItem('foodVariant');
        break;
        case "MigrateLegacyHudLayout": {
            const saved = localStorage.getItem('hudElementPositions');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    applyElementPositions(parsed);
                    $.post(`https://${GetParentResourceName()}/saveHudLayout`, JSON.stringify({ layout: parsed }));
                } catch (_) {}
            }
            localStorage.removeItem('hudElementPositions');
            break;
        }
        case "LoadHud":
            $("body").fadeIn();
            applyServerBranding(item.branding);
            const accounts = Array.isArray(item.accounts) ? item.accounts : [];
            accounts.forEach(account => {
                $(`#account_${account.name}`).text(account.money.toLocaleString("de-DE")  + "$")
            })

            for (const key in item.fraction) {
                if (Object.hasOwnProperty.call(item.fraction, key)) {
                    if (key === "duty_state") continue;
                    $(`#data_job_${key}`).text(item.fraction[key])
                }
            }
            applyJobDutyDisplay(item.fraction);

            $("#data_source").text(item.source)
            $(".form").fadeIn()
            updateTimeAndDate();
            
            
            if (item.voiceIndex !== undefined) {
                const initialDots = document.querySelectorAll("#micro .dot_mc");
                initialDots.forEach((dot, index) => {
                    if (index <= item.voiceIndex) {
                        dot.classList.add("active_mc");
                    } else {
                        dot.classList.remove("active_mc");
                    }
                });
            }
            
           
        break;
        case "UpdateAccount":
            $(`#account_${item.account.name}`).text(item.account.money.toLocaleString("de-DE") + "$")
        break;
        case "MoneyChange": {
            const rawAmount = Number(item.amount) || 0;
            if (rawAmount === 0) break;

            const isPositive = rawAmount > 0;
            const formattedAmount = Math.abs(rawAmount).toLocaleString("de-DE");
            const displayText = (isPositive ? "+" : "-") + formattedAmount + "$";

            const accountType = item.accountType;
            let baseId;

            if (accountType === "money" || accountType === "cash" || !accountType) {
                baseId = "account_money";
            } else if (accountType === "bank") {
                baseId = "account_bank";
            } else {
                baseId = `account_${accountType}`;
            }

            const $amountSpan = $(`#${baseId}`);
            if ($amountSpan.length === 0) break;

            const $changeSpan = $amountSpan.next();
            if ($changeSpan.length === 0) break;

            $changeSpan
                .text(displayText)
                .removeClass("money-change-pos money-change-neg")
                .addClass(isPositive ? "money-change-pos" : "money-change-neg")
                .stop(true, true)
                .css({ opacity: 0, transform: "translateY(0.2vw)" })
                .show()
                .animate(
                    { opacity: 1 },
                    {
                        duration: 250,
                        step: function (now) {
                            $(this).css("transform", "translateY(" + (0.2 * (1 - now)) + "vw)");
                        }
                    }
                );

            const oldTimeout = $changeSpan.data("moneyTimeout");
            if (oldTimeout) {
                clearTimeout(oldTimeout);
            }
            const timeoutId = setTimeout(() => {
                $changeSpan.fadeOut(250);
            }, 3000);
            $changeSpan.data("moneyTimeout", timeoutId);
        }
        break;
        case "UpdateFraction":
            for (const key in item.fraction) {
                if (Object.hasOwnProperty.call(item.fraction, key)) {
                    if (key === "duty_state") continue;
                    $(`#data_job_${key}`).text(item.fraction[key])
                }
            }
            applyJobDutyDisplay(item.fraction);
        break;
        case "HideHud":
            if (item.state) {
                $("body").stop(true, true).css("opacity", 1).hide()
            } else {
                $("body").stop(true, true).show()
            }
        break;
        case "SetStreet":
            $("#data_street").text(item.street)
            $("#data_postal").text(item.postal)
        break;
        case "SetVoiceRange":
            const dots = document.querySelectorAll("#micro .dot_mc");
            const rangeIndex = item.index || 0; 
            
            dots.forEach((dot, index) => {
                if (index <= rangeIndex) {
                    dot.classList.add("active_mc");
                } else {
                    dot.classList.remove("active_mc");
                }
            });
        break;
        case "UpdateVoiceRange":
            const dotsUpdate = document.querySelectorAll("#micro .dot_mc");
            const rangeIndexUpdate = item.index !== undefined ? item.index : 0;
            const voiceRange = item.range || 0;
            
            dotsUpdate.forEach((dot, index) => {
                if (index <= rangeIndexUpdate) {
                    dot.classList.add("active_mc");
                } else {
                    dot.classList.remove("active_mc");
                }
            });
        break;
        case "SetVoiceMode":
            const voiceModeDots = document.querySelectorAll("#micro .dot_mc");
            const modeIndex = item.mode !== undefined && item.mode !== null ? Number(item.mode) : 0;
            
            voiceModeDots.forEach((dot, index) => {
                if (index <= modeIndex) {
                    dot.classList.add("active_mc");
                } else {
                    dot.classList.remove("active_mc");
                }
            });
        break;
        case "SetTalking":
            if (item.state) {
                $("#micro").removeClass("muted").addClass("talked");
            } else {
                $("#micro").removeClass("talked").addClass("muted");
            }
        break;
        case "SetMicMuted":
            if (item.state) {
                $("#micro").addClass("mic_muted").removeClass("talked");
            } else {
                $("#micro").removeClass("mic_muted");
            }
        break;
        case "SetPluginState":
            if (item.connected) {
                $("#micro").addClass("muted").removeClass("talked");
            } else {
                $("#micro").removeClass("talked muted");
            }
        break;
        case "SetWeapon":
            if (item.weapon) {
                const ammo = parseInt(item.weapon.ammo) || 0;
                const maxAmmo = parseInt(item.weapon.maxAmmo) || 0;
                const weaponName = item.weapon.name || "Unknown";

                hasWeaponEquipped = true;
                $(".name_gun").text(weaponName);
                $(".flex_ammo span:first").text(ammo);
                $(".flex_ammo span:last").text("/" + maxAmmo);
                if (currentSettings.ammo_display) {
                    $(".ammo_cont").css('display', 'flex');
                }
            } else {
                hasWeaponEquipped = false;
                $(".ammo_cont").fadeOut();
            }
        break;
        case "HideWeapon":
            hasWeaponEquipped = false;
            $(".ammo_cont").fadeOut();
        break;
        case "Notification":
            if (!currentSettings.notifications) break;
            let classes = {
                ["success"]: {
                    name: "nf_success",
                    text: "SUCCESS",
                    icon: `
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path fill-rule="evenodd" clip-rule="evenodd" d="M10 17.5C10.9849 17.5 11.9602 17.306 12.8701 16.9291C13.7801 16.5522 14.6069 15.9997 15.3033 15.3033C15.9997 14.6069 16.5522 13.7801 16.9291 12.8701C17.306 11.9602 17.5 10.9849 17.5 10C17.5 9.01509 17.306 8.03982 16.9291 7.12987C16.5522 6.21993 15.9997 5.39314 15.3033 4.6967C14.6069 4.00026 13.7801 3.44781 12.8701 3.0709C11.9602 2.69399 10.9849 2.5 10 2.5C8.01088 2.5 6.10322 3.29018 4.6967 4.6967C3.29018 6.10322 2.5 8.01088 2.5 10C2.5 11.9891 3.29018 13.8968 4.6967 15.3033C6.10322 16.7098 8.01088 17.5 10 17.5ZM9.80667 13.0333L13.9733 8.03333L12.6933 6.96667L9.11 11.2658L7.25583 9.41083L6.0775 10.5892L8.5775 13.0892L9.2225 13.7342L9.80667 13.0333Z" fill="#DFFD7D"/>
							</svg>
                    `
                },
                ["error"]: {
                    name: "nf_error",
                    text: "ERROR",
                    icon: `
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M10 1.66663C5.40001 1.66663 1.66667 5.39996 1.66667 9.99996C1.66667 14.6 5.40001 18.3333 10 18.3333C14.6 18.3333 18.3333 14.6 18.3333 9.99996C18.3333 5.39996 14.6 1.66663 10 1.66663ZM10 10.8333C9.54167 10.8333 9.16667 10.4583 9.16667 9.99996V6.66663C9.16667 6.20829 9.54167 5.83329 10 5.83329C10.4583 5.83329 10.8333 6.20829 10.8333 6.66663V9.99996C10.8333 10.4583 10.4583 10.8333 10 10.8333ZM10.8333 14.1666H9.16667V12.5H10.8333V14.1666Z" fill="#E94346"/>
							</svg>
                    `
                },
                ["info"]: {
                    name: "nf_info",
                    text: "INFO",
                    icon: `
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M9.2 14H10.8V9.2H9.2V14ZM10 7.6C10.2267 7.6 10.4168 7.5232 10.5704 7.3696C10.724 7.216 10.8005 7.02613 10.8 6.8C10.7995 6.57387 10.7227 6.384 10.5696 6.2304C10.4165 6.0768 10.2267 6 10 6C9.77333 6 9.58346 6.0768 9.4304 6.2304C9.27733 6.384 9.20053 6.57387 9.2 6.8C9.19946 7.02613 9.27626 7.21627 9.4304 7.3704C9.58453 7.52453 9.7744 7.60107 10 7.6ZM10 18C8.89333 18 7.85333 17.7899 6.88 17.3696C5.90667 16.9493 5.06 16.3795 4.34 15.66C3.62 14.9405 3.05013 14.0939 2.6304 13.12C2.21067 12.1461 2.00053 11.1061 2 10C1.99947 8.89386 2.2096 7.85387 2.6304 6.88C3.0512 5.90613 3.62107 5.05947 4.34 4.34C5.05893 3.62053 5.9056 3.05067 6.88 2.6304C7.8544 2.21013 8.8944 2 10 2C11.1056 2 12.1456 2.21013 13.12 2.6304C14.0944 3.05067 14.9411 3.62053 15.66 4.34C16.3789 5.05947 16.9491 5.90613 17.3704 6.88C17.7917 7.85387 18.0016 8.89386 18 10C17.9984 11.1061 17.7883 12.1461 17.3696 13.12C16.9509 14.0939 16.3811 14.9405 15.66 15.66C14.9389 16.3795 14.0923 16.9496 13.12 17.3704C12.1477 17.7912 11.1077 18.0011 10 18Z" fill="white"/>
							</svg>	
                    `
                }
            }

            // Lifeinvader uses a separate layout structure
            if (item.type === "lifeinvader") {
                $(".notifys_cont").prepend(`    
                    <div class="notify nf_error nf_lifeinvader clmn show_notify" id="notification-${notificationId}">
                        <div class="head_lf alcn">
                            <img class="lf_logo" src="assets/images/lifeinvader.png" alt="">
                            <div class="row_lf clmn">
                                <span>${item.title}</span>
                                <span>LIFEINVADER</span>
                            </div>
                        </div>
                        <div class="line_nft w100"></div>
                        <span class="text_nf">${item.message}</span>
                        <div class="flex_pnls_lf flex">
                            <div class="pnl_lf alcn">${item.name || 'Anonymous'}</div>
                            <div class="pnl_lf alcn">${item.phone || ''}</div>
                        </div>
                        <div class="novalue w100 flex">
                            <div class="value h100"></div>
                        </div>
                    </div>
                `);
            }
            
            else if (item.type === "dm" || item.type === "private") {
                $(".notifys2_cont").prepend(`    
                    <div class="notify nf_private2 clmn show_notify" id="notification-${notificationId}">
                        <div class="header_notify alcn">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14.36 2.5487C15.0373 2.31203 15.688 2.9627 15.4513 3.64003L11.5013 14.9267C11.2447 15.6587 10.2247 15.7 9.90998 14.9914L8.00398 10.7034L10.6867 8.02003C10.775 7.92525 10.8231 7.79988 10.8208 7.67035C10.8185 7.54081 10.766 7.41722 10.6744 7.32562C10.5828 7.23401 10.4592 7.18153 10.3297 7.17925C10.2001 7.17696 10.0748 7.22504 9.97999 7.31336L7.29665 9.99603L3.00865 8.09003C2.29998 7.7747 2.34198 6.75536 3.07332 6.4987L14.36 2.5487Z" fill="white"/>
                            </svg>
                            <div class="flex_nf_head alcn">
                                <span>PRIVATE</span>
                                <div class="type_nf jlcn">DM</div>
                            </div>								
                        </div>
                        <div class="author_dm jlcn">${item.name || item.title || 'Unknown'}</div>
                        <div class="line_nft w100"></div>
                        <span class="text_nf">${item.message}</span>
                        <div class="novalue w100 flex">
                            <div class="value h100"></div>
                        </div>
                    </div>
                `);
            }
            else if (item.type === "item") {
                const isPositive = item.amount > 0;
                const amountText = (isPositive ? "+" : "") + item.amount;
                const amountClass = isPositive ? "ammount_plus" : "ammount_minus";
                
                $(".notifys2_cont").prepend(`    
                    <div class="notify nf_info nf_item clmn show_notify" id="notification-${notificationId}">
                        <div class="header_notify alcn">
							<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M3 15.6667V3H15V15.6667L13 14.3333L11 15.6667L9 14.3333L7 15.6667L5 14.3333L3 15.6667ZM12.3333 7V5.66667H11V7H12.3333ZM9.66667 7V5.66667H5.66667V7H9.66667ZM9.66667 8.33333H5.66667V9.66667H9.66667V8.33333ZM11 9.66667H12.3333V8.33333H11V9.66667Z" fill="#BDFF94"/>
							</svg>								
                            <div class="flex_nf_head alcn">
                                <span>NOTIFY</span>
                                <div class="type_nf jlcn">ITEM</div>
                            </div>								
                        </div>
                        <div class="pannel_item alcn">
                            <img src="${item.image || 'assets/images/item.png'}" alt="">
                            <div class="row_item clmn">
                                <span>Item name:</span>
                                <span>${item.itemName || item.title || 'Unknown'}</span>
                            </div>
                            <div class="${amountClass} jlcn">${amountText}</div>
                        </div>
                        <div class="novalue w100 flex">
                            <div class="value h100"></div>
                        </div>
                    </div>
                `);
            }
            else {
                const notifyClass = classes[item.type] || classes["info"];
                const notifyLabel = item.label || notifyClass.text || "NOTIFY";
                $(".notifys_cont").prepend(`    
                    <div class="notify clmn ${notifyClass.name} flex show_notify" id="notification-${notificationId}">
                        <div class="header_notify alcn">
                            ${notifyClass.icon}	
                            <div class="flex_nf_head alcn">
                                <span>${item.title}</span>
                                <div class="type_nf jlcn">${notifyLabel}</div>
                            </div>								
                        </div>
                        <div class="line_nft w100"></div>
                        <span class="text_nf">${item.message}</span>
                        <div class="novalue w100 flex">
                            <div class="value h100"></div>
                        </div>
                    </div>
                `);
            }
        
            var element = $(`#notification-${notificationId}`)
        
            element.find(".value").animate({width: "100%"}, {
                duration: item.timeout,
                easing: "linear",
                step: function(now) {
                    let progress = Math.round(now);
        
                    if (progress >= 100) {
                        setTimeout(() => {     
                            element.removeClass('show_notify').addClass('hide_notify');
                        }, 150);
                
                        setTimeout(() => {
                            element.remove()
                        }, 600); 
                    }
                }
            });
        
            notificationId++;

        break;
        case "Announcement":
            if (item.title && item.text) {
                const announceId = "announce-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
                const title = item.title || "TEXT ANNOUNCEMENT";
                const text = item.text;
                const timeout = item.timeout || 5000;
                const announceType = item.type || "default";
                
                const announceIcons = {
                    default: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M13.506 2.24025C14.505 1.66875 15.75 2.39025 15.75 3.54225V12.9577C15.75 14.109 14.5057 14.8312 13.506 14.2597L10.5 12.5422V3.95775L13.506 2.24025ZM8.99999 4.5H5.24999C4.32003 4.49906 3.42289 4.84371 2.73274 5.46703C2.04259 6.09035 1.60867 6.94787 1.51521 7.87313C1.42175 8.79838 1.67542 9.72536 2.22698 10.4741C2.77854 11.2228 3.58863 11.7399 4.49999 11.925V14.625C4.49999 15.1223 4.69754 15.5992 5.04917 15.9508C5.4008 16.3025 5.87771 16.5 6.37499 16.5C6.87227 16.5 7.34919 16.3025 7.70082 15.9508C8.05245 15.5992 8.24999 15.1223 8.24999 14.625V12H8.99999V4.5Z" fill="white"/>
                    </svg>`,
                    restart: `						<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M7.49996 2.25H10.5C10.9125 2.25 11.25 1.9125 11.25 1.5C11.25 1.0875 10.9125 0.75 10.5 0.75H7.49996C7.08746 0.75 6.74996 1.0875 6.74996 1.5C6.74996 1.9125 7.08746 2.25 7.49996 2.25ZM14.2725 5.5425L14.835 4.98C14.9736 4.84047 15.0515 4.65173 15.0515 4.455C15.0515 4.25827 14.9736 4.06953 14.835 3.93L14.8275 3.9225C14.6879 3.78382 14.4992 3.70598 14.3025 3.70598C14.1057 3.70598 13.917 3.78382 13.7775 3.9225L13.215 4.485C12.0205 3.52364 10.5332 2.99965 8.99996 3C5.39996 3 2.33996 5.97 2.24996 9.57C2.22591 10.4715 2.38274 11.3686 2.71117 12.2084C3.03961 13.0483 3.533 13.8138 4.1622 14.4598C4.79141 15.1057 5.54368 15.6191 6.37458 15.9695C7.20549 16.3199 8.09818 16.5003 8.99996 16.5C10.2707 16.5007 11.5158 16.1424 12.5918 15.4665C13.6678 14.7905 14.5311 13.8244 15.082 12.6793C15.633 11.5342 15.8493 10.2568 15.7061 8.99419C15.5629 7.73156 15.0659 6.53506 14.2725 5.5425ZM9.74996 9.75C9.74996 10.1625 9.41246 10.5 8.99996 10.5C8.58746 10.5 8.24996 10.1625 8.24996 9.75V6.75C8.24996 6.3375 8.58746 6 8.99996 6C9.41246 6 9.74996 6.3375 9.74996 6.75V9.75Z" fill="#F6A452"/>
						</svg>`,
                    event: `						<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M5.24994 3.75H17.2499V6.75H16.4999V7.5H11.9999C11.801 7.5 11.6103 7.57902 11.4696 7.71967C11.329 7.86032 11.2499 8.05109 11.2499 8.25V9C11.2499 9.39782 11.0919 9.77936 10.8106 10.0607C10.5293 10.342 10.1478 10.5 9.74994 10.5H7.21494C6.92994 10.5 6.66744 10.665 6.53994 10.92L4.70244 14.5875C4.57494 14.8425 4.31994 15 4.03494 15H1.49994C1.49994 15 -0.750059 15 2.24994 10.5C2.24994 10.5 4.49994 7.5 1.49994 7.5V3.75H2.24994L2.62494 3H4.87494L5.24994 3.75ZM10.4999 9V8.25C10.4999 8.05109 10.4209 7.86032 10.2803 7.71967C10.1396 7.57902 9.94885 7.5 9.74994 7.5H8.99994C8.99994 7.5 8.24994 8.25 8.99994 9C8.60212 9 8.22059 8.84196 7.93928 8.56066C7.65798 8.27936 7.49994 7.89782 7.49994 7.5C7.30103 7.5 7.11026 7.57902 6.96961 7.71967C6.82896 7.86032 6.74994 8.05109 6.74994 8.25V9C6.74994 9.19891 6.82896 9.38968 6.96961 9.53033C7.11026 9.67098 7.30103 9.75 7.49994 9.75H9.74994C9.94885 9.75 10.1396 9.67098 10.2803 9.53033C10.4209 9.38968 10.4999 9.19891 10.4999 9Z" fill="#F65252"/>
						</svg>`,
                    gangwar: `						<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M5.86412 5.39999C6.85693 5.39999 7.66412 4.59281 7.66412 3.59999C7.66412 2.60718 6.85693 1.79999 5.86412 1.79999C4.87131 1.79999 4.06412 2.60718 4.06412 3.59999C4.06412 4.59281 4.87131 5.39999 5.86412 5.39999ZM5.41412 15.3V12.6H6.31412V15.3C6.31412 15.7978 6.71631 16.2 7.21412 16.2C7.71193 16.2 8.11412 15.7978 8.11412 15.3V9.89437L8.70193 10.8281C8.96631 11.25 9.52318 11.3737 9.94224 11.1094C10.3613 10.845 10.4879 10.2881 10.2235 9.86905L9.10131 8.08874C8.40381 6.97499 7.18037 6.29999 5.86412 6.29999C4.54787 6.29999 3.32443 6.97499 2.62412 8.08874L1.50193 9.87187C1.23756 10.2937 1.36412 10.8478 1.78318 11.1122C2.20224 11.3766 2.75912 11.25 3.02349 10.8309L3.61131 9.89718V15.3028C3.61131 15.8006 4.01349 16.2028 4.51131 16.2028C5.00912 16.2028 5.41131 15.8006 5.41131 15.3028L5.41412 15.3ZM13.5141 1.79999H12.6141C12.3666 1.79999 12.1641 2.00249 12.1641 2.24999C12.1641 2.49749 12.3666 2.69999 12.6141 2.69999V5.52093C12.3441 5.67562 12.1641 5.96812 12.1641 6.29999V7.19999C11.6663 7.19999 11.2641 7.60218 11.2641 8.09999V12.15C11.2641 12.6478 11.6663 13.05 12.1641 13.05H12.6141V15.75C12.6141 15.9975 12.8166 16.2 13.0641 16.2H14.7376C15.0301 16.2 15.2438 15.9244 15.1735 15.6403L14.5266 13.05H15.7641C16.0116 13.05 16.2141 12.8475 16.2141 12.6V12.15C16.2141 11.9025 16.0116 11.7 15.7641 11.7H14.4141V10.9491L15.9076 10.4512C16.0904 10.3894 16.2141 10.2178 16.2141 10.0237V7.64718C16.2141 7.39968 16.0116 7.19718 15.7641 7.19718H15.3141C15.0666 7.19718 14.8641 7.39968 14.8641 7.64718V9.22218L14.4141 9.37124V6.29718C14.4141 5.96531 14.2341 5.6728 13.9641 5.51812V2.24718C13.9641 1.99968 13.7616 1.79718 13.5141 1.79718V1.79999Z" fill="#F6E052"/>
						</svg>`
                };
                
                const announceClasses = {
                    default: "",
                    restart: "nf_restart",
                    event: "nf_event",
                    gangwar: "nf_gangwar"
                };
                
                const icon = announceIcons[announceType] || announceIcons.default;
                const typeClass = announceClasses[announceType] || "";
                
                const announceHtml = `
                    <div class="notify nf_info nf_announcement ${typeClass} show_announcement clmn" id="${announceId}">
                        <div class="header_notify alcn jlcn">
                            ${icon}																					
                            <div class="flex_nf_head alcn">
                                <span>${title}</span>
                            </div>								
                        </div>
                        <div class="line_nft w100"></div>
                        <span class="text_nf">${text}</span>
                        <div class="novalue w100 flex">
                            <div class="value h100"></div>
                        </div>
                    </div>
                `;
                
                const $announce = $(announceHtml);
                $(".announces_cont").prepend($announce);
                $announce.hide().fadeIn();
                
                $announce.find(".value").css("width", "0%").animate({width: "100%"}, {
                    duration: timeout,
                    easing: "linear",
                    complete: function() {
                        setTimeout(() => {
                            $announce.fadeOut(300, function() {
                                $(this).remove();
                            });
                        }, 150);
                    }
                });
            }
        break;
        case "UpdateStatus":
            if (item.type === "hunger") {
                const foodLinesDivs = document.querySelectorAll('.fw_cont:not(.second_fw) .food_sect .line_fw');
                if (foodLinesDivs.length > 0) {
                    const foodActive1 = Math.ceil(item.status / 20);
                    foodLinesDivs.forEach((line, i) => {
                        if (i < foodActive1) {
                            line.classList.add('active_fw');
                        } else {
                            line.classList.remove('active_fw');
                        }
                    });
                }
                
                const foodLinesSvg = document.querySelectorAll('.second_fw .food_sect .lines_fw svg');
                if (foodLinesSvg.length > 0) {
                    const foodActive2 = Math.ceil(item.status / (100 / foodLinesSvg.length));
                    foodLinesSvg.forEach((svg, i) => {
                        if (i < foodActive2) {
                            svg.classList.add('active_fw');
                        } else {
                            svg.classList.remove('active_fw');
                        }
                    });
                }
                
                document.querySelectorAll('.food_sect .wh_fw').forEach(el => {
                    el.innerHTML = Math.round(item.status) + '<span class="gr_fw">%</span>';
                });
                
            } else if (item.type === "thirst") {
                const waterLinesDivs = document.querySelectorAll('.fw_cont:not(.second_fw) .water_sect .line_fw');
                if (waterLinesDivs.length > 0) {
                    const waterActive1 = Math.ceil(item.status / 20);
                    waterLinesDivs.forEach((line, i) => {
                        if (i < waterActive1) {
                            line.classList.add('active_fw');
                        } else {
                            line.classList.remove('active_fw');
                        }
                    });
                }
                
                const waterLinesSvg = document.querySelectorAll('.second_fw .water_sect .lines_fw svg');
                if (waterLinesSvg.length > 0) {
                    const waterActive2 = Math.ceil(item.status / (100 / waterLinesSvg.length));
                    waterLinesSvg.forEach((svg, i) => {
                        if (i < waterActive2) {
                            svg.classList.add('active_fw');
                        } else {
                            svg.classList.remove('active_fw');
                        }
                    });
                }
                
                document.querySelectorAll('.water_sect .wh_fw').forEach(el => {
                    el.innerHTML = Math.round(item.status) + '<span class="gr_fw">%</span>';
                });
            }
        break;
        case "HelpNotify":
            helpNotifyActive = !!(item.key && item.text);
            if (helpNotifyActive) {
                $("#helpnotify_wrap .helpnotify_key").text(item.key);
                $("#helpnotify_wrap .helpnotify_text").text(item.text);
            }
            if (!currentSettings.help_notify) {
                $("#helpnotify_wrap").stop(true, true).fadeOut(0);
                break;
            }
            if (helpNotifyActive) {
                $("#helpnotify_wrap").stop(true, true).css("display", "flex").fadeIn(150);
            } else {
                $("#helpnotify_wrap").stop(true, true).fadeOut(150);
            }
        break;
        case "SetHelpAboveProgressbar":
            $("#helpnotify_wrap").toggleClass('above_progressbar', item.active === true);
        break;
case "Progressbar": {
    // Stop / Reset helper
    const stopProgress = () => {
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
        if (progressHideTimeout) {
            clearTimeout(progressHideTimeout);
            progressHideTimeout = null;
        }

        $(".load_section").stop(true, true).fadeOut();
        $(".load_section .line_prog").removeClass('active_prog');
        $(".load_section .proc_box").text("0%");
        $(".load_section .ld_tx").text("");
        $("#helpnotify_wrap").removeClass('above_progressbar');
    };

    // Wenn Stop angefordert oder keine duration/text -> ausblenden
    if (item.stop === true || !item.duration || !item.text) {
        stopProgress();
        break;
    }

    // Wenn schon eine läuft -> erst killen
    stopProgress();

    $(".load_section .ld_tx").text(item.text);
    $(".load_section .proc_box").text("0%");
    $(".load_section .line_prog").removeClass('active_prog');

    $(".load_section").stop(true, true).fadeIn();
    $("#helpnotify_wrap").addClass('above_progressbar');

    const $lines = $(".load_section .line_prog");
    const totalLines = $lines.length;

    const duration = Number(item.duration) || 0;
    if (duration <= 0) {
        stopProgress();
        break;
    }

    let currentPercent = 0;

    progressInterval = setInterval(function () {
        currentPercent += (100 / (duration / 50));

        if (currentPercent >= 100) {
            currentPercent = 100;
            clearInterval(progressInterval);
            progressInterval = null;
        }

        const percent = Math.round(currentPercent);
        const activeLines = Math.ceil((percent / 100) * totalLines);

        $(".load_section .proc_box").text(percent + "%");

        $lines.each(function (index) {
            $(this).toggleClass('active_prog', index < activeLines);
        });

        if (currentPercent >= 100) {
            progressHideTimeout = setTimeout(() => {
                $(".load_section").fadeOut();
                $(".load_section .line_prog").removeClass('active_prog');
                $("#helpnotify_wrap").removeClass('above_progressbar');
                progressHideTimeout = null;
            }, 300);
        }
    }, 50);

    break;
}
        case "SetRadio": {
            const radioOn = item.state === true || item.state === 1;
            if (radioOn) {
                $("#radio").addClass("talked");
            } else {
                $("#radio").removeClass("talked");
            }
            
            if (item.players && Array.isArray(item.players)) {
                let html = "";
                item.players.forEach(player => {
                    html += `
                        <div class="wrapper_radio_pnl alcn${player.speaking ? ' active_pannel' : ''}" data-player-id="${player.id}">
                            <div class="nm_radio alcn">
                                <div class="id jlcn">${player.id}</div>
                                <span class="name_radio">${player.name}</span>
                            </div>
                            <div class="dot_rad"></div>
                        </div>`;
                });
                $(".radio_cont .list_radio").html(html);
                
                let oldHtml = "";
                item.players.forEach(player => {
                    oldHtml += `
                    <div class="pannel_funk alcn${player.speaking ? ' active_funk' : ''}">
                        <div class="l_fnk alcn">
                            <span>[${player.id}]</span>
                            <span>${player.name}</span>
                        </div>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M5.9913 0.193013L5.77778 0.386026V6.5V12.614L5.9913 12.807C6.17356 12.9717 6.24804 13 6.5 13C6.75196 13 6.82645 12.9717 7.0087 12.807L7.22222 12.614V6.5V0.386026L7.0087 0.193013C6.82645 0.0282708 6.75196 0 6.5 0C6.24804 0 6.17356 0.0282708 5.9913 0.193013ZM3.25082 2.01897C2.87727 2.20222 2.88889 2.05803 2.88889 6.5C2.88889 10.9602 2.8757 10.8024 3.26363 10.9838C3.49681 11.0927 3.72453 11.0931 3.95583 10.9851C4.35487 10.7985 4.33333 11.0546 4.33333 6.5C4.33333 1.9454 4.35487 2.20148 3.95583 2.01494C3.72817 1.90856 3.47301 1.91004 3.25082 2.01897ZM9.0004 2.04083C8.8903 2.10152 8.77023 2.20188 8.73349 2.26399C8.68802 2.34074 8.66667 3.69842 8.66667 6.51204C8.66667 11.0534 8.64513 10.7985 9.04417 10.9851C9.40201 11.1523 9.84044 11.0377 10.0158 10.7311C10.1595 10.48 10.1595 2.51996 10.0158 2.26887C9.83064 1.94517 9.36408 1.84038 9.0004 2.04083ZM0.465865 3.91527C0.394019 3.94155 0.259749 4.04408 0.167556 4.14308L0 4.3231V6.50517V8.68724L0.204169 8.88859C0.594546 9.27365 1.24178 9.165 1.42523 8.6836C1.53042 8.40754 1.53042 4.59246 1.42523 4.3164C1.2941 3.97232 0.834889 3.78033 0.465865 3.91527ZM11.8696 3.9851C11.7424 4.06293 11.6182 4.20258 11.5748 4.3164C11.4696 4.59246 11.4696 8.40754 11.5748 8.6836C11.659 8.9046 11.9954 9.13974 12.2274 9.13974C12.4341 9.13974 12.7114 9.00196 12.8689 8.82098C12.9967 8.67412 13 8.61503 13 6.49149V4.31276L12.7958 4.11141C12.5205 3.83977 12.1822 3.79367 11.8696 3.9851Z" fill="white" fill-opacity="0.25"/>
                        </svg>							
                    </div>`;
                });
                if ($(".row_pannels").length > 0) {
                    $(".row_pannels").html(oldHtml);
                }
            }
            
            checkFunkWrapper();
            
            if (typeof item.channel !== 'undefined') {
                $("#mhz_channel").text(item.channel);
            }
        }
        break;
        case "SetRadioTransmission":
            if (item.state) {
                $("#radio").addClass("transmitting");
            } else {
                $("#radio").removeClass("transmitting");
            }
        break;
        case "SetSpeedo":
            isSpeedoActive = item.state; 
            if (item.state) {
                const activeSpeedoClass = currentSpeedoVariant === 1 ? '.speedo_wrap' : '.speedo_second';
                
                const activeSpeedoElem = $(activeSpeedoClass);
                
                if (currentSettings.speedometer && !activeSpeedoElem.is(":visible")) {
                    activeSpeedoElem.stop(true, true).css('display', 'flex').hide().fadeIn();
                } else if (!currentSettings.speedometer) {
                    $(".speedo_wrap, .speedo_second").hide();
                }
                if (item.data) {
                    const speed = item.data.speed;
                    const texts = cachedElements.speedoTexts;
                    
                    if (currentSpeedoVariant === 1) {
                        $(".speedo_wrap .row_speed span:last").text(speed);
                    }
                    
                    if (currentSpeedoVariant === 2) {
                        $(".speedo_second .left_spcsc span:first").text(speed);
                        
                        if (texts.grTxSp && texts.grTxSp.length) {
                            if (speed < 100) {
                                const speedStr = speed.toString().padStart(3, '0');
                                const grayPart = speedStr.substring(0, 1); 
                                const whitePart = speedStr.substring(1);   
                                texts.grTxSp.html(grayPart + '<span class="wh_tx_sp">' + whitePart + '</span>');
                            } else {
                                texts.grTxSp.html('<span class="wh_tx_sp">' + speed + '</span>');
                            }
                        }
                    }
                    
                    const fuelPercent = Math.min(Math.max(item.data.fuel, 0), 100);
                    const fuelText = item.data.fuel;
                    
                    if (texts.flWh) texts.flWh.html(fuelText + '<span class="fl_gr">L</span>');
                    if (texts.whFuel) texts.whFuel.html(fuelText + '<span class="gr_fuel">L</span>');
                    if (texts.valueFuel) texts.valueFuel.css("width", fuelPercent + "%");

                    if (item.data.odometer !== undefined) {
                        const odoStr = Math.floor(item.data.odometer).toLocaleString('de-DE');
                        if (texts.odoWrap) texts.odoWrap.text(odoStr);
                        if (texts.odoSec)  texts.odoSec.text(odoStr);
                    }

                    const gear = item.data.gear;
                    const currentGear = gear === 0 ? 'R' : gear === -1 ? 'N' : gear;

                    let prevGear, nextGear;
                    if (gear === -1) { 
                        prevGear = 'R';
                        nextGear = '1';
                    } else if (gear === 0) { 
                        prevGear = '';
                        nextGear = 'N';
                    } else { 
                        prevGear = gear - 1 === 0 ? 'N' : (gear - 1);
                        nextGear = gear + 1;
                    }
                    
                    const $gearBoxes = $(".flex_gears .gear_box");
                    const $activeGear = $gearBoxes.eq(1); 
                    
                    $gearBoxes.eq(0).find('span').text(prevGear); 
                    $gearBoxes.eq(2).find('span').text(nextGear); 
                    
                    if ($activeGear.find('span').text() !== currentGear.toString()) {
                        $activeGear.removeClass('active_gear');
                        
                        setTimeout(() => {
                            $activeGear.addClass('active_gear');
                            $activeGear.find('span').text(currentGear);
                        }, 10);
                    } else {
                        $activeGear.find('span').text(currentGear);
                    }
                    
                   
                    if (currentSpeedoVariant === 1 && cachedElements.speedoIcons && cachedElements.speedoIcons.wrap) {
                        if (cachedElements.lastSpeedoStates.engine !== item.data.engine) {
                            cachedElements.speedoIcons.wrap.engine.toggleClass("active_sp", item.data.engine);
                            cachedElements.lastSpeedoStates.engine = item.data.engine;
                        }
                        if (cachedElements.lastSpeedoStates.lock !== item.data.key) {
                            cachedElements.speedoIcons.wrap.lock.toggleClass("active_sp", item.data.key);
                            cachedElements.lastSpeedoStates.lock = item.data.key;
                        }
                        if (cachedElements.lastSpeedoStates.light !== item.data.lights) {
                            cachedElements.speedoIcons.wrap.light.toggleClass("active_sp", item.data.lights);
                            cachedElements.lastSpeedoStates.light = item.data.lights;
                        }
                        if (cachedElements.lastSpeedoStates.seatbelt !== item.data.seatbelt) {
                            cachedElements.speedoIcons.wrap.seatbelt.toggleClass("active_sp", item.data.seatbelt);
                            cachedElements.lastSpeedoStates.seatbelt = item.data.seatbelt;
                        }
                    }
                    
                    
                    if (cachedElements.speedoIcons && currentSpeedoVariant === 2) {
                        if (cachedElements.lastSpeedoStates.engine !== item.data.engine) {
                            cachedElements.speedoIcons.engine.toggleClass("active_sp", item.data.engine);
                            cachedElements.lastSpeedoStates.engine = item.data.engine;
                        }
                        if (cachedElements.lastSpeedoStates.lock !== item.data.key) {
                            cachedElements.speedoIcons.lock.toggleClass("active_sp", item.data.key);
                            cachedElements.lastSpeedoStates.lock = item.data.key;
                        }
                        if (cachedElements.lastSpeedoStates.light !== item.data.lights) {
                            cachedElements.speedoIcons.light.toggleClass("active_sp", item.data.lights);
                            cachedElements.lastSpeedoStates.light = item.data.lights;
                        }
                        if (cachedElements.lastSpeedoStates.seatbelt !== item.data.seatbelt) {
                            cachedElements.speedoIcons.seatbelt.toggleClass("active_sp", item.data.seatbelt);
                            cachedElements.lastSpeedoStates.seatbelt = item.data.seatbelt;
                        }
                    }
                    
                    const rpmPercent = Math.min(item.data.rpm, 100);
                    const realRpm = item.data.rpm; 
                    if (texts.valueRpm) texts.valueRpm.css("width", rpmPercent + "%");
                    
                    if (currentSpeedoVariant === 2) {
                        const $speedLines = $(".speedo_second .lines_sp .nv_sp");
                        const totalLines = $speedLines.length; 
                        const maxSpeed = item.data.maxSpeed || 300; 
                        const speedPercent = Math.min((speed / maxSpeed) * 100, 100);
                        const activeLines = Math.ceil((speedPercent / 100) * totalLines);
                        
                        $speedLines.each(function(index) {
                            const $line = $(this);
                            const shouldBeActive = index < activeLines;
                            
                            if (shouldBeActive) {
                                $line.addClass('active_sp_ln');
                            } else {
                                $line.removeClass('active_sp_ln');
                            }
                        });
                        
                        $(".speedo_second .vl_fuel").css("width", fuelPercent + "%");
                    }
                    
                    if (currentSpeedoVariant === 1) {
                        const speedPercent = Math.min((speed / item.data.maxSpeed) * 100, 100);
                        
                        const circleProgress = document.getElementById('circle-progress');
                        if (circleProgress) {
                            const minOffset = 239.359;
                            const maxOffset = 697.433;
                            const offsetRange = maxOffset - minOffset;
                            
                            let progressPercent = 0;
                            if (rpmPercent <= 70) {
                                progressPercent = (rpmPercent / 70) * 100;
                            } else {
                                progressPercent = 100;
                            }
                            
                            let offset = minOffset + (offsetRange - (progressPercent / 100) * offsetRange);
                            circleProgress.style.strokeDashoffset = offset;
                        }
                        
                        const circleMax = document.getElementById('circle-progress-maximum');
                        if (circleMax) {
                            const minOffset = 581.171;
                            const maxOffset = 697.433;
                            const offsetRange = maxOffset - minOffset;
                            
                            let maxPercent = 0;
                            if (rpmPercent > 70) {
                                
                                maxPercent = ((rpmPercent - 70) / 30) * 100;
                            }
                            
                            let offset = minOffset + (offsetRange - (maxPercent / 100) * offsetRange);
                            circleMax.style.strokeDashoffset = offset;
                        }
                        
                        const circleFuel = document.getElementById('circle-progress-fuel');
                        if (circleFuel) {
                            const minOffset = 116.262;
                            const maxOffset = 697.433;
                            const offsetRange = maxOffset - minOffset;
                            let offset = minOffset + (offsetRange - (fuelPercent / 100) * offsetRange);
                            circleFuel.style.strokeDashoffset = offset;
                        }
                    }
                    
                    const speedPercent = Math.min((speed / item.data.maxSpeed) * 100, 100);
                    if (texts.valueSp) texts.valueSp.css("width", speedPercent + "%");
                    if (texts.speedProgress) texts.speedProgress.css("width", speedPercent + "%");
                    
                    const maxSpeedForDisplay = Math.max(item.data.maxSpeed, 100); 
                    const speedRatio = Math.min(speed / maxSpeedForDisplay, 1);
                    const arrowRotation = speedRatio * 270;
                    if (texts.arrowSp) texts.arrowSp.css("transform", `rotate(${arrowRotation}deg)`);
                }
            } else {
                if (cachedElements.speedoTexts && cachedElements.speedoTexts.arrowSp) {
                    cachedElements.speedoTexts.arrowSp.css("transform", "rotate(0deg)");
                }
                
                $(".speedo_wrap").stop(true, true).hide();
                $(".speedo_second").stop(true, true).hide();
                
                $(".speedo_second .lines_sp .nv_sp").removeClass('active_sp_ln');
                
                $(".speedo_second .vl_fuel").css("width", "0%");
                
                cachedElements.lastSpeedoStates = {
                    engine: null,
                    lock: null,
                    light: null,
                    seatbelt: null
                };
            }
        break;
        case "SetZone":
            if (item.type === "safezone") {
                if (zoneTimeouts["safezone"]) {
                    clearTimeout(zoneTimeouts["safezone"]);
                    zoneTimeouts["safezone"] = null;
                }
                
                if (item.state) {
                    $(".pannel_zone:not(.red_zone)").fadeIn();
                    if (item.name) {
                        $(".pannel_zone:not(.red_zone) .row_zone span:first").text(item.name);
                    }
                    if (item.location) {
                        $(".pannel_zone:not(.red_zone) .row_zone span:last").text(item.location);
                    }
                    
                    zoneTimeouts["safezone"] = setTimeout(() => {
                        $.post(`https://${GetParentResourceName()}/triggerZone`, JSON.stringify({
                            type: "safezone",
                            state: false
                        }));
                    }, 150);
                } else {
                    $(".pannel_zone:not(.red_zone)").fadeOut();
                }
            } else if (item.type === "restricted") {
                if (zoneTimeouts["restricted"]) {
                    clearTimeout(zoneTimeouts["restricted"]);
                    zoneTimeouts["restricted"] = null;
                }
                
                if (item.state) {
                    $(".pannel_zone.red_zone").fadeIn();
                    if (item.name) {
                        $(".pannel_zone.red_zone .row_zone span:first").text(item.name);
                    }
                    if (item.location) {
                        $(".pannel_zone.red_zone .row_zone span:last").text(item.location);
                    }
                    
                    zoneTimeouts["restricted"] = setTimeout(() => {
                        $.post(`https://${GetParentResourceName()}/triggerZone`, JSON.stringify({
                            type: "restricted",
                            state: false
                        }));
                    }, 150);
                } else {
                    $(".pannel_zone.red_zone").fadeOut();
                }
            }
        break;
        case "SetMuted":
            if (mutedTimeout) {
                clearTimeout(mutedTimeout);
                mutedTimeout = null;
            }
            
            if (item.state) {
                $(".muted_cont").fadeIn();
                
                mutedTimeout = setTimeout(() => {
                    $.post(`https://${GetParentResourceName()}/triggerMuted`, JSON.stringify({
                        state: false
                    }));
                }, 150);
            } else {
                $(".muted_cont").fadeOut();
            }
        break;
        case "SetHelpSection":
            if (helpSectionTimeout) {
                clearTimeout(helpSectionTimeout);
                helpSectionTimeout = null;
            }
            
            if (item.state) {
                if (item.key) {
                    $(".e_section .e_box span").text(item.key);
                }
                if (item.text) {
                    $(".e_section .e_text").text(item.text);
                }
                $(".e_section").fadeIn();
                
                helpSectionTimeout = setTimeout(() => {
                    $.post(`https://${GetParentResourceName()}/triggerHelpSection`, JSON.stringify({
                        state: false
                    }));
                }, 150);
            } else {
                $(".e_section").fadeOut();
            }
        break;
        case "SetLoadSection":
            if (item.state) {
                if (item.text) {
                    $(".load_section .ld_tx").text(item.text);
                }
                if (item.percent !== undefined) {
                    $(".load_section .proc_box").text(Math.round(item.percent) + "%");
                    const $lines = $(".load_section .line_prog");
                    const totalLines = $lines.length;
                    const activeLines = Math.ceil((item.percent / 100) * totalLines);
                    
                    $lines.each(function(index) {
                        if (index < activeLines) {
                            $(this).addClass('active_prog');
                        } else {
                            $(this).removeClass('active_prog');
                        }
                    });
                }
                $(".load_section").fadeIn();
            } else {
                $(".load_section").fadeOut();
                $(".load_section .line_prog").removeClass('active_prog');
                $(".load_section .proc_box").text("0%");
            }
        break;
        case "SetRobbery":
    // Texte updaten immer, wenn vorhanden
    if (item.title !== undefined) {
        $(".robbery_sect .row_im span:first").text(item.title);
    }
    if (item.time !== undefined) {
        $(".robbery_sect .row_im span:last").text(item.time);
    }

    // Sichtbarkeit NUR ändern, wenn state wirklich mitgeschickt wurde
    if (typeof item.state !== "undefined") {
        if (item.state === true) {
            $(".robbery_sect").fadeIn();
        } else {
            $(".robbery_sect").fadeOut();
        }
    }

    // WICHTIG: diesen Auto-Post entfernen, sonst macht es sich selbst direkt aus
    // if (robberyTimeout) clearTimeout(robberyTimeout);
    // robberyTimeout = setTimeout(() => { ... }, 150);
break;
        case "SetFarmingBoost":
            if (item.state) {
                if (item.time) {
                    $(".farming_box .time_fb span").text(item.time);
                }
                $(".farming_box").fadeIn();
            } else {
                $(".farming_box").fadeOut();
            }
        break;

case "SetStatusTop":
    if (item.status !== undefined) {
        $(".status_top .flex_st span:first").text(item.status);
    }
    if (item.statusType !== undefined) {
        $(".status_top .flex_st span:last").text(item.statusType);
    }
    if (item.time !== undefined) {
        $(".status_top .time_status").text(item.time);
    }

    if (typeof item.state !== "undefined") {
        if (item.state === true) {
            $(".status_top").fadeIn();
        } else {
            $(".status_top").fadeOut();
        }
    }

    // WICHTIG: entfernen
    // if (statusTopTimeout) clearTimeout(statusTopTimeout);
    // statusTopTimeout = setTimeout(() => { ... }, 150);
break;

case "SetEinreise": {
    const $wrap = $("#einreise").closest(".inf_wrapper");

    if (item.players !== undefined && item.staff !== undefined) {
        const pl = Math.max(0, Number(item.players) || 0);
        const st = Math.max(0, Number(item.staff) || 0);
        const hideEmpty = item.hideWhenEmpty === true;
        if (hideEmpty && pl === 0 && st === 0) {
            $wrap.hide();
            $("#einreise").text("");
            break;
        }
        $wrap.show();
        $("#einreise").text("Einreise: " + pl + " · Team: " + st);
        break;
    }

    if (item.value === false || item.value === null || item.value === "" || (item.value === undefined && !item.text)) {
        $wrap.hide();
        $("#einreise").text("");
        break;
    }

    $wrap.show();

    if (item.value !== undefined) {
        $("#einreise").text("Einreise: " + item.value);
    } else if (item.text) {
        $("#einreise").text(item.text);
    }
    break;
}
        case "Killfeed":
            if (item.killerName && item.victimName) {
                const escapeKillfeed = (value) => $("<div>").text(String(value ?? "")).html();
                const killfeedId = "killfeed-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
                const status = escapeKillfeed(item.status || "DEAD");
                const killerName = escapeKillfeed(item.killerName);
                const victimName = escapeKillfeed(item.victimName);
                const killerId = item.killerId !== undefined && item.killerId !== null && item.killerId !== '' ? escapeKillfeed(item.killerId) : null;
                const victimId = item.victimId !== undefined && item.victimId !== null && item.victimId !== '' ? escapeKillfeed(item.victimId) : null;
                const distance = item.distance !== undefined && item.distance !== null && item.distance !== '' ? escapeKillfeed(item.distance) + " M" : null;
                const timeout = item.timeout || 5000;
                
                const killfeedHtml = `
                    <div class="pannel_kill alcn" id="${killfeedId}">
						<svg class="skull_bg" width="45" height="39" viewBox="0 0 45 39" fill="none" xmlns="http://www.w3.org/2000/svg">
							<g clip-path="url(#clip0_10_571)">
							<path d="M22.3913 -9.38449C9.96081 -10.2274 -0.838216 -0.799845 -1.68109 11.6307L-2.81896 28.4117L5.82737 32.5704L7.03691 41.8377L11.9272 42.1693L12.3975 35.2327L15.8658 35.4679L15.3954 42.4045L17.1296 42.522L17.5999 35.5855L21.0682 35.8207L20.5979 42.7572L22.332 42.8748L22.8023 35.9382L26.2706 36.1734L25.8003 43.11L30.6905 43.4416L33.14 34.4224L42.2686 31.4689L43.4065 14.6879C44.2494 2.25741 34.8218 -8.54162 22.3913 -9.38449ZM10.5018 24.6515C9.3014 24.5701 8.15207 24.1346 7.19917 23.4C6.24627 22.6654 5.53261 21.6647 5.14842 20.5245C4.76424 19.3843 4.72679 18.1558 5.04082 16.9943C5.35484 15.8328 6.00624 14.7905 6.91263 13.9993C7.81902 13.208 8.93969 12.7033 10.1329 12.5489C11.3262 12.3945 12.5384 12.5975 13.6163 13.1321C14.6942 13.6667 15.5894 14.5089 16.1886 15.5522C16.7879 16.5956 17.0643 17.7932 16.9829 18.9936C16.872 20.6027 16.1274 22.1021 14.9124 23.1628C13.6973 24.2235 12.1111 24.7589 10.5018 24.6515ZM15.6143 31.9666L18.8566 23.4759L21.4578 23.6523L23.5242 32.503L15.6143 31.9666ZM29.5773 25.945C28.3769 25.8636 27.2276 25.428 26.2747 24.6934C25.3218 23.9588 24.6081 22.9582 24.2239 21.818C23.8397 20.6778 23.8023 19.4492 24.1163 18.2878C24.4304 17.1263 25.0817 16.084 25.9881 15.2927C26.8945 14.5014 28.0152 13.9967 29.2084 13.8424C30.4017 13.688 31.6139 13.8909 32.6918 14.4255C33.7697 14.9601 34.6649 15.8023 35.2641 16.8457C35.8634 17.889 36.1398 19.0866 36.0584 20.2871C35.9475 21.8961 35.2029 23.3955 33.9879 24.4563C32.7728 25.517 31.1867 26.0524 29.5773 25.945Z" fill="white" fill-opacity="0.06"/>
							</g>
							<defs>
							<clipPath id="clip0_10_571">
							<rect width="45" height="39" fill="white"/>
							</clipPath>
							</defs>
						</svg>							
						<svg class="skull_icn" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M8 0.5C4.41594 0.5 1.5 3.41594 1.5 7V11.8384L4.0625 12.8638L4.59 15.5H6V13.5H7V15.5H7.5V13.5H8.5V15.5H9V13.5H10V15.5H11.41L11.9375 12.8638L14.5 11.8384V7C14.5 3.41594 11.5841 0.5 8 0.5ZM5.25 10.5C4.90388 10.5 4.56554 10.3974 4.27775 10.2051C3.98997 10.0128 3.76566 9.73947 3.63321 9.4197C3.50076 9.09993 3.4661 8.74806 3.53363 8.40859C3.60115 8.06913 3.76782 7.75731 4.01256 7.51256C4.25731 7.26782 4.56912 7.10115 4.90859 7.03363C5.24806 6.9661 5.59993 7.00076 5.9197 7.13321C6.23947 7.26566 6.51278 7.48997 6.70507 7.77775C6.89736 8.06554 7 8.40388 7 8.75C6.9995 9.21398 6.81497 9.65881 6.48689 9.98689C6.15881 10.315 5.71398 10.4995 5.25 10.5ZM6.85969 12.5L7.625 10H8.375L9.14031 12.5H6.85969ZM10.75 10.5C10.4039 10.5 10.0655 10.3974 9.77775 10.2051C9.48997 10.0128 9.26566 9.73947 9.13321 9.4197C9.00076 9.09993 8.9661 8.74806 9.03363 8.40859C9.10115 8.06913 9.26782 7.75731 9.51256 7.51256C9.7573 7.26782 10.0691 7.10115 10.4086 7.03363C10.7481 6.9661 11.0999 7.00076 11.4197 7.13321C11.7395 7.26566 12.0128 7.48997 12.2051 7.77775C12.3974 8.06554 12.5 8.40388 12.5 8.75C12.4995 9.21398 12.315 9.65881 11.9869 9.98689C11.6588 10.315 11.214 10.4995 10.75 10.5Z" fill="white"/>
						</svg>
                        <div class="wr_fs_nm alcn">
                            ${killerId !== null ? `<div class="id jlcn">${killerId}</div>` : ''}
                            <span>${killerName}</span>
                        </div>
                        <div class="wr_fs_nm killedid alcn">
                            ${victimId !== null ? `<div class="id jlcn">${victimId}</div>` : ''}
                            <span>${victimName}</span>
                        </div>
                        <div class="flex_stat_nd alcn">
                            <div class="id status jlcn">${status}</div>
                            ${distance !== null ? `<div class="distance jlcn"><span>${distance}</span></div>` : ''}
                        </div>								
                    </div>
                `;
            
                const $killfeed = $(killfeedHtml);
                $(".kills_cont").prepend($killfeed);
                $killfeed.hide().fadeIn();
  
                setTimeout(() => {
                    $killfeed.fadeOut(300, function() {
                        $(this).remove();
                    });
                }, timeout);
            }
        break;
        case "OpenSettings":
            for (let setting in currentSettings) {
                updateSwitchDisplay(setting, currentSettings[setting]);
            }
            
            $('#food_option .sect_opt').removeClass('sect_opt_selected');
            $('#food_option .sect_opt').eq(currentFoodVariant - 1).addClass('sect_opt_selected');
            
            $('#speedo_option .sect_opt').removeClass('sect_opt_selected');
            $('#speedo_option .sect_opt').eq(currentSpeedoVariant - 1).addClass('sect_opt_selected');
            
            if (currentSettings.speedometer) {
                if (currentSpeedoVariant === 1) $(".speedo_wrap").fadeIn();
                else $(".speedo_second").fadeIn();
            }
            
            $(".hud_settings").fadeIn();
        break;
        case "CloseSettings":
            if ($(".hud_settings").is(":visible")) {
                closeSettings();
            }
        break;
        case "UpdateSettings":
            currentSettings = item.settings;
            for (let setting in currentSettings) {
                updateSwitchDisplay(setting, currentSettings[setting]);
                applySetting(setting, currentSettings[setting]);
            }
        break;
        case "UpdateOnline":
            $("#data_online").text(item.current);
            if (currentSettings.online_count) $("#online_stat").show();
            else $("#online_stat").hide();
        break;
        case "UpdateVisum":
            $("#visum").text(item.visum || "0");
        break;
        case "OpenChat":
            if (item.state) {
                $(".chat_input").val("");
                $(".chat_sect").fadeIn();
                $(".chat_input").focus();
                $(".row_suggestions").hide();
            } else {
                $(".chat_sect").fadeOut();
                $(".row_suggestions").hide();
            }
        break;
        case "AddSuggestion":
            if (item.command && item.description) {
                chatSuggestions[item.command.toLowerCase()] = {
                    command: item.command,
                    description: item.description,
                    params: item.params || []
                };
            }
        break;
        default:
        break;
    }
})


function checkFunkWrapper() {
    if ($("#radio").hasClass("talked") && currentSettings.radio_list) {
        $(".radio_cont").css("display", "flex");
    } else {
        $(".radio_cont").css("display", "none");
    }
}

function toggleSetting(setting) {
    currentSettings[setting] = !currentSettings[setting];
    updateSwitchDisplay(setting, currentSettings[setting]);
    applySetting(setting, currentSettings[setting]);
}

function updateSwitchDisplay(setting, value) {
    const $panel = $(`.pannel_hs[data-setting="${setting}"]`);
    
    if ($panel.length > 0) {
        const $switch = $panel.find('.switch');
        if (value) {
            $switch.removeClass('selected_switch active_switch');
        } else {
            $switch.addClass('selected_switch active_switch');
        }
    } else {
        $('.pannel_hs').each(function() {
            const $panel = $(this);
            const settingText = $panel.find('.row_hs_pnl span:last').text().toLowerCase();
            
            const settingMap = {
                'disable speedo': 'speedometer',
                'disable food': 'hungry',
                'disable water': 'thirst',
                'disable voice': 'voice_range',
                'disable radio': 'radio_display',
            };
            
            const mappedSetting = settingMap[settingText];
            if (mappedSetting === setting) {
                const $switch = $panel.find('.switch');
                if (value) {
                    $switch.removeClass('selected_switch active_switch');
                } else {
                    $switch.addClass('selected_switch active_switch');
                }
            }
        });
    }
}

function applySetting(setting, value) {
    switch(setting) {
        case 'voice_range':
            if (value) {
                $("#micro").fadeIn();
            } else {
                $("#micro").fadeOut();
            }
            break;
        case 'radio_display':
            if (value) {
                $("#radio").fadeIn();
            } else {
                $("#radio").fadeOut();
            }
            break;
        case 'hungry':
            if (value) {
                $(".food_sect").fadeIn();
                $(".fw_cont .food_sect").fadeIn();
            } else {
                $(".food_sect").fadeOut();
            }
            break;
        case 'thirst':
            if (value) {
                $(".water_sect").fadeIn();
                $(".fw_cont .water_sect").fadeIn();
            } else {
                $(".water_sect").fadeOut();
            }
            break;
        case 'notifications':
            if (value) {
                $(".notifys_cont").fadeIn();
            } else {
                $(".notifys_cont").fadeOut();
            }
            break;
        case 'street_display':
            if (value) {
                $("#street_block").fadeIn();
            } else {
                $("#street_block").fadeOut();
            }
            break;
        case 'date_time':
            if (value) {
                $(".inf_wrapper:has(#date), .inf_wrapper:has(#time)").fadeIn();
            } else {
                $(".inf_wrapper:has(#date), .inf_wrapper:has(#time)").fadeOut();
            }
            break;
        case 'player_id':
            if (value) {
                $("#id_stat").fadeIn();
            } else {
                $("#id_stat").fadeOut();
            }
            break;
        case 'online_count':
            if (value) {
                $("#online_stat").fadeIn();
            } else {
                $("#online_stat").fadeOut();
            }
            break;
        case 'cash_money':
            if (value) {
                $(".pannel_money_section.walletmoney").fadeIn();
            } else {
                $(".pannel_money_section.walletmoney").fadeOut();
            }
            break;
        case 'bank_money':
            if (value) {
                $(".pannel_money_section.bankmoney").fadeIn();
            } else {
                $(".pannel_money_section.bankmoney").fadeOut();
            }
            break;
        case 'ammo_display':
            if (value && hasWeaponEquipped) {
                $(".ammo_cont").fadeIn();
            } else {
                $(".ammo_cont").fadeOut();
            }
            break;
        case 'radio_list':
            checkFunkWrapper();
            break;
        case 'job_display':
            if (value) {
                $("#job_block").fadeIn();
            } else {
                $("#job_block").fadeOut();
            }
            break;
        case 'help_notify':
            if (value && helpNotifyActive) {
                $("#helpnotify_wrap").fadeIn();
            } else {
                $("#helpnotify_wrap").fadeOut();
            }
            break;
        case 'speedometer':
            if (value && (isSpeedoActive || $(".hud_settings").is(':visible'))) {
                if (currentSpeedoVariant === 1) $(".speedo_wrap").fadeIn();
                else $(".speedo_second").fadeIn();
            } else {
                $(".speedo_wrap").fadeOut();
                $(".speedo_second").fadeOut();
            }
            break;
    }
}

let onlineVisible = false;

window.addEventListener("message", function (event) {
  const data = event.data;

  switch (data.action) {
    case "online_count": {
      if (typeof data.current === "number" && typeof data.max === "number") {
        const text = `${data.current}/${data.max}`;
        const $txt = $("#data_online");
        if ($txt.text() !== text) $txt.text(text);
      }

      let $cont = $("#online_cont");
      if (!$cont.length) $cont = $("#online_stat");

      const shouldShow = data.show !== false && currentSettings.online_count;

      if (shouldShow && !onlineVisible) {
        onlineVisible = true;
        $cont.stop(true, true).fadeIn(150);
      } else if (!shouldShow && onlineVisible) {
        onlineVisible = false;
        $cont.stop(true, true).fadeOut(150);
      }
      break;
    }
  }
});

function saveSettings() {
    $.post(`https://${GetParentResourceName()}/saveSettings`, JSON.stringify({
        settings: currentSettings,
        speedoVariant: currentSpeedoVariant,
        foodVariant: currentFoodVariant
    }));
}

function resetSettings() {
    currentSettings = {
        voice_range: true,
        radio_display: true,
        hungry: true,
        thirst: true,
        notifications: true,
        street_display: true,
        date_time: true,
        player_id: true,
        online_count: true,
        cash_money: true,
        bank_money: true,
        ammo_display: true,
        radio_list: true,
        job_display: true,
        help_notify: true,
        speedometer: true
    };
    
    for (let setting in currentSettings) {
        updateSwitchDisplay(setting, currentSettings[setting]);
    }
    
    for (let setting in currentSettings) {
        if (setting === 'speedometer') {
            if (!currentSettings[setting]) {
                $(".speedo_wrap").fadeOut();
                $(".speedo_second").fadeOut();
            }
        } else {
            applySetting(setting, currentSettings[setting]);
        }
    }
    
    currentSpeedoVariant = 1;
    currentFoodVariant = 1;
    $('#speedo_option .sect_opt').removeClass('sect_opt_selected').eq(0).addClass('sect_opt_selected');
    $('#food_option .sect_opt').removeClass('sect_opt_selected').eq(0).addClass('sect_opt_selected');
    applySpeedoVariant(currentSpeedoVariant);
    applyFoodVariant(currentFoodVariant);

    localStorage.removeItem('hudSettings');
    localStorage.removeItem('speedoVariant');
    localStorage.removeItem('foodVariant');

    resetElementPositions();
    
    $.post(`https://${GetParentResourceName()}/resetSettings`, JSON.stringify({}));
}

function closeSettings() {
    if (isEditMode) {
        toggleEditMode();
    }
    
    saveElementPositions();
    
    if (!currentSettings.speedometer || !isSpeedoActive) {
        $(".speedo_wrap").fadeOut();
        $(".speedo_second").fadeOut();
    }
    
    if (currentSettings.help_notify && helpNotifyActive) {
        $("#helpnotify_wrap").stop(true, true).css("display", "flex").fadeIn(100);
    } else {
        $("#helpnotify_wrap").stop(true, true).fadeOut(0);
    }
    
    $.post(`https://${GetParentResourceName()}/closeSettings`, JSON.stringify({}));
    $(".hud_settings").fadeOut();
}

function loadSettings() {
    // Nur fuer einmalige Migration alter localStorage-Einstellungen.
    const saved = localStorage.getItem('hudSettings');
    if (!saved) return;
    try {
        const settings = JSON.parse(saved);
        for (let setting in settings) {
            if (currentSettings.hasOwnProperty(setting) && typeof settings[setting] === 'boolean') {
                currentSettings[setting] = settings[setting];
                applySetting(setting, settings[setting]);
                updateSwitchDisplay(setting, settings[setting]);
            }
        }
    } catch (_) {}
}

let Recent = [];
let RecentId = -1;

let chatSuggestions = {};

function updateChatSuggestions(inputText) {
    const $suggestions = $(".row_suggestions");
    const $suggItems = $(".wr_sugg");
    
    $suggItems.hide();
    
    if (!inputText || !inputText.startsWith('/')) {
        $suggestions.hide();
        return;
    }
    
    const parts = inputText.split(' ');
    const commandPart = parts[0].toLowerCase();
    const hasArgs = parts.length > 1;
    
    let matches = [];
    
    if (hasArgs) {
        const exactMatch = chatSuggestions[commandPart];
        if (exactMatch) {
            matches.push(exactMatch);
        }
    } else {
        for (const cmd in chatSuggestions) {
            if (cmd.startsWith(commandPart) || chatSuggestions[cmd].command.toLowerCase().startsWith(commandPart)) {
                matches.push(chatSuggestions[cmd]);
                if (matches.length >= 4) break; 
            }
        }
    }
    
    if (matches.length === 0) {
        $suggestions.hide();
        return;
    }
    
    matches.forEach((match, index) => {
        const $item = $suggItems.eq(index);
        const $panel = $item.find('.pannel_sugg');
        
        let paramsHtml = '';
        if (match.params && match.params.length > 0) {
            paramsHtml = match.params.map(p => `<span>[${p.name}]</span>`).join('');
        }
        $panel.html(`<span>${match.command}</span>${paramsHtml}`);
        
        $item.show();
    });
    
    $suggestions.show();
}

$(document).on('input', '.chat_input', function() {
    const inputText = $(this).val();
    updateChatSuggestions(inputText);
});

$(document).on('click', '.wr_sugg', function() {
    const command = $(this).find('.pannel_sugg span:first').text();
    $(".chat_input").val(command + ' ');
    $(".chat_input").focus();
    updateChatSuggestions(command + ' ');
});

document.addEventListener("keydown", e => {
    if (e.key === "Escape" && $(".hud_settings").is(":visible")) {
        e.preventDefault();
        closeSettings();
        return;
    }

    if (!$(".chat_sect").is(":visible")) return;
    
    if (e.which === 13) {
        const input = $(".chat_input").val();
        const [command, ...args] = input.split(" ");

        if (input.trim() !== "") {
            Recent.push(input);
            RecentId = Recent.length;
        }
        $(".chat_sect").fadeOut();
        $(".row_suggestions").hide();

        $.post(`https://${GetParentResourceName()}/command`, JSON.stringify({
            command: command,
            args: args.join(" ")
        }));
    } else if (e.key === "Escape") {
        $(".chat_sect").fadeOut();
        $(".row_suggestions").hide();
        $.post(`https://${GetParentResourceName()}/command`, JSON.stringify({
            command: "",
            args: ""
        }));
    } else if (e.key === "ArrowUp") {
        if (RecentId > 0) {
            RecentId--;
            $(".chat_input").val(Recent[RecentId]);
            let inputElem = document.querySelector('.chat_input');
            if (inputElem) {
                inputElem.selectionStart = inputElem.selectionEnd = inputElem.value.length;
            }
        }
    } else if (e.key === "ArrowDown") {
        if (RecentId < Recent.length - 1) {
            RecentId++;
            $(".chat_input").val(Recent[RecentId]);
            let inputElem = document.querySelector('.chat_input');
            if (inputElem) {
                inputElem.selectionStart = inputElem.selectionEnd = inputElem.value.length;
            }
        } else if (RecentId === Recent.length - 1) {
            RecentId++;
            $(".chat_input").val("");
            let inputElem = document.querySelector('.chat_input');
            if (inputElem) {
                inputElem.selectionStart = inputElem.selectionEnd = 0;
            }
        }
    } else if (e.key === "Tab") {
        e.preventDefault();
        // Tab autocomplete
        const $firstSugg = $(".wr_sugg:visible:first");
        if ($firstSugg.length) {
            const command = $firstSugg.find('.pannel_sugg span:first').text();
            $(".chat_input").val(command + ' ');
            updateChatSuggestions(command + ' ');
        }
    }
})

$(document).ready(function() {
    cachedElements.init();
    loadSettings();
    loadSpeedoVariant();
    loadFoodVariant();
    // HUD stays hidden until the player data has finished loading
    $("body").hide();
    $.post(`https://${GetParentResourceName()}/nuiReady`, JSON.stringify({}));
    
    
    $('.close_hs').on('click', function() {
        closeSettings();
    });
    
    $('.pannel_hs').on('click', function() {
        const $panel = $(this);
        const setting = $panel.attr('data-setting');
        
        if (setting) {
            toggleSetting(setting);
        } else {
            const settingText = $panel.find('.row_hs_pnl span:last').text().toLowerCase();
            
            if (settingText.includes('speedo')) {
                toggleSetting('speedometer');
            } else if (settingText.includes('food')) {
                toggleSetting('hungry');
            } else if (settingText.includes('water')) {
                toggleSetting('thirst');
            } else if (settingText.includes('voice')) {
                toggleSetting('voice_range');
            } else if (settingText.includes('radio')) {
                toggleSetting('radio_display');
            }
        }
    });
    
    $('#food_option .sect_opt').on('click', function() {
        const index = $(this).index();
        selectFoodVariant(index + 1);
    });
    
    $('#speedo_option .sect_opt').on('click', function() {
        const index = $(this).index();
        selectSpeedoVariantFromSettings(index + 1);
    });
    
    $(document).on('click', '.move_btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleEditMode();
    });
    
    $('.btn_hs.red_hs').on('click', function() {
        resetSettings();
    });
    
    $('.btn_hs:not(.red_hs)').on('click', function() {
        saveSettings();
        closeSettings();
    });
});



const progressCircles = [
    { element: document.getElementById('circle-progress'), minOffset: 190.066, maxOffset: 760.27, offsetRange: 760.27 - 190.066 }
  ];
  
  function setCircleProgress({ element, percent, minOffset, maxOffset, offsetRange }) {
    let offset = minOffset + (offsetRange - (percent / 100) * offsetRange);
    offset = Math.min(Math.max(offset, minOffset), maxOffset);
    element.style.strokeDashoffset = offset;
  }
  
  setCircleProgress({ ...progressCircles[0], percent: 70 });



let isEditMode = false;
let draggingElement = null;
let offsetX = 0;
let offsetY = 0;

function refreshDraggables() {
    if (!isEditMode) return;
    isEditMode = false;
    toggleEditMode();
}

const draggableElements = [
    // Eigenständige Widgets (bewegen sich unabhängig, nicht als gebündelte Zone)
    '.speedo_wrap',
    '.speedo_second',
    '.status_top',
    '#helpnotify_wrap',

    // right_top: Branding, Mikrofon und Funk separat verschiebbar
    '#server_branding',
    '#micro',
    '#radio',
    '#visum_stat',
    '#id_stat',
    '#online_stat',
    '.pannel_money_section.walletmoney',
    '.pannel_money_section.bankmoney',
    '.ammo_cont',
    '.radio_cont',
    '.kills_cont',

    // left_top: jedes Unterelement einzeln, keine ganze Zone mehr
    '.inf_wrapper:has(#date)',
    '.inf_wrapper:has(#time)',
    '.inf_wrapper:has(#einreise)',
    '#job_block',
    '#street_block',
    '.chat_sect',

    // fw_cont (Essen/Trinken): jede Sektion einzeln, keine ganze Zone mehr
    '.fw_cont:not(.second_fw) .food_sect',
    '.fw_cont:not(.second_fw) .water_sect',
    '.fw_cont.second_fw .food_sect',
    '.fw_cont.second_fw .water_sect',

    // map_left: einzelnes Unterelement, keine ganze Zone mehr
    '.robbery_sect',

    // middle_bottom: jedes Unterelement einzeln, keine ganze Zone mehr
    '.muted_cont',
    '.e_section',
    '.load_section',
    '.pannel_zone:not(.red_zone)',
    '.pannel_zone.red_zone',

    // farming_box: jedes Unterelement einzeln, keine ganze Zone mehr
    '.time_fb',
    '.fb_cont',

    // Restliche Feinjustierung
    '.grmn',
    '.redmn',
];

function toggleEditMode() {
    isEditMode = !isEditMode;
    const $moveBtn = $('.move_btn');
    
    if (isEditMode) {
        $moveBtn.addClass('active_edit_mode');
        
        let activatedCount = 0;
        draggableElements.forEach(selector => {
            const elem = document.querySelector(selector);
            if (elem) {
                // Only process visible elements
                const computedStyle = window.getComputedStyle(elem);
                const isVisible = computedStyle.display !== 'none' && 
                                 computedStyle.visibility !== 'hidden' && 
                                 computedStyle.opacity !== '0';
                
                if (isVisible || isEditMode) {
                    elem.classList.add('hud-draggable');
                    elem.style.cursor = 'move';
                    elem.style.outline = '0.104vw dashed rgba(255, 255, 255, 0.8)';
                    elem.style.outlineOffset = '0.052vw';
                    elem.style.boxShadow = '0 0 0.208vw rgba(255, 255, 255, 0.5)';
                    elem.style.pointerEvents = 'auto';
                    elem.style.userSelect = 'none';
                    elem.style.zIndex = '9998';
                    activatedCount++;
                } else {
                    console.warn('Element hidden:', selector);
                }
            } else {
                console.warn('Element not found:', selector);
            }
        });
    } else {
        // Remove the visual edit indicator
        $moveBtn.removeClass('active_edit_mode');
        
        draggableElements.forEach(selector => {
            const elem = document.querySelector(selector);
            if (elem) {
                elem.classList.remove('hud-draggable');
                elem.style.cursor = '';
                elem.style.outline = '';
                elem.style.outlineOffset = '';
                elem.style.boxShadow = '';
                elem.style.pointerEvents = '';
                elem.style.userSelect = '';
                if (elem.style.zIndex === '9998') {
                    elem.style.zIndex = '';
                }
            }
        });
        
        saveElementPositions();
    }
}

// position:fixed nutzt als Containing Block das nächste Vorfahren-Element mit transform/
// filter/perspective (CSS-Spec) statt des Viewports. .right_top hat z. B. transform:
// scale(1.15) -> ohne Reparenting würden hier gesetzte fixed-Positionen relativ zu
// .right_top berechnet und das Element landet weit außerhalb des sichtbaren Bereichs
// (genau das Verschwinden von Radio/Logo/etc. oben rechts beim Verschieben).
function findTransformedAncestor(elem) {
    let ancestor = elem.parentElement;
    while (ancestor && ancestor !== document.body) {
        const cs = window.getComputedStyle(ancestor);
        if (cs.transform !== 'none' || cs.filter !== 'none' || cs.perspective !== 'none') {
            return ancestor;
        }
        ancestor = ancestor.parentElement;
    }
    return null;
}

function ensureViewportFixedContext(elem) {
    if (elem.dataset.hudReparented === 'true') return;
    if (!findTransformedAncestor(elem)) return;

    elem._hudOriginalParent = elem.parentElement;
    elem._hudOriginalNextSibling = elem.nextSibling;
    elem.dataset.hudReparented = 'true';
    document.body.appendChild(elem);
}

function restoreOriginalParent(elem) {
    if (elem.dataset.hudReparented !== 'true') return;

    const parent = elem._hudOriginalParent;
    const nextSibling = elem._hudOriginalNextSibling;
    if (parent) {
        if (nextSibling && nextSibling.parentElement === parent) {
            parent.insertBefore(elem, nextSibling);
        } else {
            parent.appendChild(elem);
        }
    }
    delete elem.dataset.hudReparented;
    elem._hudOriginalParent = null;
    elem._hudOriginalNextSibling = null;
}

function clampElementToViewport(elem) {
    if (!elem) return;
    const rect = elem.getBoundingClientRect();
    const maxLeft = Math.max(0, window.innerWidth - rect.width);
    const maxTop = Math.max(0, window.innerHeight - rect.height);
    const left = Math.min(Math.max(rect.left, 0), maxLeft);
    const top = Math.min(Math.max(rect.top, 0), maxTop);

    if (Math.abs(left - rect.left) > 0.5 || Math.abs(top - rect.top) > 0.5) {
        elem.style.setProperty('position', 'fixed', 'important');
        elem.style.setProperty('left', left + 'px', 'important');
        elem.style.setProperty('right', 'auto', 'important');
        elem.style.setProperty('top', top + 'px', 'important');
        elem.style.setProperty('bottom', 'auto', 'important');
        elem.dataset.usesRight = 'false';
        elem.dataset.usesBottom = 'false';
    }
}

document.addEventListener('mousedown', (e) => {
    if (!isEditMode) {
        return;
    }

    if (e.target.closest('.hud_settings')) {
        return;
    }

    const target = e.target.closest('.hud-draggable');

    if (target) {
        e.preventDefault();
        e.stopPropagation();
        draggingElement = target;

        const rect = target.getBoundingClientRect();
        ensureViewportFixedContext(target);
        const computedStyle = window.getComputedStyle(target);
        
        const usesRight = computedStyle.right !== 'auto' && computedStyle.right !== '';
        const usesBottom = computedStyle.bottom !== 'auto' && computedStyle.bottom !== '';
        
        target.dataset.usesRight = usesRight;
        target.dataset.usesBottom = usesBottom;

        // position:fixed relativ zum Viewport statt zum Elternelement, damit jedes Element
        // wirklich unabhängig ist (Geschwister, die aus dem Flex-/Column-Fluss fallen,
        // verändern sonst die Elterngröße und verschieben dadurch alle anderen Kinder mit).
        if (computedStyle.position !== 'fixed') {
            target.style.position = 'fixed';

            const relativeRight = window.innerWidth - rect.right;
            const relativeBottom = window.innerHeight - rect.bottom;

            if (usesRight) {
                target.style.right = relativeRight + 'px';
                target.style.left = 'auto';
            } else {
                target.style.left = rect.left + 'px';
                target.style.right = 'auto';
            }

            if (usesBottom) {
                target.style.bottom = relativeBottom + 'px';
                target.style.top = 'auto';
            } else {
                target.style.top = rect.top + 'px';
                target.style.bottom = 'auto';
            }
        }

        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        target.style.opacity = '0.7';
        target.style.zIndex = '9999';
    }
});

document.addEventListener('mousemove', (e) => {
    if (!draggingElement) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const currentRect = draggingElement.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - offsetX, 0), Math.max(0, window.innerWidth - currentRect.width));
    const y = Math.min(Math.max(e.clientY - offsetY, 0), Math.max(0, window.innerHeight - currentRect.height));
    
    const usesRight = draggingElement.dataset.usesRight === 'true';
    const usesBottom = draggingElement.dataset.usesBottom === 'true';

    if (usesRight) {
        const rect = draggingElement.getBoundingClientRect();
        const relativeRight = window.innerWidth - (x + rect.width);
        draggingElement.style.right = relativeRight + 'px';
        draggingElement.style.left = 'auto';
    } else {
        draggingElement.style.left = x + 'px';
        draggingElement.style.right = 'auto';
    }

    if (usesBottom) {
        const rect = draggingElement.getBoundingClientRect();
        const relativeBottom = window.innerHeight - (y + rect.height);
        draggingElement.style.bottom = relativeBottom + 'px';
        draggingElement.style.top = 'auto';
    } else {
        draggingElement.style.top = y + 'px';
        draggingElement.style.bottom = 'auto';
    }

    draggingElement.style.position = 'fixed';
});

document.addEventListener('mouseup', () => {
    if (draggingElement) {
        draggingElement.style.opacity = '';
        draggingElement.style.zIndex = '';
        draggingElement = null;
    }
});

// Wandelt einen gespeicherten left/right/top/bottom-Wert (px beim Ziehen, % nach dem Laden)
// in einen Prozentwert relativ zum Viewport um, damit die Position auflösungs-
// /seitenverhältnisunabhängig bleibt UND unabhängig davon, wie groß der (nicht mehr
// draggable) Elternbereich gerade ist.
function toPercentValue(rawValue, basisPx) {
    if (!rawValue || rawValue === 'auto') return undefined;
    if (rawValue.endsWith('%')) {
        const pct = parseFloat(rawValue);
        return isNaN(pct) ? undefined : pct;
    }
    const px = parseFloat(rawValue);
    if (isNaN(px) || !basisPx) return undefined;
    return (px / basisPx) * 100;
}

function saveElementPositions() {
    const positions = {};

    draggableElements.forEach(selector => {
        const elem = document.querySelector(selector);

        if (elem && elem.style.position === 'fixed') {
            const pos = {};

            const left = toPercentValue(elem.style.left, window.innerWidth);
            const right = toPercentValue(elem.style.right, window.innerWidth);
            const top = toPercentValue(elem.style.top, window.innerHeight);
            const bottom = toPercentValue(elem.style.bottom, window.innerHeight);

            if (left !== undefined) pos.left = left;
            else if (right !== undefined) pos.right = right;

            if (top !== undefined) pos.top = top;
            else if (bottom !== undefined) pos.bottom = bottom;

            if (Object.keys(pos).length > 0) {
                positions[selector] = pos;
            }
        }
    });

    $.post(`https://${GetParentResourceName()}/saveHudLayout`, JSON.stringify({ layout: positions }));
}

function applyElementPositions(positions) {
    if (!positions) return;

    Object.keys(positions).forEach(selector => {
        if (!draggableElements.includes(selector)) return;
        const elem = document.querySelector(selector);
        if (!elem) return;
        const pos = positions[selector];

        ensureViewportFixedContext(elem);
        elem.classList.add('hud-custom-position');
        elem.style.setProperty('position', 'fixed', 'important');

        if (pos.left !== undefined) {
            elem.style.setProperty('left', pos.left + '%', 'important');
            elem.style.setProperty('right', 'auto', 'important');
        } else if (pos.right !== undefined) {
            elem.style.setProperty('right', pos.right + '%', 'important');
            elem.style.setProperty('left', 'auto', 'important');
        }

        if (pos.top !== undefined) {
            elem.style.setProperty('top', pos.top + '%', 'important');
            elem.style.setProperty('bottom', 'auto', 'important');
        } else if (pos.bottom !== undefined) {
            elem.style.setProperty('bottom', pos.bottom + '%', 'important');
            elem.style.setProperty('top', 'auto', 'important');
        }

        requestAnimationFrame(() => clampElementToViewport(elem));
    });
}

function resetElementPositions() {
    if (isEditMode) {
        toggleEditMode();
    }

    localStorage.removeItem('hudElementPositions');
    $.post(`https://${GetParentResourceName()}/resetHudLayout`, JSON.stringify({}));

    draggableElements.forEach(selector => {
        const elem = document.querySelector(selector);
        
        if (elem) {
            elem.classList.remove('hud-custom-position');
            elem.classList.remove('hud-draggable');
            restoreOriginalParent(elem);
            
            elem.style.setProperty('position', '', 'important');
            elem.style.setProperty('left', '', 'important');
            elem.style.setProperty('right', '', 'important');
            elem.style.setProperty('top', '', 'important');
            elem.style.setProperty('bottom', '', 'important');
            
            elem.style.removeProperty('position');
            elem.style.removeProperty('left');
            elem.style.removeProperty('right');
            elem.style.removeProperty('top');
            elem.style.removeProperty('bottom');
            
            elem.style.cursor = '';
            elem.style.outline = '';
            elem.style.opacity = '';
            elem.style.zIndex = '';
            elem.style.pointerEvents = '';
            elem.style.boxShadow = '';
            elem.style.outlineOffset = '';
            
            const parent = elem.parentElement;
            if (parent && parent.style.position === 'relative') {
                const tempDiv = document.createElement('div');
                tempDiv.className = parent.className;
                document.body.appendChild(tempDiv);
                const originalPosition = window.getComputedStyle(tempDiv).position;
                document.body.removeChild(tempDiv);
                
                if (originalPosition === 'static') {
                    parent.style.position = '';
                }
            }
        }
    });
}

let currentSpeedoVariant = 1;
let currentFoodVariant = 1; 

function selectSpeedoVariant(variant) {
    document.querySelectorAll('.var_pnl').forEach(btn => {
        btn.classList.remove('selected_var');
    });
    
    document.querySelectorAll('.var_pnl')[variant - 1].classList.add('selected_var');
    
    currentSpeedoVariant = variant;
    
    applySpeedoVariant(variant);
}

function applySpeedoVariant(variant) {
    const speedo1 = document.querySelector('.speedo_wrap');
    const speedo2 = document.querySelector('.speedo_second');
    
    if (speedo1) speedo1.style.display = 'none';
    if (speedo2) speedo2.style.display = 'none';
    
    if (currentSettings.speedometer) {
        if ($('.hud_settings').is(':visible')) {
            if (variant === 1 && speedo1) {
                $(speedo1).fadeIn();
            } else if (variant === 2 && speedo2) {
                $(speedo2).fadeIn();
            }
        } else if (isSpeedoActive) {
            if (variant === 1 && speedo1) {
                $(speedo1).fadeIn();
            } else if (variant === 2 && speedo2) {
                $(speedo2).fadeIn();
            }
        }
    }
}

function selectFoodVariant(variant) {
    currentFoodVariant = variant;
    
    $('#food_option .sect_opt').removeClass('sect_opt_selected');
    $('#food_option .sect_opt').eq(variant - 1).addClass('sect_opt_selected');
    
    applyFoodVariant(variant);
}

function applyFoodVariant(variant) {
    if (variant === 1) {
        $('.fw_cont:not(.second_fw)').show();
        $('.fw_cont.second_fw').hide();
    } else {
        $('.fw_cont:not(.second_fw)').hide();
        $('.fw_cont.second_fw').show();
    }
    
    refreshDraggables();
}

function selectSpeedoVariantFromSettings(variant) {
    currentSpeedoVariant = variant;
    
    $('#speedo_option .sect_opt').removeClass('sect_opt_selected');
    $('#speedo_option .sect_opt').eq(variant - 1).addClass('sect_opt_selected');
    
    applySpeedoVariant(variant);
}

function loadSpeedoVariant() {
    const saved = localStorage.getItem('speedoVariant');
    if (saved) {
        currentSpeedoVariant = parseInt(saved);
        if (currentSpeedoVariant < 1 || currentSpeedoVariant > 2) {
            currentSpeedoVariant = 1;
        }
        
        $('#speedo_option .sect_opt').removeClass('sect_opt_selected');
        $('#speedo_option .sect_opt').eq(currentSpeedoVariant - 1).addClass('sect_opt_selected');
        
        applySpeedoVariant(currentSpeedoVariant);
    } else {
        applySpeedoVariant(currentSpeedoVariant);
    }
}

function loadFoodVariant() {
    const saved = localStorage.getItem('foodVariant');
    if (saved) {
        currentFoodVariant = parseInt(saved);
        if (currentFoodVariant < 1 || currentFoodVariant > 2) {
            currentFoodVariant = 1;
        }
        
        $('#food_option .sect_opt').removeClass('sect_opt_selected');
        $('#food_option .sect_opt').eq(currentFoodVariant - 1).addClass('sect_opt_selected');
        
        applyFoodVariant(currentFoodVariant);
    } else {
        applyFoodVariant(currentFoodVariant);
    }
}
  


// html/js/app.js
// html/js/app.js

function setVar(name, value) {
  document.documentElement.style.setProperty(name, value);
}
function clearVar(name) {
  document.documentElement.style.removeProperty(name);
}

window.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || !data.action) return;

  if (data.action === "minimapsize") {
    if (data.enabled) {
      // aktiv: deine gewünschten Werte
      setVar("--map-left-left", "25.5vw");
      setVar("--fw-cont-bottom", "25.5vw");
    } else {
      // zurück auf standard (CSS-defaults)
      clearVar("--map-left-left");
      clearVar("--fw-cont-bottom");
    }
  }
});
