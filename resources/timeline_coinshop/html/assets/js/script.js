/* TimeLine - Final Shop Logic */

const app = new Vue({
    el: '#app',
    data: {
        visible: false, // Set to false by default for production
        title: "COINSHOP",
        description: "Willkommen im TimeLine COINSHOP, hier kannst du freiwillig das Projekt unterstützen.",
        coins: 0,
        currentCategory: "Imports",
        items: [],
        navItems: [
            { id: "Imports", label: "IMPORTS", icon: "car" },
            { id: "Helikopter", label: "HELIKOPTER", icon: "heli" },
            { id: "Sonstiges", label: "SONSTIGES", icon: "info" }
        ],
        popups: {
            balance: false,
            input: false
        },
        codeInput: "",
        inputPopup: {
            title: "",
            placeholder: "",
            inputType: "",
            oldPlate: "",
            value: ""
        }
    },
    computed: {
        filteredItems() {
            return this.items.filter(item => item.category === this.currentCategory);
        }
    },
    methods: {
        closeUI() {
            this.visible = false;
            $.post('https://timeline_coinshop/close', JSON.stringify({}));
        },
        switchCategory(id) {
            this.currentCategory = id;
            $.post('https://timeline_coinshop/categorySwitch', JSON.stringify({ page: id }));
        },
        buyItem(name) {
            $.post('https://timeline_coinshop/buy', JSON.stringify({ name: name }));
        },
        openBalancePopup() {
            this.popups.balance = true;
        },
        submitCode() {
            if (this.codeInput) {
                $.post('https://timeline_coinshop/charge', JSON.stringify({ code: this.codeInput }));
                this.codeInput = "";
                this.popups.balance = false;
            }
        },
        submitInput() {
            if (this.inputPopup.value && this.inputPopup.value.trim() !== '') {
                $.post('https://timeline_coinshop/submitInput', JSON.stringify({
                    inputType: this.inputPopup.inputType,
                    value: this.inputPopup.value.trim(),
                    oldPlate: this.inputPopup.oldPlate
                }));
                this.inputPopup.value = "";
                this.popups.input = false;
            }
        }
    }
});

$(document).ready(function () {
    window.addEventListener('message', function (event) {
        var a = event.data;
        switch (a.action) {
            case 'show':
                app.visible = true;
                app.coins = a.coins || 0;
                app.items = [];
                break;
            case 'setCoins':
                app.coins = a.coins;
                break;
            case 'insert':
                if (!app.items.some(i => i.name === a.name && i.category === a.category)) {
                    app.items.push({
                        type: a.type,
                        name: a.name,
                        label: a.label,
                        text: a.text,
                        price: a.price,
                        category: a.category || "Imports"
                    });
                }
                break;
            case 'openInput':
                app.inputPopup.title = a.title || 'EINGABE';
                app.inputPopup.placeholder = a.placeholder || '';
                app.inputPopup.inputType = a.inputType || '';
                app.inputPopup.oldPlate = a.oldPlate || '';
                app.inputPopup.value = '';
                app.popups.input = true;
                break;
            case 'close':
                app.closeUI();
                break;
        }
    });

    $(document).keydown(function(e) {
        if (e.keyCode == 27) { app.closeUI(); }
    });
});


$(document).keyup(function(e) {
    if (e.key === "Escape") {
        $.post('https://timeline_coinshop/close', JSON.stringify({}));
        $("body").hide();
    }
});
