/* =====================================================================
   All text and pictures live in the /content folder and are edited at
   yoursite.com/admin. You shouldn't need to change this file, apart
   from the one-time form setup below.
   ===================================================================== */

// Free key from https://web3forms.com (enter the email that should
// receive commission requests). Leave "" until it's set up.
const FORM_ACCESS_KEY = "";

/* ===================================================================== */

// ---- helpers ----
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = id => document.getElementById(id);
const getJSON = path => fetch(path, { cache: "no-cache" }).then(r => r.ok ? r.json() : {}).catch(() => ({}));

// ---- painted placeholder generator (shown wherever no photo is set) ----
const PALETTES = {
  watercolor:   [["#7fa7c9", "#e8a87c", "#c9d6a3", "#f3d9a4"], ["#9bb7d4", "#d98e73", "#a6c3a0"], ["#e6a6a1", "#f2cf9b", "#8fb3c7", "#b7c9a8"]],
  charcoal:     [["#2e2d2b", "#5a5854", "#8c8984", "#bdb9b2"]],
  illustration: [["#f2b5a7", "#9cc9b6", "#f6d28b", "#8fa8d8"], ["#e98f73", "#7fb7a4", "#f4c96b", "#6d8fc4"]],
};
let uid = 0;
function hash(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
function rng(seed) { return () => ((seed = Math.imul(seed ^ (seed >>> 15), 2246822507) + 0x9e3779b9 >>> 0) / 4294967296); }

function placeholderSVG(seedText, kind = "watercolor", ratio = "4/5") {
  const [rw, rh] = ratio.split("/").map(Number);
  const W = 400, H = Math.round(400 * rh / rw);
  const r = rng(hash(seedText));
  const pals = PALETTES[kind] || PALETTES.watercolor;
  const pal = pals[Math.floor(r() * pals.length)];
  const id = "f" + (++uid);
  const bg = kind === "charcoal" ? "#efebe4" : "#fbf8f2";
  let shapes = "";

  if (kind === "charcoal") {
    // soft head-and-shoulders silhouette in smudged charcoal
    const cx = W * (0.42 + r() * 0.16);
    shapes += `<ellipse cx="${cx}" cy="${H * 0.4}" rx="${W * 0.2}" ry="${H * 0.2}" fill="${pal[1]}" opacity=".55"/>`;
    shapes += `<path d="M${cx - W * .38} ${H} Q${cx} ${H * .5} ${cx + W * .38} ${H}Z" fill="${pal[0]}" opacity=".6"/>`;
    shapes += `<ellipse cx="${cx - W * .05}" cy="${H * .36}" rx="${W * .1}" ry="${H * .12}" fill="${pal[3]}" opacity=".5"/>`;
    for (let i = 0; i < 26; i++) {
      const x = r() * W, y = r() * H;
      shapes += `<line x1="${x}" y1="${y}" x2="${x + (r() - .5) * 120}" y2="${y + (r() - .5) * 40}" stroke="${pal[Math.floor(r() * 3)]}" stroke-width="${1 + r() * 3}" opacity="${.15 + r() * .3}"/>`;
    }
  } else {
    const n = kind === "illustration" ? 7 : 6;
    for (let i = 0; i < n; i++) {
      const c = pal[Math.floor(r() * pal.length)];
      shapes += `<ellipse cx="${r() * W}" cy="${r() * H}" rx="${60 + r() * 140}" ry="${50 + r() * 120}" fill="${c}" opacity="${.35 + r() * .35}"/>`;
    }
    if (kind === "illustration") {
      // a little moon/sun and hill for storybook feel
      shapes += `<circle cx="${W * (.2 + r() * .6)}" cy="${H * .25}" r="${26 + r() * 20}" fill="${pal[2]}" opacity=".9"/>`;
      shapes += `<path d="M0 ${H * .78} Q${W * .5} ${H * .58} ${W} ${H * .8} V${H} H0Z" fill="${pal[1]}" opacity=".8"/>`;
    } else {
      shapes += `<path d="M0 ${H * (.6 + r() * .15)} Q${W * .5} ${H * (.5 + r() * .2)} ${W} ${H * (.62 + r() * .15)} V${H} H0Z" fill="${pal[0]}" opacity=".45"/>`;
    }
  }

  const filter = kind === "charcoal"
    ? `<filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${uid}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="6"/><feGaussianBlur stdDeviation="2.5"/></filter>`
    : `<filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency=".015" numOctaves="3" seed="${uid}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="55"/><feGaussianBlur stdDeviation="1.5"/></filter>`;

  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>${filter}</defs><rect width="100%" height="100%" fill="${bg}"/>
    <g filter="url(#${id})">${shapes}</g></svg>`;
}

// A photo if one is set, otherwise a placeholder.
// ratio: crop to this shape; "natural" lets a real photo keep its own shape.
function artHTML(item, ratio = "4/5", kind = item.category) {
  if (item.image) {
    const natural = ratio === "natural";
    return `<div class="art${natural ? " natural" : ""}"${natural ? "" : ` style="aspect-ratio:${ratio}"`}>` +
      `<img src="${esc(item.image)}" alt="${esc(item.title)}" loading="lazy"></div>`;
  }
  const r = ratio === "natural" ? "4/5" : ratio;
  return `<div class="art" style="aspect-ratio:${r}">${placeholderSVG(item.title || "art", kind, r)}</div>`;
}

// ---- render everything from /content ----
const PLACEHOLDER_SHAPES = ["4/5", "4/5", "5/4", "3/4", "1/1", "4/3"];
let gallery = [];

async function render() {
  const [settings, galleryData, shop, offers, classes, books] = await Promise.all(
    ["settings", "gallery", "shop", "commissions", "classes", "books"].map(n => getJSON(`content/${n}.json`)));

  // settings: name, contact links, hero, about
  document.querySelectorAll("[data-text]").forEach(el => el.textContent = settings[el.dataset.text] ?? "");
  document.querySelectorAll("[data-rich]").forEach(el =>   // *word* → italic accent
    el.innerHTML = esc(settings[el.dataset.rich]).replace(/\*(.+?)\*/g, "<em>$1</em>"));
  document.querySelectorAll("[data-instagram]").forEach(a => a.href = `https://instagram.com/${encodeURIComponent(settings.instagram || "")}`);
  document.querySelectorAll("[data-email]").forEach(a => a.href = `mailto:${settings.email || ""}`);
  if (settings.artist_name) document.title = `${settings.artist_name} — ${document.title}`;
  $("heroArt").innerHTML = artHTML({ image: settings.hero_image, title: "hero-wash-composition" }, "4/5", "watercolor");
  $("aboutPhoto").innerHTML = artHTML({ image: settings.about_photo, title: "portrait-of-the-artist" }, "4/5", "charcoal");
  $("aboutText").innerHTML = String(settings.about_text || "").split(/\n\s*\n/).map(p => `<p>${esc(p)}</p>`).join("");

  // gallery
  gallery = galleryData.items || [];
  $("galleryGrid").innerHTML = gallery.map((item, i) => `
    <button class="tile" data-kind="${esc(item.category)}" data-index="${i}">
      ${artHTML(item, item.image ? "natural" : PLACEHOLDER_SHAPES[i % PLACEHOLDER_SHAPES.length])}
      <div class="tile-caption"><span>${esc(item.title)}</span><span>${esc(item.size)}</span></div>
    </button>`).join("");

  // shop
  $("shopGrid").innerHTML = (shop.items || []).map(p => {
    const action = p.sold
      ? `<button class="btn btn-small" disabled>Sold</button>`
      : p.buy_link
        ? `<a class="btn btn-small btn-primary" href="${esc(p.buy_link)}" target="_blank" rel="noopener">Buy now</a>`
        : `<a class="btn btn-small" href="#commissions" data-prefill="Purchase an available piece" data-piece="${esc(p.title)} (${esc(p.details)})">Inquire</a>`;
    return `<article class="product">
        <div style="position:relative">${artHTML(p)}
          <span class="badge ${p.sold ? "sold" : ""}">${p.sold ? "Sold" : esc(String(p.details || "").split(" ·")[0])}</span></div>
        <h3>${esc(p.title)}</h3>
        <p class="product-meta">${esc(p.details)}</p>
        <div class="product-foot"><span class="product-price">${p.price ? "$" + esc(p.price) : ""}</span>${action}</div>
      </article>`;
  }).join("");

  // commission offerings
  $("offerGrid").innerHTML = (offers.items || []).map((o, i) => `
    <article class="offer">
      <div class="offer-art">${artHTML(o, "1/1", ["charcoal", "watercolor", "illustration"][i % 3])}</div>
      <h3>${esc(o.title)}</h3>
      <p>${esc(o.description)}</p>
      <p class="price">${esc(o.price)}</p>
    </article>`).join("");

  // classes: without a signup link, the button opens the request form
  $("classGrid").innerHTML = (classes.items || []).map(c => {
    const href = c.link
      ? `href="${esc(c.link)}" target="_blank" rel="noopener"`
      : `href="#commissions" data-prefill="Private lesson" data-piece="${esc(c.title)}"`;
    return `<article class="class-card">
        <p class="class-tag">${esc(c.label)}</p>
        <h3>${esc(c.title)}</h3>
        <p>${esc(c.description)}</p>
        <p class="class-meta">${esc(c.details)}</p>
        <a class="btn btn-small" ${href}>${esc(c.button_text || "Learn more")}</a>
      </article>`;
  }).join("");

  // books
  $("bookGrid").innerHTML = (books.items || []).map(b => {
    const art = artHTML(b, "8/10", "illustration");
    return `<article class="book">${b.link ? `<a href="${esc(b.link)}" target="_blank" rel="noopener">${art}</a>` : art}
      <h3>${esc(b.title)}</h3><p>${esc(b.note)}</p></article>`;
  }).join("");
}
render();

// ---- gallery filter ----
document.querySelectorAll(".filter").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".filter").forEach(b => b.classList.toggle("active", b === btn));
  const f = btn.dataset.filter;
  $("galleryGrid").querySelectorAll(".tile").forEach(t =>
    t.classList.toggle("is-hidden", f !== "all" && t.dataset.kind !== f));
}));

