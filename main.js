(function () {
  var site = window.SITE || {};
  var SVG_NS = "http://www.w3.org/2000/svg";
  var CENTER = 400;

  function polar(radius, degrees) {
    var radians = (degrees - 90) * Math.PI / 180;
    return [CENTER + radius * Math.cos(radians), CENTER + radius * Math.sin(radians)];
  }

  function svgEl(name, attrs) {
    var el = document.createElementNS(SVG_NS, name);
    Object.keys(attrs).forEach(function (key) { el.setAttribute(key, attrs[key]); });
    return el;
  }

  // Costura do aro: cada ponto entra em sequência, a partir do topo.
  function drawStitches() {
    var group = document.getElementById("wheel-stitches");
    var total = 132;
    for (var i = 0; i < total; i++) {
      var angle = i * 360 / total;
      var start = polar(316, angle);
      var end = polar(344, angle + 1.1);
      var stitch = svgEl("line", {
        x1: start[0].toFixed(1), y1: start[1].toFixed(1),
        x2: end[0].toFixed(1), y2: end[1].toFixed(1),
        class: "stitch",
      });
      stitch.style.animationDelay = (250 + i * 16) + "ms";
      group.appendChild(stitch);
    }
  }

  // Couro perfurado nas laterais do aro, nas posições 3h e 9h.
  function drawHoles() {
    var group = document.getElementById("wheel-holes");
    [[62, 118], [242, 298]].forEach(function (arc) {
      [298, 362].forEach(function (radius) {
        for (var angle = arc[0]; angle <= arc[1]; angle += 1.9) {
          var point = polar(radius, angle);
          group.appendChild(svgEl("circle", {
            cx: point[0].toFixed(1), cy: point[1].toFixed(1), r: 3, class: "hole",
          }));
        }
      });
    });
  }

  // Lascas do revestimento gasto, espalhadas ao longo do aro da ilustração.
  function drawFlakes() {
    var group = document.getElementById("flakes");
    var seed = 7;
    function random() {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    }
    function curve(t, a, b, c, d) {
      var u = 1 - t;
      return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
    }
    for (var i = 0; i < 46; i++) {
      var t = random();
      var x = curve(t, -40, 90, 400, 700) + (random() - .5) * 110;
      var y = curve(t, 560, 150, 40, 90) + (random() - .5) * 110;
      var size = 8 + random() * 34;
      var points = [];
      for (var p = 0; p < 9; p++) {
        var angle = p * Math.PI * 2 / 9;
        var radius = size * (.55 + random() * .75);
        points.push((x + radius * 1.5 * Math.cos(angle)).toFixed(1) + "," + (y + radius * Math.sin(angle)).toFixed(1));
      }
      group.appendChild(svgEl("polygon", { points: points.join(" "), class: "flake" }));
    }
  }

  function setupCompare(box) {
    var input = box.querySelector("input");
    function update() { box.style.setProperty("--pos", input.value + "%"); }
    input.addEventListener("input", update);
    update();
  }

  function setupContacts() {
    var number = String(site.whatsapp || "").replace(/\D/g, "");
    document.querySelectorAll("[data-wa]").forEach(function (link) {
      if (number) {
        link.href = "https://wa.me/" + number + "?text=" + encodeURIComponent(link.dataset.wa);
        link.target = "_blank";
        link.rel = "noopener";
      } else {
        link.textContent = "WhatsApp em breve";
        link.removeAttribute("href");
        link.setAttribute("aria-disabled", "true");
      }
    });

    if (site.cidade) {
      document.querySelectorAll("[data-cidade-sufixo]").forEach(function (el) {
        el.textContent = " em " + site.cidade;
      });
    }

    if (site.instagram) {
      var instagram = document.querySelector("[data-instagram]");
      instagram.href = "https://instagram.com/" + encodeURIComponent(site.instagram);
      instagram.hidden = false;
    }
  }

  function setupGallery() {
    var photos = site.fotos || [];
    if (!photos.length) return;
    var grid = document.querySelector("[data-gallery]");
    photos.forEach(function (photo) {
      var figure = document.createElement("figure");
      var box = document.createElement("div");
      box.className = "compare";
      [["depois", photo.depois, "compare-layer"], ["antes", photo.antes, "compare-layer compare-before"]].forEach(function (item) {
        var img = document.createElement("img");
        img.className = item[2];
        img.src = item[1];
        img.alt = "Volante " + item[0] + " da restauração" + (photo.carro ? ", " + photo.carro : "");
        img.loading = "lazy";
        box.appendChild(img);
      });
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

  drawHoles();
  drawStitches();
  drawFlakes();
  document.querySelectorAll("[data-compare]").forEach(setupCompare);
  setupContacts();
  setupGallery();
  setupQuotes();
})();
