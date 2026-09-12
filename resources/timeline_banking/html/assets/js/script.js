let hackActive = false;

window.addEventListener('message', function(event) {
    const item = event.data
    
    if (item.action == "openMenu") {
        history(item.history || [])
        $("#rpname").text(item.rpname || "N/A");
        $("#avatar").attr("src", item.avatar || "");
        $("#money").text(item.amount.toLocaleString("de-DE") + "$");  
        $(".form").fadeIn()   

        if (hackActive) {
            $(".content").hide()
            $(".content_hack").show()
        } else {
            $(".content").show()
            $(".content_hack").hide()
        }
    } else if (item.action == "updateMoney") {
        $("#money").text(item.amount.toLocaleString("de-DE") + "$");     
    } else if (item.action == "updateHistory") {
        history(item.history || [])
    } else if (item.action == "openHack") {
        hackActive = item.state;

        if (!item.state) {
            return closeUI();
        }

        $(".form").fadeIn()
        $(".content").hide()
        $(".content_hack").show()
        $(".progress").css("width", "0%");

        let progress = 0;
        const interval = setInterval(() => {
            progress += 100 / item.robTime;
            $(".progress").animate({ width: progress + "%" }, 200);

            if (progress >= 100) {
                clearInterval(interval);
                hackActive = false;
                closeUI();
            }
        }, 1000);
    }
})

$("#box_deposit").find(".button").click(function() {
    $.post(`https://${GetParentResourceName()}/action`, JSON.stringify({
        action: "deposit",
        amount: $("#box_deposit").find("input").val()
    }))
})

$("#box_withdraw").find(".button").click(function() {
    $.post(`https://${GetParentResourceName()}/action`, JSON.stringify({
        action: "withdraw",
        amount: $("#box_withdraw").find("input").val()
    }))
})

$("#box_transfer").find(".button").click(function() {
    $.post(`https://${GetParentResourceName()}/action`, JSON.stringify({
        action: "transfer",
        amount: $("#box_transfer").find("input").val(),
        target: $("#box_transfer").find("input").last().val()
    }))
})

