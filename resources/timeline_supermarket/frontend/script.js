(() => {
  const state = {
    isOpen: false,
    items: [],
    basket: {},
    activeCategory: 'all',
    searchQuery: ''
  };

  function sendNui(eventName, data) {
    const payload = data ?? {};
    try {
      const resName = (typeof GetParentResourceName === "function") ? GetParentResourceName() : null;
      if (!resName) return;

      fetch(`https://${resName}/${eventName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify(payload)
      }).then(res => res.ok ? res.json() : null).catch(() => null);
    } catch (e) {}
  }

  const appWrapper = document.getElementById("app");
  const closeBtn = document.getElementById("closeBtn");
  const itemGrid = document.getElementById("itemGrid");
  const cartList = document.getElementById("cartList");
  const totalPrice = document.getElementById("totalPrice");
  const buyCash = document.getElementById("buyCash");
  const buyBank = document.getElementById("buyBank");
  const searchInput = document.getElementById("searchInput");
  const catTabs = document.getElementById("catTabs");

  function setBodyOpen(open) {
    state.isOpen = open;
    if (appWrapper) {
      if (open) {
        appWrapper.classList.add("visible");
      } else {
        appWrapper.classList.remove("visible");
        sendNui("escape", {});
      }
    }
  }

  function setItemImg(imgElement, name, label) {
    const candidates = [
      `img/${name}.png`,
      `img/${(name || '').toLowerCase()}.png`,
      `img/${label}.png`,
      `img/${(label || '').toLowerCase()}.png`,
      "img/repairkit.png",
      "img/sandwich.png"
    ];
    let idx = 0;
    function tryNext() {
      if (idx < candidates.length) {
        imgElement.src = candidates[idx++];
      }
    }
    imgElement.onerror = tryNext;
    tryNext();
  }

  function calcTotal() {
    let total = 0;
    state.items.forEach(item => {
      const qty = state.basket[item.name] || 0;
      total += (item.price || 0) * qty;
    });
    return total;
  }

  function renderCart() {
    if (!cartList) return;
    cartList.innerHTML = "";

    const basketItems = [];
    state.items.forEach(item => {
      const qty = state.basket[item.name] || 0;
      if (qty > 0) {
        basketItems.push({ item: item, qty: qty });
      }
    });

    if (basketItems.length === 0) {
      const emptyMsg = document.createElement("div");
      emptyMsg.className = "cartEmpty";
      emptyMsg.textContent = "Dein Warenkorb ist leer.";
      cartList.appendChild(emptyMsg);
    } else {
      basketItems.forEach(entry => {
        const row = document.createElement("div");
        row.className = "cartItemRow";

        const left = document.createElement("div");
        left.className = "cartItemLeft";

        const img = document.createElement("img");
        img.className = "cartItemImg";
        setItemImg(img, entry.item.name, entry.item.label);

        const details = document.createElement("div");
        details.className = "cartItemDetails";

        const title = document.createElement("div");
        title.className = "cartItemTitle";
        title.textContent = entry.item.label || entry.item.name;

        const price = document.createElement("div");
        price.className = "cartItemPrice";
        price.textContent = "$" + (entry.item.price * entry.qty);

        details.appendChild(title);
        details.appendChild(price);
        left.appendChild(img);
        left.appendChild(details);

        const right = document.createElement("div");
        right.className = "cartItemRight";

        const minusBtn = document.createElement("button");
        minusBtn.className = "cartQtyBtn";
        minusBtn.textContent = "-";
        minusBtn.addEventListener("click", () => {
          if (state.basket[entry.item.name] > 1) {
            state.basket[entry.item.name]--;
          } else {
            delete state.basket[entry.item.name];
          }
          renderCart();
        });

        const count = document.createElement("div");
        count.className = "cartQtyCount";
        count.textContent = entry.qty;

        const plusBtn = document.createElement("button");
        plusBtn.className = "cartQtyBtn";
        plusBtn.textContent = "+";
        plusBtn.addEventListener("click", () => {
          state.basket[entry.item.name]++;
          renderCart();
        });

        const removeBtn = document.createElement("button");
        removeBtn.className = "cartRemoveBtn";
        removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        removeBtn.addEventListener("click", () => {
          delete state.basket[entry.item.name];
          renderCart();
        });

        right.appendChild(minusBtn);
        right.appendChild(count);
        right.appendChild(plusBtn);
        right.appendChild(removeBtn);

        row.appendChild(left);
        row.appendChild(right);
        cartList.appendChild(row);
      });
    }

    if (totalPrice) {
      totalPrice.textContent = "$" + calcTotal();
    }
  }

  function renderCatalog() {
    if (!itemGrid) return;
    itemGrid.innerHTML = "";

    const filtered = state.items.filter(item => {
      const matchCat = (state.activeCategory === 'all' || (item.category || '').toLowerCase() === state.activeCategory.toLowerCase());
      const query = (state.searchQuery || '').toLowerCase().trim();
      const matchQuery = !query || (item.label || item.name).toLowerCase().includes(query);
      return matchCat && matchQuery;
    });

    filtered.forEach(item => {
      const card = document.createElement("div");
      card.className = "itemCard";

      const header = document.createElement("div");
      header.className = "itemCardHeader";

      const titleGroup = document.createElement("div");
      titleGroup.className = "itemCardTitleGroup";

      const name = document.createElement("div");
      name.className = "itemCardName";
      name.textContent = item.label || item.name;

      const cat = document.createElement("div");
      cat.className = "itemCardCat";
      cat.textContent = item.category || 'Items';

      titleGroup.appendChild(name);
      titleGroup.appendChild(cat);

      const price = document.createElement("div");
      price.className = "itemCardPrice";
      price.textContent = "$" + item.price;

      header.appendChild(titleGroup);
      header.appendChild(price);

      const img = document.createElement("img");
      img.className = "itemCardImage";
      setItemImg(img, item.name, item.label);

      const addBtn = document.createElement("button");
      addBtn.className = "addCartBtn";
      addBtn.type = "button";
      addBtn.innerHTML = 'In den Warenkorb <i class="fa-solid fa-cart-shopping"></i>';
      addBtn.addEventListener("click", () => {
        state.basket[item.name] = (state.basket[item.name] || 0) + 1;
        renderCart();
      });

      card.appendChild(header);
      card.appendChild(img);
      card.appendChild(addBtn);

      itemGrid.appendChild(card);
    });
  }

  function getBasketArray() {
    const list = [];
    for (const name in state.basket) {
      if (state.basket[name] > 0) {
        list.push({ name: name, count: state.basket[name], amount: state.basket[name] });
      }
    }
    return list;
  }

  function buy(method) {
    const basket = getBasketArray();
    if (basket.length === 0) return;

    sendNui("buyItems", { method: method, basket: basket });
    setBodyOpen(false);
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      renderCatalog();
    });
  }

  if (catTabs) {
    catTabs.addEventListener("click", (e) => {
      const target = e.target.closest(".catTab");
      if (!target) return;
      const buttons = catTabs.querySelectorAll(".catTab");
      buttons.forEach(btn => btn.classList.remove("active"));
      target.classList.add("active");
      state.activeCategory = target.dataset.cat || 'all';
      renderCatalog();
    });
  }

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data) return;

    if (data.action === "show") {
      state.items = data.data || [];
      state.basket = {};
      state.searchQuery = '';
      state.activeCategory = 'all';
      if (searchInput) searchInput.value = '';

      if (catTabs) {
        const buttons = catTabs.querySelectorAll(".catTab");
        buttons.forEach(btn => {
          if (btn.dataset.cat === 'all') btn.classList.add("active");
          else btn.classList.remove("active");
        });
      }

      renderCatalog();
      renderCart();
      setBodyOpen(true);
    } else if (data.action === "hide") {
      setBodyOpen(false);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.isOpen) {
      setBodyOpen(false);
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      setBodyOpen(false);
    });
  }

  if (buyCash) {
    buyCash.addEventListener("click", () => buy("cash"));
  }

  if (buyBank) {
    buyBank.addEventListener("click", () => buy("bank"));
  }
})();
