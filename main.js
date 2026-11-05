(function () {
  var site = window.SITE || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // A linha persegue o dedo com um pequeno atraso, então clique e arraste não dão salto.
  function setupCompare(box) {
    var input = box.querySelector("input");
    var current = Number(input.value);
    var target = current;
    var lastTime = null;
    var frameId = null;

    function paint() { box.style.setProperty("--pos", current + "%"); }

    function follow(time) {
      var elapsed = lastTime === null ? 16 : time - lastTime;
      lastTime = time;
      current += (target - current) * (1 - Math.exp(-elapsed / 70));
      if (Math.abs(target - current) < 0.05) current = target;
      paint();
      frameId = current === target ? null : requestAnimationFrame(follow);
      if (frameId === null) lastTime = null;
    }

    function jump(value) {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
      lastTime = null;
      current = target = Number(value);
      input.value = value;
      paint();
    }

    function glide(value) {
      target = Number(value);
      if (reduceMotion) { jump(value); return; }
      if (frameId === null) frameId = requestAnimationFrame(follow);
    }

    input.addEventListener("input", function () { glide(input.value); });
    box.compare = {
      jump: jump,
      glide: function (value) { input.value = value; glide(value); },
    };
    paint();
  }

  // Movimento único ao carregar: mostra que a linha pode ser arrastada.
  function sweepCompare(box) {
    if (reduceMotion) return;
    var input = box.querySelector("input");
    var stopped = false;
    var startTime = null;
    var from = 82;
    var to = 50;
    var duration = 2000;
    function stop() { stopped = true; }
    input.addEventListener("pointerdown", stop);
    input.addEventListener("keydown", stop);
    function frame(time) {
      if (stopped) return;
      if (startTime === null) startTime = time;
      var t = Math.min((time - startTime) / duration, 1);
      var eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      box.compare.jump(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(frame);
    }
    box.compare.jump(from);
    setTimeout(function () { requestAnimationFrame(frame); }, 900);
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
    var active = null;

    // Fusão: uma cópia do par atual fica por cima e some quando o novo par está pronto.
    function crossfade() {
      var ghost = document.createElement("div");
      ghost.className = "compare-ghost";
      ghost.setAttribute("aria-hidden", "true");
      ghost.style.setProperty("--pos", box.style.getPropertyValue("--pos"));
      [after, before].forEach(function (image) {
        var copy = image.cloneNode();
        copy.removeAttribute("loading");
        copy.alt = "";
        ghost.appendChild(copy);
      });
      box.insertBefore(ghost, box.querySelector(".compare-tag"));
      return ghost;
    }

    function fadeOut(ghost) {
      var ready = [before, after].map(function (image) {
        return image.decode().catch(function () {});
      });
      var limit = new Promise(function (resolve) { setTimeout(resolve, 500); });
      Promise.race([Promise.all(ready), limit]).then(function () {
        ghost.animate({ opacity: [1, 0] }, { duration: 700, easing: "ease" }).onfinish = function () {
          ghost.remove();
        };
      });
    }

    function show(index) {
      var photo = photos[index];
      var changing = active !== null && active !== index;
      var ghost = changing ? crossfade() : null;
      active = index;
      if (ghost || before.getAttribute("src") !== photo.antes) {
        before.src = photo.antes;
        after.src = photo.depois;
      }
      before.alt = "Volante do " + photo.carro + " antes: " + photo.tipo.toLowerCase();
      after.alt = "Volante do " + photo.carro + " depois do revestimento";
      box.compare.glide(50);
      if (ghost) fadeOut(ghost);
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

  // Abre e fecha cada dúvida pela altura. Clicar no meio do movimento inverte sem salto.
  function setupFaq() {
    if (reduceMotion) return;
    document.querySelectorAll(".faq details").forEach(function (item) {
      var summary = item.querySelector("summary");
      var text = item.querySelector("p");
      var running = null;

      summary.addEventListener("click", function (event) {
        event.preventDefault();
        var from = item.offsetHeight;
        var closing = item.open && !item.classList.contains("closing");
        if (running) running.cancel();
        item.open = true;
        item.classList.toggle("closing", closing);
        var to = closing ? summary.offsetHeight : item.offsetHeight;
        var slide = item.animate(
          { height: [from + "px", to + "px"] },
          { duration: closing ? 380 : 480, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        );
        item.style.overflow = "hidden";
        running = slide;
        if (!closing) text.animate({ opacity: [0, 1] }, { duration: 520, easing: "ease" });
        slide.onfinish = function () {
          running = null;
          item.style.overflow = "";
          item.classList.remove("closing");
          if (closing) item.open = false;
        };
      });
    });
  }

  // Entrada discreta das seções, uma vez só. Sem JS, tudo já aparece.
  function setupReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
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
      item.style.transitionDelay = Math.min(siblings.indexOf(item), 3) * 110 + "ms";
      observer.observe(item);
    });
  }

  document.querySelectorAll("[data-compare]").forEach(setupCompare);
  setupResults();
  sweepCompare(document.querySelector("[data-hero-compare]"));
  setupContacts();
  setupQuotes();
  setupFaq();
  setupReveal();
})();
