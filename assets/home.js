(function () {
  "use strict";

  var EBAY = "https://ebay.io/m/q7AtVq";
  var DISCORD = "https://discord.gg/rBUBQ8RpH";
  var BADGES = { "Pre-order watch": true, "Allocation": true };
  var CTAS = { "Watch Discord": DISCORD, "See on eBay": EBAY };
  var LANG = { EN: "English", JP: "Japanese", CN: "Simplified Chinese", SC: "Simplified Chinese" };

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function renderPreorders(data) {
    var empty = document.getElementById("preorder-empty");
    var strip = document.getElementById("preorder-strip");
    if (!empty || !strip) return;
    var list = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
    var cards = list.map(preorderCard).filter(Boolean);
    if (!cards.length) return;
    clear(strip);
    cards.forEach(function (card) { strip.appendChild(card); });
    strip.hidden = false;
    strip.tabIndex = 0;
    strip.setAttribute("aria-label", "Pre-order watches");
    empty.hidden = true;
  }

  function preorderCard(item) {
    if (!item || typeof item !== "object") return null;
    var name = typeof item.name === "string" ? item.name.trim() : "";
    if (!name || name.length > 80 || /\$|add\s*to\s*cart/i.test(name)) return null;
    if (!BADGES[item.badge] || !CTAS[item.cta]) return null;

    var card = document.createElement("article");
    card.className = "preorder-card";
    var badge = document.createElement("span");
    badge.className = "watch-badge";
    badge.textContent = item.badge;
    var title = document.createElement("h3");
    title.textContent = name;
    var link = document.createElement("a");
    link.className = "button secondary";
    link.href = CTAS[item.cta];
    link.textContent = item.cta;
    card.appendChild(badge);
    card.appendChild(title);
    card.appendChild(link);
    return card;
  }

  function safeSrc(src) {
    return /^assets\/products\/[a-z0-9.-]+\.(webp|png|jpe?g)$/i.test(src || "") ? src : "";
  }

  function qtyNumber(item) {
    var node = item.querySelector(".stock-qty b");
    if (!node) return "";
    var value = node.textContent.trim();
    return /^\d+$/.test(value) ? value : "";
  }

  function mediaFrom(item, name) {
    var media = document.createElement("div");
    media.className = "stock-media";
    var image = item.querySelector(".stock-media img");
    var src = image ? safeSrc(image.getAttribute("src")) : "";
    if (src) {
      var img = document.createElement("img");
      img.src = src;
      img.alt = image.getAttribute("alt") || name;
      img.loading = "lazy";
      img.decoding = "async";
      if (image.getAttribute("width")) img.width = image.getAttribute("width");
      if (image.getAttribute("height")) img.height = image.getAttribute("height");
      media.appendChild(img);
    } else {
      var ph = item.querySelector(".ph");
      var hold = document.createElement("div");
      hold.className = "ph";
      hold.setAttribute("role", "img");
      hold.setAttribute("aria-label", (ph && ph.getAttribute("aria-label")) || name);
      ["ph-mark", "ph-type", "ph-set"].forEach(function (cls) {
        var source = ph && ph.querySelector("." + cls);
        var span = document.createElement("span");
        span.className = cls;
        span.textContent = source ? source.textContent : (cls === "ph-mark" ? "GP" : "");
        hold.appendChild(span);
      });
      media.appendChild(hold);
    }

    var badges = document.createElement("div");
    badges.className = "stock-badges";
    item.querySelectorAll(".stock-badges .badge").forEach(function (badge) {
      var label = badge.textContent.trim();
      if (label !== "CASE" && !LANG[label]) return;
      var span = document.createElement("span");
      span.className = label === "CASE" ? "badge badge-case" : "badge badge-lang";
      span.textContent = label;
      if (LANG[label]) span.title = LANG[label];
      badges.appendChild(span);
    });
    if (badges.childNodes.length) media.appendChild(badges);
    return media;
  }

  function inHandCard(item) {
    var nameNode = item.querySelector(".stock-name");
    var name = nameNode ? nameNode.textContent.trim() : "";
    if (!name || /\$|add\s*to\s*cart/i.test(name)) return null;
    var card = document.createElement("li");
    card.className = "inhand-card";
    card.appendChild(mediaFrom(item, name));

    var body = document.createElement("div");
    body.className = "stock-body";
    var title = document.createElement("div");
    title.className = "stock-name";
    title.textContent = name;
    body.appendChild(title);

    var qty = qtyNumber(item);
    if (qty) {
      var qtyEl = document.createElement("div");
      qtyEl.className = "stock-qty";
      qtyEl.setAttribute("aria-label", "Quantity " + qty);
      qtyEl.appendChild(document.createTextNode("Qty "));
      var strong = document.createElement("b");
      strong.textContent = qty;
      qtyEl.appendChild(strong);
      body.appendChild(qtyEl);
    }

    var link = document.createElement("a");
    link.className = "card-cta";
    link.href = EBAY;
    link.textContent = "See on eBay";
    body.appendChild(link);
    card.appendChild(body);
    return card;
  }

  function bindCarousel(track) {
    var prev = document.getElementById("inhand-prev");
    var next = document.getElementById("inhand-next");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function step(direction) {
      var card = track.querySelector(".inhand-card");
      var width = card ? card.getBoundingClientRect().width + 14 : 240;
      track.scrollBy({ left: direction * width, behavior: reduce ? "auto" : "smooth" });
    }

    function atStart() { return track.scrollLeft <= 2; }
    function atEnd() { return track.scrollLeft + track.clientWidth >= track.scrollWidth - 2; }

    function paint() {
      if (prev) prev.setAttribute("aria-disabled", atStart() ? "true" : "false");
      if (next) next.setAttribute("aria-disabled", atEnd() ? "true" : "false");
    }

    function onControl(button, direction) {
      if (!button) return;
      button.addEventListener("click", function () {
        if (button.getAttribute("aria-disabled") === "true") return;
        step(direction);
      });
    }

    onControl(prev, -1);
    onControl(next, 1);
    track.addEventListener("scroll", paint, { passive: true });
    track.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") { event.preventDefault(); step(1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
    });
    window.addEventListener("resize", paint);
    paint();
  }

  function renderInHand(html) {
    var section = document.getElementById("in-hand");
    var track = document.getElementById("inhand-track");
    if (!section || !track) return;
    var doc = new DOMParser().parseFromString(html, "text/html");
    var cards = Array.prototype.map.call(doc.querySelectorAll(".stock-item"), inHandCard).filter(Boolean);
    if (!cards.length) return;
    clear(track);
    cards.forEach(function (card) { track.appendChild(card); });
    section.hidden = false;
    bindCarousel(track);
  }

  fetch("preorders.json")
    .then(function (response) { return response.ok ? response.json() : []; })
    .then(renderPreorders)
    .catch(function () {});

  fetch("stock.html")
    .then(function (response) { return response.ok ? response.text() : ""; })
    .then(renderInHand)
    .catch(function () {});
})();