function history(data) {
    $(".flex_wrap").empty()

    const historyData = {
        ["withdraw"]: {
            icon: `
            <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path opacity="0.4" d="M14.5 8.48248H6.49996C3.83329 8.48248 2.16663 10.1491 2.16663 12.8158V14.9742C2.16663 17.6492 3.83329 19.3158 6.49996 19.3158H14.4916C17.1583 19.3158 18.825 17.6491 18.825 14.9825V12.8158C18.8333 10.1491 17.1666 8.48248 14.5 8.48248Z" fill="black"/>
                <path d="M13.7334 11.3408L10.9417 14.1325C10.7 14.3741 10.3 14.3741 10.0584 14.1325L7.2667 11.3408C7.02503 11.0991 7.02503 10.6991 7.2667 10.4575C7.50837 10.2158 7.90837 10.2158 8.15003 10.4575L9.87503 12.1825V3.27415C9.87503 2.93248 10.1584 2.64915 10.5 2.64915C10.8417 2.64915 11.125 2.93248 11.125 3.27415V12.1825L12.85 10.4575C12.975 10.3325 13.1334 10.2741 13.2917 10.2741C13.45 10.2741 13.6084 10.3325 13.7334 10.4575C13.9834 10.6991 13.9834 11.0908 13.7334 11.3408Z" fill="black"/>
            </svg>
            `,
            name: "Abgehoben",
            symb: "-",
        },
        ["deposit"]: {
            icon: `
            <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path opacity="0.4" d="M6.50004 13.4825L14.5 13.4825C17.1667 13.4825 18.8334 11.8158 18.8334 9.14915L18.8334 6.99082C18.8334 4.31582 17.1667 2.64915 14.5 2.64915L6.50837 2.64915C3.84171 2.64915 2.17504 4.31582 2.17504 6.98248L2.17504 9.14915C2.16671 11.8158 3.83337 13.4825 6.50004 13.4825Z" fill="black"/>
                <path d="M7.26663 10.6242L10.0583 7.83248C10.3 7.59082 10.7 7.59082 10.9416 7.83248L13.7333 10.6242C13.975 10.8658 13.975 11.2658 13.7333 11.5075C13.4916 11.7492 13.0916 11.7492 12.85 11.5075L11.125 9.78249L11.125 18.6908C11.125 19.0325 10.8416 19.3158 10.5 19.3158C10.1583 19.3158 9.87497 19.0325 9.87497 18.6908L9.87497 9.78248L8.14997 11.5075C8.02497 11.6325 7.86663 11.6908 7.7083 11.6908C7.54997 11.6908 7.39163 11.6325 7.26663 11.5075C7.01663 11.2658 7.01663 10.8742 7.26663 10.6242Z" fill="black"/>
            </svg>
            `,
            name: "Einzahlung",
            symb: "+",
        },
        ["transfer"]: {
            icon: `
            <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path opacity="0.4" d="M8 6.98249L8 14.9825C8 17.6492 9.66667 19.3158 12.3333 19.3158L14.4917 19.3158C17.1667 19.3158 18.8333 17.6492 18.8333 14.9825L18.8333 6.99082C18.8333 4.32415 17.1667 2.65748 14.5 2.65748L12.3333 2.65748C9.66667 2.64915 8 4.31582 8 6.98249Z" fill="black"/>
                <path d="M10.8583 7.74915L13.65 10.5408C13.8916 10.7825 13.8916 11.1825 13.65 11.4241L10.8583 14.2158C10.6166 14.4575 10.2166 14.4575 9.97496 14.2158C9.73329 13.9741 9.73329 13.5741 9.97496 13.3325L11.7 11.6075L2.79163 11.6075C2.44996 11.6075 2.16663 11.3241 2.16663 10.9825C2.16663 10.6408 2.44996 10.3575 2.79163 10.3575L11.7 10.3575L9.97496 8.63248C9.84996 8.50748 9.79163 8.34915 9.79163 8.19081C9.79163 8.03248 9.84996 7.87415 9.97496 7.74915C10.2166 7.49915 10.6083 7.49915 10.8583 7.74915Z" fill="black"/>
            </svg>
            `,
            name: "Überweisung",
            symb: "-",
        },
        ["received"]: {
            icon: `
            <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path opacity="0.4" d="M6.50004 13.4825L14.5 13.4825C17.1667 13.4825 18.8334 11.8158 18.8334 9.14915L18.8334 6.99082C18.8334 4.31582 17.1667 2.64915 14.5 2.64915L6.50837 2.64915C3.84171 2.64915 2.17504 4.31582 2.17504 6.98248L2.17504 9.14915C2.16671 11.8158 3.83337 13.4825 6.50004 13.4825Z" fill="black"/>
                <path d="M7.26663 10.6242L10.0583 7.83248C10.3 7.59082 10.7 7.59082 10.9416 7.83248L13.7333 10.6242C13.975 10.8658 13.975 11.2658 13.7333 11.5075C13.4916 11.7492 13.0916 11.7492 12.85 11.5075L11.125 9.78249L11.125 18.6908C11.125 19.0325 10.8416 19.3158 10.5 19.3158C10.1583 19.3158 9.87497 19.0325 9.87497 18.6908L9.87497 9.78248L8.14997 11.5075C8.02497 11.6325 7.86663 11.6908 7.7083 11.6908C7.54997 11.6908 7.39163 11.6325 7.26663 11.5075C7.01663 11.2658 7.01663 10.8742 7.26663 10.6242Z" fill="black"/>
            </svg>	
            `,
            name: "Empfangen",
            symb: "+",
        },
    }

    data.forEach(function(item) {
        $(".flex_wrap").append(`
            <div class="trans_item flex alcn">
                <div class="trsic_box jlcn">
                    ${historyData[item.type] ? historyData[item.type].icon : ''}
                </div>
                <div class="flex_text clmn">
                    <span>${historyData[item.type] ? historyData[item.type].name : ''}</span>
                    <span>${item.date}</span>
                </div>
                <div class="trs_amount green jlcn">
                    <span>${historyData[item.type] ? historyData[item.type].symb : ''}${item.amount.toLocaleString("de-DE")}$</span>
                </div>
            </div>
        `);
    });
}

function closeUI() {
    $(".form").fadeOut()
    $.post(`https://${GetParentResourceName()}/exit`)
}

$(document).keyup(function(e) {
    if (e.key === "Escape") {
        closeUI();
    }
});