// ---- lightbox ----
const lb = $("lightbox");
$("galleryGrid").addEventListener("click", e => {
  const tile = e.target.closest(".tile");
  if (!tile) return;
  const item = gallery[tile.dataset.index];
  $("lightboxArt").innerHTML = artHTML(item, "natural");
  $("lightboxTitle").textContent = item.title;
  $("lightboxMeta").textContent = [item.medium, item.size].filter(Boolean).join(" · ");
  const cta = $("lightboxCta");
  cta.dataset.prefill = item.category === "illustration" ? "Book illustration" : "Purchase an available piece";
  cta.dataset.piece = item.title;
  lb.showModal();
});
lb.querySelector(".lightbox-close").addEventListener("click", () => lb.close());
lb.addEventListener("click", e => { if (e.target === lb) lb.close(); });
$("lightboxCta").addEventListener("click", () => lb.close());

// ---- "Inquire"/"Request" buttons prefill the request form ----
document.addEventListener("click", e => {
  const link = e.target.closest("[data-prefill]");
  if (!link) return;
  $("typeSelect").value = link.dataset.prefill;
  if (link.dataset.piece) $("messageField").value = `Hi! I'm interested in "${link.dataset.piece}". `;
});

// ---- form submission (emailed to her through Web3Forms) ----
const form = $("requestForm");
const status = $("formStatus");
form.addEventListener("submit", async e => {
  e.preventDefault();
  const email = document.querySelector("[data-text=email]")?.textContent || "me";
  if (!FORM_ACCESS_KEY) {
    status.textContent = `The form isn't connected yet. Please email ${email} instead.`;
    return;
  }
  status.textContent = "Sending…";
  const data = Object.fromEntries(new FormData(form));
  data.access_key = FORM_ACCESS_KEY;
  data.subject = `New ${data.type || "website"} request from ${data.name}`;
  data.from_name = "Art website";
  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    });
    if (!(await res.json()).success) throw new Error();
    form.reset();
    status.textContent = "Thank you! I'll get back to you within 2–3 days.";
  } catch {
    status.textContent = `Something went wrong. Please email ${email} instead.`;
  }
});

// ---- mobile nav ----
const toggle = document.querySelector(".nav-toggle");
const links = document.querySelector(".nav-links");
toggle.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});
links.addEventListener("click", e => { if (e.target.closest("a")) links.classList.remove("open"); });

$("year").textContent = new Date().getFullYear();
