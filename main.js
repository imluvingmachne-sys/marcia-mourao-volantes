(function () {
  var site = window.SITE || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setPosition(box, value) {
    box.querySelector("input").value = value;
    box.style.setProperty("--pos", value + "%");
  }

  function setupCompare(box) {
    var input = box.querySelector("input");
    input.addEventListener("input", function () { setPosition(box, input.value); });
    setPosition(box, input.value);
  }

  // Movimento único ao carregar: mostra que a linha pode ser arrastada.
  function sweepCompare(box) {
    if (reduceMotion) return;
    var input = box.querySelector("input");
    var stopped = false;
    var startTime = null;
    var from = 82;
    var to = 50;
    var duration = 1400;
    function stop() { stopped = true; }
    input.addEventListener("pointerdown", stop);
    input.addEventListener("keydown", stop);
    function frame(time) {
      if (stopped) return;
      if (startTime === null) startTime = time;
      var t = Math.min((time - startTime) / duration, 1);
      setPosition(box, from + (to - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(frame);
    }
    setPosition(box, from);
    setTimeout(function () { requestAnimationFrame(frame); }, 500);
  }

  function setupContacts() {
    var number = String(site.whatsapp || "").replace(/\D/g, "");
    document.querySelectorAll("[data-wa]").forEach(function (link) {
      if (number) {
        link.href = "https://wa.me/" + number + "?text=" + encodeURIComponent(link.dataset.wa);
        link.target = "_blank";
        link.rel = "noopener";
      } else if (link.classList.contains("wa-float")) {
        link.hidden = true;
      } else {
        link.textContent = "WhatsApp em breve";
        link.removeAttribute("href");
        link.setAttribute("aria-disabled", "true");
      }
    });

    document.querySelectorAll("[data-cidade-sufixo]").forEach(function (el) {
      el.textContent = site.cidade ? " em " + site.cidade : "";
    });

    if (site.instagram) {
      var instagram = document.querySelector("[data-instagram]");
      instagram.href = "https://instagram.com/" + encodeURIComponent(site.instagram);
      instagram.hidden = false;
    }
  }

  // Seção Resultados: uma foto grande e a lista de carros que troca o par.
  function setupResults() {
    var photos = site.fotos || [];
    var section = document.getElementById("resultados");
    if (!photos.length) { section.hidden = true; return; }

    var box = document.querySelector("[data-gallery-compare]");
    var list = document.querySelector("[data-car-list]");
    var before = box.querySelector("[data-antes]");
    var after = box.querySelector("[data-depois]");
    var buttons = [];

    function show(index) {
      var photo = photos[index];
      before.src = photo.antes;
      after.src = photo.depois;
      before.alt = "Volante do " + photo.carro + " antes: " + photo.tipo.toLowerCase();
      after.alt = "Volante do " + photo.carro + " depois do revestimento";
      setPosition(box, 50);
      buttons.forEach(function (button, i) {
        button.setAttribute("aria-pressed", i === index ? "true" : "false");
      });
    }

    photos.forEach(function (photo, index) {
      var button = document.createElement("button");
      var name = document.createElement("strong");
      var type = document.createElement("span");
      button.type = "button";
      name.textContent = photo.carro;
      type.textContent = photo.tipo;
      button.appendChild(name);
      button.appendChild(type);
      button.addEventListener("click", function () { show(index); });
      list.appendChild(button);
      buttons.push(button);
      if (index > 0) { new Image().src = photo.depois; new Image().src = photo.antes; }
    });

    show(0);
  }

  function setupQuotes() {
    var quotes = site.depoimentos || [];
    if (!quotes.length) return;
    var grid = document.querySelector("[data-quotes]");
    quotes.forEach(function (quote) {
      var block = document.createElement("blockquote");
      var text = document.createElement("p");
      var name = document.createElement("cite");
      text.textContent = quote.texto;
      name.textContent = quote.nome;
      block.appendChild(text);
      block.appendChild(name);
      grid.appendChild(block);
    });
    grid.closest("section").hidden = false;
  }

  // Entrada discreta das seções, uma vez só. Sem JS, tudo já aparece.
  function setupReveal() {
    var items = document.querySelectorAll(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (item) { item.classList.add("in"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (item) {
      var siblings = Array.prototype.filter.call(item.parentElement.children, function (el) {
        return el.classList.contains("reveal");
      });
      item.style.transitionDelay = Math.min(siblings.indexOf(item), 3) * 70 + "ms";
      observer.observe(item);
    });
  }

  document.querySelectorAll("[data-compare]").forEach(setupCompare);
  setupResults();
  sweepCompare(document.querySelector("[data-hero-compare]"));
  setupContacts();
  setupQuotes();
  setupReveal();
})();
