$(document).ready(function () {
    window.addEventListener("message", function (event) {
        var a = event.data;
        switch(a.action) {
            case 'clearShop':
                $("#shop-items").empty();
                break;
            case 'show':
                $(".nav").removeClass("selected_nav");
                $("#buypage").addClass("selected_nav");
                $(".page").hide();
                $("#page-buy").show();

                $("#player_name").text(a.data.name);
                if (a.data.avatar) {
                    $("#player_avatar").attr('src', a.data.avatar);
                } else {
                    $("#player_avatar").attr('src', 'assets/imgs/profile.png');
                }
                
                $("#player_soldfishes").text(a.data.soldfishes);
                $("#player_income").text(new Intl.NumberFormat("de-DE").format(a.data.income));
                $("#level").text("Lvl. " + a.data.leveldata.level);
                
                $(".stats_level_xp_current").text(new Intl.NumberFormat("de-DE").format(a.data.leveldata.xp));
                $(".stats_level_xp_total").text(new Intl.NumberFormat("de-DE").format(a.data.leveldata.needxp));

                let progressPercent = Math.min((a.data.leveldata.xp / a.data.leveldata.needxp) * 100, 100);
                $(".xp_bar_fill").stop().animate({ width: progressPercent + "%" }, 700);

                setPlayerRank(a.data.leveldata.level);

                $("#app").fadeIn(200);
                break;
            
            case 'insertShopItems':
                $("#shop-items").append(`
                    <div class="fish_card clmn">
                        <span class="fish_price_tag">${new Intl.NumberFormat("de-DE").format(a.price)}$</span>
                        <img class="fish_image" src="assets/imgs/${a.name}.png" onerror="this.src='assets/imgs/profile.png'">
                        <span class="fish_name">${a.label}</span>
                        <div class="card_actions">
                            <button class="btn_united" onclick="buyProduct('${a.name}')">KAUFEN</button>
                        </div>
                    </div>
                `);
                break;

            case 'insertSellItems':
                appendSellItem(a);
                break;

            case 'updateFishInventory':
                $("#sell-items").empty();
                a.inventory.forEach(item => appendSellItem(item));
                break;

            case 'insertLeaderboard':
                appendLeaderboardRow(a.data);
                break;

            case 'updateLeaderboard':
                $("#leaderboard-data").empty();
                a.leaderboard.forEach(player => appendLeaderboardRow(player));
                break;

            case 'showLevel':
                showFishingHUD(a.data);
                break;

            case 'hideLevel':
                $("#fishing_hud").fadeOut(200);
                break;
        }
    });

    if (typeof GetParentResourceName !== 'function' && window.location.protocol === 'file:') {
        setTimeout(function() {
            $("#app").fadeIn(200);
            $("#shop-items").empty().append(`
                <div class="fish_card clmn">
                    <span class="fish_price_tag">500$</span>
                    <img class="fish_image" src="assets/imgs/angel.png" onerror="this.src='assets/imgs/profile.png'">
                    <span class="fish_name">Angel</span>
                    <div class="card_actions">
                        <button class="btn_united">KAUFEN</button>
                    </div>
                </div>
                <div class="fish_card clmn">
                    <span class="fish_price_tag">300$</span>
                    <img class="fish_image" src="assets/imgs/koeder.png" onerror="this.src='assets/imgs/profile.png'">
                    <span class="fish_name">Köder</span>
                    <div class="card_actions">
                        <button class="btn_united">KAUFEN</button>
                    </div>
                </div>
            `);
        }, 100);
    }
});

function appendSellItem(data) {
    const amount = data.count !== undefined ? data.count : data.amount;
    const sellBtn = amount > 0 ? 
        `<button class="btn_united" onclick="sellProduct(this)">VERKAUFEN</button>` : 
        `<button class="btn_united" style="opacity: 0.5; cursor: default;">LEER</button>`;

    $("#sell-items").append(`
        <div class="fish_card clmn" data-name="${data.name}" data-max="${amount}">
            <span class="fish_price_tag">${new Intl.NumberFormat("de-DE").format(data.price)}$</span>
            <img class="fish_image" src="assets/imgs/${data.name}.png" onerror="this.src='assets/imgs/profile.png'">
            <span class="fish_name">${data.label}</span>
            <div class="card_actions clmn">
                <div class="amount_stepper">
                    <i class="fa-solid fa-minus stepper_btn" onclick="changeQty(this, -1)"></i>
                    <span class="qty">${amount > 0 ? 1 : 0}</span>
                    <i class="fa-solid fa-plus stepper_btn" onclick="changeQty(this, 1)"></i>
                    <span class="max_btn" style="margin-left: 0.5vw; color: var(--accent); cursor: pointer;" onclick="setMax(this)">MAX</span>
                </div>
                ${sellBtn}
            </div>
        </div>
    `);
}

