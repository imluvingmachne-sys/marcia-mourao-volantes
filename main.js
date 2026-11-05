(function () {
  var site = window.SITE || {};
  var SVG_NS = "http://www.w3.org/2000/svg";

  // Geometria do volante ilustrado no cartão do topo.
  var CX = 320;
  var CY = 360;
  var RIM = 256;

  function polar(radius, degrees) {
    var radians = (degrees - 90) * Math.PI / 180;
    return [CX + radius * Math.cos(radians), CY + radius * Math.sin(radians)];
  }

  function svgEl(name, attrs) {
    var el = document.createElementNS(SVG_NS, name);
    Object.keys(attrs).forEach(function (key) { el.setAttribute(key, attrs[key]); });
    return el;
  }

  function drawWheelBase(group, colors) {
    group.appendChild(svgEl("rect", { width: 640, height: 720, fill: "#1C1C1C" }));
    group.appendChild(svgEl("path", { d: "M0 0 H640 V190 C 470 130, 170 130, 0 190 Z", fill: "#141414" }));
    [
      "M250 320 L80 310 L80 410 L255 420 Z",
      "M390 320 L560 310 L560 410 L385 420 Z",
      "M285 420 L255 590 L385 590 L355 420 Z",
    ].forEach(function (d) {
      group.appendChild(svgEl("path", { d: d, fill: colors.spoke }));
    });
    group.appendChild(svgEl("circle", {
      cx: CX, cy: CY, r: RIM, fill: "none", stroke: colors.rim, "stroke-width": 74,
    }));
  }

  function drawHub(group, colors) {
    group.appendChild(svgEl("circle", { cx: CX, cy: CY, r: 92, fill: colors.hub }));
    group.appendChild(svgEl("circle", {
      cx: CX, cy: CY, r: 78, fill: "none", stroke: "#3A3A38", "stroke-width": 2,
    }));
    var mark = svgEl("text", { x: CX, y: CY + 21, "text-anchor": "middle", class: "hub-mark", fill: colors.mark });
    mark.textContent = "VE";
    group.appendChild(mark);
  }

  // Volante restaurado: couro perfurado nas laterais e costura amarela.
  function drawWheelAfter(group) {
    var colors = { spoke: "#242422", rim: "#000000", hub: "#000000", mark: "#FFD400" };
    drawWheelBase(group, colors);
    [[62, 118], [242, 298]].forEach(function (arc) {
      [228, 284].forEach(function (radius) {
        for (var angle = arc[0]; angle <= arc[1]; angle += 2.4) {
          var dot = polar(radius, angle);
          group.appendChild(svgEl("circle", {
            cx: dot[0].toFixed(1), cy: dot[1].toFixed(1), r: 2.6, fill: "#4A4A47",
          }));
        }
      });
    });
    group.appendChild(svgEl("circle", {
      cx: CX, cy: CY, r: RIM, fill: "none", stroke: "#2E2E2E", "stroke-width": 2,
    }));
    var total = 110;
    for (var i = 0; i < total; i++) {
      var angle = i * 360 / total;
      var start = polar(RIM - 13, angle);
      var end = polar(RIM + 13, angle + 1.2);
      group.appendChild(svgEl("line", {
        x1: start[0].toFixed(1), y1: start[1].toFixed(1),
        x2: end[0].toFixed(1), y2: end[1].toFixed(1),
        stroke: "#FFD400", "stroke-width": 4.5, "stroke-linecap": "round",
      }));
    }
    drawHub(group, colors);
  }

  // Volante gasto: revestimento descascado mostrando a espuma por baixo.
  function drawWheelBefore(group) {
    var colors = { spoke: "#2B2A28", rim: "#34322E", hub: "#232220", mark: "#8A8266" };
    drawWheelBase(group, colors);
    var seed = 7;
    function random() {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    }
    for (var i = 0; i < 62; i++) {
      var center = polar(RIM + (random() - .5) * 52, random() * 360);
      var size = 5 + random() * 15;
      var points = [];
      for (var p = 0; p < 9; p++) {
        var angle = p * Math.PI * 2 / 9;
        var radius = size * (.55 + random() * .75);
        points.push((center[0] + radius * Math.cos(angle)).toFixed(1) + "," + (center[1] + radius * Math.sin(angle)).toFixed(1));
      }
      group.appendChild(svgEl("polygon", {
        points: points.join(" "), fill: "#9A8B6C", stroke: "#5F5544", "stroke-width": 1.5,
      }));
    }
    drawHub(group, colors);
  }

  function setupCompare(box) {
    var input = box.querySelector("input");
    function update() { box.style.setProperty("--pos", input.value + "%"); }
    input.addEventListener("input", update);
    update();
  }

  // Movimento único ao carregar: mostra que o cartão pode ser arrastado.
  function sweepCompare(box) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var input = box.querySelector("input");
    var stopped = false;
    var startTime = null;
    var from = 84;
    var to = 50;
    var duration = 1500;
    function stop() { stopped = true; }
    input.addEventListener("pointerdown", stop);
    input.addEventListener("keydown", stop);
    function frame(time) {
      if (stopped) return;
      if (startTime === null) startTime = time;
      var t = Math.min((time - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      input.value = from + (to - from) * eased;
      box.style.setProperty("--pos", input.value + "%");
      if (t < 1) requestAnimationFrame(frame);
    }
    input.value = from;
    box.style.setProperty("--pos", from + "%");
    setTimeout(function () { requestAnimationFrame(frame); }, 350);
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
    document.querySelectorAll("[data-cidade]").forEach(function (el) {
      if (site.cidade) el.textContent = site.cidade;
      else el.closest("li").hidden = true;
    });

    if (site.instagram) {
      var instagram = document.querySelector("[data-instagram]");
      instagram.href = "https://instagram.com/" + encodeURIComponent(site.instagram);
      instagram.hidden = false;
    }
  }

  function addPhotos(box, photo) {
    [["depois", photo.depois, "compare-layer"], ["antes", photo.antes, "compare-layer compare-before"]].forEach(function (item) {
      var img = document.createElement("img");
      img.className = item[2];
      img.src = item[1];
      img.alt = "Volante " + item[0] + " da restauração" + (photo.carro ? ", " + photo.carro : "");
      box.insertBefore(img, box.querySelector(".compare-tag"));
    });
  }

  function setupHero() {
    var box = document.querySelector("[data-hero-compare]");
    if (site.destaque) {
      box.querySelectorAll("svg").forEach(function (svg) { svg.remove(); });
      addPhotos(box, site.destaque);
      document.querySelector("[data-destaque-nome]").textContent = site.destaque.carro || "";
    } else {
      drawWheelAfter(box.querySelector('[data-wheel="depois"]'));
      drawWheelBefore(box.querySelector('[data-wheel="antes"]'));
    }
    sweepCompare(box);
  }

  function setupGallery() {
    var photos = site.fotos || [];
    if (!photos.length) return;
    var grid = document.querySelector("[data-gallery]");
    photos.forEach(function (photo) {
      var figure = document.createElement("figure");
      var box = document.createElement("div");
      box.className = "compare";
      var tag = document.createElement("span");
      tag.className = "compare-tag compare-tag-before";
      tag.textContent = "Antes";
      var tagAfter = document.createElement("span");
      tagAfter.className = "compare-tag compare-tag-after";
      tagAfter.textContent = "Depois";
      box.appendChild(tag);
      box.appendChild(tagAfter);
      addPhotos(box, photo);
      var handle = document.createElement("span");
      handle.className = "compare-handle";
      var input = document.createElement("input");
      input.type = "range";
      input.min = 0;
      input.max = 100;
      input.value = 50;
      input.setAttribute("aria-label", "Comparar antes e depois" + (photo.carro ? " do " + photo.carro : ""));
      box.appendChild(handle);
      box.appendChild(input);
      figure.appendChild(box);
      if (photo.carro) {
        var caption = document.createElement("figcaption");
        caption.textContent = photo.carro;
        figure.appendChild(caption);
      }
      grid.appendChild(figure);
      setupCompare(box);
    });
    grid.closest("section").hidden = false;
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

  setupHero();
  document.querySelectorAll("[data-compare]").forEach(setupCompare);
  setupContacts();
  setupGallery();
  setupQuotes();
})();