function appendLeaderboardRow(data) {
    const rank = data.place !== undefined ? data.place : data.rank;
    const sold = data.soldfishes !== undefined ? data.soldfishes : data.fish_sold;
    const income = data.income !== undefined ? data.income : data.earnings;
    const avatar = data.avatar || 'assets/imgs/profile.png';

    $("#leaderboard-data").append(`
        <div class="leaderboard_row flex w100 alcn">
            <span class="rank">#${rank}</span>
            <div class="leaderboard_player flex alcn name">
                <img src="${avatar}" style="width: 1.8vw; height: 1.8vw; border-radius: 50%; border: 1px solid rgba(11, 153, 255, 0.4); margin-right: 0.5vw;">
                <span>${data.name}</span>
            </div>
            <span class="sold">${sold}</span>
            <span class="lvl">${data.level}</span>
            <span class="xp">${new Intl.NumberFormat("de-DE").format(data.xp)}</span>
            <span class="income">${new Intl.NumberFormat("de-DE").format(income)}$</span>
        </div>
    `);
}

function setPlayerRank(level) {
    let rank = { name: "Bronze", tier: "I" };
    if (level >= 10) rank = { name: "Bronze", tier: "II" };
    if (level >= 20) rank = { name: "Bronze", tier: "III" };
    if (level >= 30) rank = { name: "Silber", tier: "I" };
    if (level >= 40) rank = { name: "Silber", tier: "II" };
    if (level >= 50) rank = { name: "Silber", tier: "III" };
    if (level >= 60) rank = { name: "Gold", tier: "I" };
    if (level >= 70) rank = { name: "Gold", tier: "II" };
    if (level >= 80) rank = { name: "Gold", tier: "III" };
    if (level >= 90) rank = { name: "Diamond", tier: "" };
    
    $("#rank_text").text(`${rank.name} ${rank.tier}`);
}

function changeQty(el, delta) {
    const card = $(el).closest(".fish_card");
    const max = parseInt(card.attr("data-max"));
    const qtyEl = card.find(".qty");
    let current = parseInt(qtyEl.text());
    
    current = Math.max(1, Math.min(current + delta, max));
    qtyEl.text(current);
}

function setMax(el) {
    const card = $(el).closest(".fish_card");
    const max = card.attr("data-max");
    card.find(".qty").text(max);
}

function buyProduct(name) {
    if (typeof GetParentResourceName === 'function') {
        $.post(`https://${GetParentResourceName()}/buyProduct`, JSON.stringify({ item: name }));
    }
}

function sellProduct(el) {
    const card = $(el).closest(".fish_card");
    const name = card.attr("data-name");
    const amount = parseInt(card.find(".qty").text());
    if (typeof GetParentResourceName === 'function') {
        $.post(`https://${GetParentResourceName()}/sellFish`, JSON.stringify({ fishType: name, amount: amount }));
    }
}

$(".nav").click(function() {
    $(".nav").removeClass("selected_nav");
    $(this).addClass("selected_nav");
    
    const id = $(this).attr("id");
    $(".page").hide();

    if (id === "buypage") {
        $("#page-buy").show();
    } else if (id === "sellpage") {
        $("#page-sell").show();
        if (typeof GetParentResourceName === 'function') {
            $.post(`https://${GetParentResourceName()}/getFishInventory`);
        }
    } else if (id === "overviewpage") {
        $("#page-overview").show();
        if (typeof GetParentResourceName === 'function') {
            $.post(`https://${GetParentResourceName()}/getLeaderboard`);
        }
    }
    
    if (typeof GetParentResourceName === 'function') {
        $.post(`https://${GetParentResourceName()}/switchPage`, JSON.stringify({ page: $(this).text().trim() }));
    }
});

function showFishingHUD(data) {
    $("#fishing_hud").fadeIn(200);
}

function closeUI() {
    $("#app").fadeOut(200);
    if (typeof GetParentResourceName === 'function') {
        $.post(`https://${GetParentResourceName()}/close`);
    }
}

$('.exit').click(function() {
    closeUI();
});

$(document).keyup(function(e) {
    if (e.key === "Escape") {
        closeUI();
    }
});
