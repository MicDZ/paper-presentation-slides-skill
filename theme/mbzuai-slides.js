/* ==========================================================================
   MBZUAI HTML Slides — runtime
   Based on MBZUAI Brand Guidelines (March 2026, V1)

   Responsibilities
     1. Build slide chrome (frametitle banner, footer, title/closing/section slides)
     2. Math: KaTeX rendering of $..$, \(..\), $$..$$, \[..\], equation environments
     3. Academic apparatus: numbered equations / figures / tables / theorems,
        cross-references, citations from BibTeX, per-slide footnotes,
        per-slide reference lists and an auto-paginated References slide
     4. Viewer: scaling, keyboard navigation, fragments, overview, print/PDF
     5. QA: overflow detection, missing citations/labels, KaTeX errors
        → window.MBZUAI.report and <script id="mbz-report" type="application/json">

   Authoring reference: html/AUTHORING.md
   ========================================================================== */
(function () {
  "use strict";

  var VERSION = "1.0.0";
  var KATEX_VERSION = "0.16.11";
  var KATEX_CDN = "https://cdn.jsdelivr.net/npm/katex@" + KATEX_VERSION + "/dist/";

  var scriptEl = document.currentScript;
  var THEME_BASE = scriptEl && scriptEl.src ? new URL(".", scriptEl.src).href : "";

  var LOGOS = {
    header: { mbzuai: "assets/logo-sand.svg", rcl: "assets/rcl-logo-sand.svg" },
    light: { mbzuai: "assets/logo-dark.svg", rcl: "assets/rcl-logo-dark.svg" }
  };

  var FOOTNOTE_SYMBOLS = ["*", "†", "‡", "§", "¶", "‖", "**", "††", "‡‡"];

  var THEOREM_KINDS = {
    theorem: "Theorem", lemma: "Lemma", proposition: "Proposition", corollary: "Corollary",
    conjecture: "Conjecture", definition: "Definition", assumption: "Assumption",
    remark: "Remark", "example-env": "Example"
  };

  var REF_NAMES = {
    eq: "Eq.", figure: "Figure", table: "Table", algorithm: "Algorithm",
    theorem: "Theorem", lemma: "Lemma", proposition: "Proposition", corollary: "Corollary",
    conjecture: "Conjecture", definition: "Definition", assumption: "Assumption",
    remark: "Remark", "example-env": "Example", section: "Section"
  };

  var report = {
    version: VERSION,
    ready: false,
    slides: 0,
    overflow: [],
    missingCitations: [],
    missingLabels: [],
    katexErrors: [],
    warnings: []
  };

  // ── Small DOM helpers ──────────────────────────────────────────────────
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function uniq(arr) { var s = {}; return arr.filter(function (x) { if (s[x]) return false; s[x] = 1; return true; }); }
  function warn(msg) { report.warnings.push(msg); console.warn("[MBZUAI] " + msg); }
  function slideLabel(slide) {
    var h = slide.querySelector(".frametitle, h1, h2");
    return h ? h.textContent.trim().slice(0, 80) : "";
  }
  function themeUrl(rel) { return THEME_BASE ? new URL(rel, THEME_BASE).href : rel; }
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  function loadCss(href) {
    if ($all('link[href*="katex"]').length) return;
    var l = document.createElement("link");
    l.rel = "stylesheet"; l.href = href;
    document.head.appendChild(l);
  }

  // ── Configuration ──────────────────────────────────────────────────────
  function readConfig(deck) {
    var d = deck.dataset;
    var macros = {};
    $all('script[type="application/json"]#katex-macros, script[type="application/json"][data-katex-macros]').forEach(function (s) {
      try { Object.assign(macros, JSON.parse(s.textContent)); } catch (e) { warn("Invalid JSON in KaTeX macros: " + e.message); }
    });
    if (window.MBZUAI_KATEX_MACROS) Object.assign(macros, window.MBZUAI_KATEX_MACROS);
    return {
      shortTitle: d.shortTitle,
      footLeft: d.footLeft,
      footMid: d.footMid,
      footRight: d.footRight,
      citeStyle: (d.citeStyle || "numeric").toLowerCase() === "author-year" ? "author-year" : "numeric",
      slideRefs: d.slideRefs !== "false",
      footnoteStyle: d.footnoteStyle === "symbol" ? "symbol" : "number",
      footnoteNumbering: d.footnoteNumbering === "global" ? "global" : "slide",
      headerLogos: d.headerLogos || "rcl mbzuai",
      titleLogos: d.titleLogos || "mbzuai",
      bibMaxAuthors: parseInt(d.bibMaxAuthors || "8", 10),
      bibAll: d.bibAll === "true",
      equationNumbering: d.equationNumbering || "global", // "global" | "section"
      notationHover: d.notationHover !== "false",
      macros: macros
    };
  }

  // ======================================================================
  //  BibTeX
  // ======================================================================
  var MONTHS = { jan: "January", feb: "February", mar: "March", apr: "April", may: "May", jun: "June",
    jul: "July", aug: "August", sep: "September", oct: "October", nov: "November", dec: "December" };

  function parseBibtex(src) {
    var entries = {};
    var strings = Object.assign({}, MONTHS);
    var i = 0, n = src.length;

    function skipWs() { while (i < n && /\s/.test(src[i])) i++; }
    function readBalanced(open, close) { // i at open char; returns inner text
      var depth = 0, start = i + 1;
      for (; i < n; i++) {
        var c = src[i];
        if (c === "\\") { i++; continue; }
        if (c === open) depth++;
        else if (c === close) { depth--; if (depth === 0) { i++; return src.slice(start, i - 1); } }
      }
      return src.slice(start);
    }
    function readQuoted() {
      var depth = 0, start = ++i;
      for (; i < n; i++) {
        var c = src[i];
        if (c === "\\") { i++; continue; }
        if (c === "{") depth++;
        else if (c === "}") depth--;
        else if (c === '"' && depth === 0) { i++; return src.slice(start, i - 1); }
      }
      return src.slice(start);
    }
    function readValue() {
      var parts = [];
      for (;;) {
        skipWs();
        var c = src[i];
        if (c === "{") parts.push(readBalanced("{", "}"));
        else if (c === '"') parts.push(readQuoted());
        else {
          var m = /^[^\s,#})]+/.exec(src.slice(i));
          if (!m) break;
          i += m[0].length;
          var w = m[0];
          parts.push(/^\d+$/.test(w) ? w : (strings[w.toLowerCase()] != null ? strings[w.toLowerCase()] : w));
        }
        skipWs();
        if (src[i] === "#") { i++; continue; }
        break;
      }
      return parts.join("");
    }

    while (i < n) {
      var at = src.indexOf("@", i);
      if (at < 0) break;
      i = at + 1;
      var m = /^\s*([A-Za-z]+)\s*([{(])/.exec(src.slice(i));
      if (!m) continue;
      var type = m[1].toLowerCase();
      i += m[0].length - 1;
      var closeCh = src[i] === "{" ? "}" : ")";
      if (type === "comment" || type === "preamble") { readBalanced(src[i], closeCh); continue; }
      i++;
      if (type === "string") {
        skipWs();
        var nm = /^[^\s=]+/.exec(src.slice(i));
        if (nm) { i += nm[0].length; skipWs(); if (src[i] === "=") { i++; strings[nm[0].toLowerCase()] = readValue(); } }
        while (i < n && src[i] !== closeCh) i++;
        i++;
        continue;
      }
      var comma = src.indexOf(",", i);
      if (comma < 0) break;
      var key = src.slice(i, comma).trim();
      i = comma + 1;
      var fields = { _type: type, _key: key };
      for (;;) {
        skipWs();
        while (src[i] === ",") { i++; skipWs(); }
        if (i >= n || src[i] === closeCh) { i++; break; }
        var fm = /^([A-Za-z][\w\-:.+]*)\s*=/.exec(src.slice(i));
        if (!fm) { while (i < n && src[i] !== "," && src[i] !== closeCh) i++; continue; }
        i += fm[0].length;
        fields[fm[1].toLowerCase()] = readValue().replace(/\s+/g, " ").trim();
      }
      entries[key] = fields;
    }
    return entries;
  }

  var ACCENTS = { "'": "́", "`": "̀", "^": "̂", '"': "̈", "~": "̃", "=": "̄",
    ".": "̇", u: "̆", v: "̌", H: "̋", c: "̧", k: "̨", r: "̊", d: "̣", b: "̱" };
  var LATEX_SYMBOLS = { ss: "ß", o: "ø", O: "Ø", l: "ł", L: "Ł", ae: "æ", AE: "Æ", oe: "œ", OE: "Œ",
    aa: "å", AA: "Å", i: "ı", j: "ȷ", dag: "†", ddag: "‡", S: "§", P: "¶", copyright: "©", pounds: "£",
    textendash: "–", textemdash: "—", ldots: "…", dots: "…", textregistered: "®", texttrademark: "™" };

  /** Convert a BibTeX/LaTeX field to HTML. Math ($...$) is rendered with KaTeX. */
  function latexToHtml(s, renderMath) {
    if (!s) return "";
    var out = "";
    var segs = splitMath(s);
    segs.forEach(function (seg) {
      if (seg.math != null) { out += renderMath ? renderMath(seg.math, false) : escapeHtml("$" + seg.math + "$"); return; }
      var t = seg.text;
      // accents first (they contain " and ' which escaping would destroy): \'e  \'{e}  {\'e}  \"{\i}
      t = t.replace(/\\([`'^"~=.])\s*\{?\\?([A-Za-z])\}?/g, function (m0, a, ch) {
        return (ch === "i" ? "i" : ch) + ACCENTS[a];
      });
      t = t.replace(/\\([uvHckrdb])(?:\s*\{\\?([A-Za-z])\}|\s+\\?([A-Za-z]))/g, function (m0, a, c1, c2) {
        var ch = c1 || c2; return (ch === "i" ? "i" : ch) + ACCENTS[a];
      });
      t = escapeHtml(t);
      t = t.replace(/\\(textit|emph|textsl)\s*\{([^{}]*)\}/g, "<i>$2</i>")
           .replace(/\\textbf\s*\{([^{}]*)\}/g, "<b>$1</b>")
           .replace(/\\textsc\s*\{([^{}]*)\}/g, '<span class="sc">$1</span>')
           .replace(/\\(texttt|url)\s*\{([^{}]*)\}/g, "<code>$2</code>")
           .replace(/\\(?:href)\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '<a href="$1">$2</a>');
      t = t.replace(/\\([A-Za-z]+)(?:\{\})?/g, function (m0, name) {
        return LATEX_SYMBOLS[name] != null ? LATEX_SYMBOLS[name] : m0;
      });
      t = t.replace(/\\([&%$#_{}])/g, "$1")
           .replace(/---/g, "—").replace(/--/g, "–")
           .replace(/``/g, "“").replace(/''/g, "”")
           .replace(/~/g, " ")
           .replace(/\\\\/g, " ")
           .replace(/\\[,;: ]/g, " ")
           .replace(/[{}]/g, "");
      out += t;
    });
    return out.normalize ? out.normalize("NFC") : out;
  }
  function latexToText(s) {
    var tmp = document.createElement("div");
    tmp.innerHTML = latexToHtml(s, null);
    return tmp.textContent;
  }

  function splitTopLevel(s, re) {
    var parts = [], depth = 0, last = 0;
    for (var k = 0; k < s.length; k++) {
      var c = s[k];
      if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (depth === 0) {
        re.lastIndex = k;
        var m = re.exec(s);
        if (m && m.index === k) { parts.push(s.slice(last, k)); last = k + m[0].length; k = last - 1; }
      }
    }
    parts.push(s.slice(last));
    return parts.map(function (x) { return x.trim(); }).filter(Boolean);
  }

  function parseNames(field) {
    if (!field) return [];
    if (Array.isArray(field)) {
      return field.map(function (a) {
        if (typeof a === "object") return { first: a.given || a.first || "", last: a.family || a.last || a.literal || "", literal: !!a.literal };
        return parseNames(String(a))[0];
      });
    }
    return splitTopLevel(field, /\s+and\s+/y).map(function (raw) {
      if (/^others$/i.test(raw)) return { others: true };
      if (/^\{.*\}$/.test(raw) && splitTopLevel(raw.slice(1, -1), /,/y).length === 1 && raw.indexOf("}", 1) === raw.length - 1) {
        return { first: "", last: latexToText(raw), literal: true };
      }
      var commaParts = splitTopLevel(raw, /,/y);
      var first, last;
      if (commaParts.length >= 2) {
        last = commaParts[0];
        first = commaParts.length === 3 ? commaParts[2] : commaParts[1];
        if (commaParts.length === 3) last += ", " + commaParts[1];
      } else {
        var toks = splitTopLevel(raw, /\s+/y);
        var idx = toks.length - 1;
        // keep lowercase particles (von, van der, de) with the last name
        while (idx > 0 && /^[a-z]/.test(toks[idx - 1]) && toks.length > 2) idx--;
        last = toks.slice(idx).join(" ");
        first = toks.slice(0, idx).join(" ");
      }
      return { first: latexToText(first), last: latexToText(last) };
    });
  }

  function initials(first) {
    if (!first) return "";
    return first.split(/\s+/).filter(Boolean).map(function (w) {
      return w.split("-").map(function (p) {
        if (/^[A-Z]\.?$/.test(p)) return p.replace(/\.?$/, ".");
        var ch = Array.from(p)[0];
        return ch ? ch.toUpperCase() + "." : "";
      }).join("-");
    }).join(" ");
  }

  function normalizeEntry(raw, renderMath) {
    var f = raw;
    var type = (f._type || f.type || "misc").toLowerCase();
    var names = parseNames(f.author || f.editor);
    var others = names.some(function (a) { return a.others; });
    names = names.filter(function (a) { return !a.others; });
    var year = f.year || (f.date ? String(f.date).slice(0, 4) : "") || "n.d.";
    var venue = f.booktitle || f.journal || f.journaltitle || f.venue || "";
    var archive = (f.archiveprefix || f.eprinttype || "").toLowerCase();
    var eprint = f.eprint ? (archive === "arxiv" || /^\d{4}\.\d{4,5}/.test(f.eprint) ? "arXiv:" + f.eprint : f.eprint) : "";
    var url = f.url || (f.doi ? "https://doi.org/" + f.doi.replace(/^https?:\/\/doi\.org\//, "") : "") ||
      (eprint.indexOf("arXiv:") === 0 ? "https://arxiv.org/abs/" + f.eprint : "");
    return {
      key: f._key || f.id || f.key,
      type: type,
      authors: names,
      others: others,
      year: String(year),
      title: latexToHtml(f.title || "", renderMath),
      titleText: latexToText(f.title || ""),
      venue: latexToHtml(venue, renderMath),
      venueShort: latexToHtml(f.venueshort || f.shortvenue || f.shortbooktitle || f.shortjournal || "", renderMath),
      volume: f.volume || "", number: f.number || f.issue || "",
      pages: (f.pages || "").replace(/-+/g, "–"),
      publisher: latexToHtml(f.publisher || "", renderMath),
      institution: latexToHtml(f.institution || f.school || f.organization || "", renderMath),
      howpublished: latexToHtml(f.howpublished || "", renderMath),
      note: latexToHtml(f.note || "", renderMath),
      eprint: eprint,
      url: url,
      suffix: ""
    };
  }

  function namesShort(e) {
    var a = e.authors;
    if (!a.length) return e.titleText ? e.titleText.split(/\s+/).slice(0, 3).join(" ") : e.key;
    if (a.length === 1 && !e.others) return a[0].last;
    if (a.length === 2 && !e.others) return a[0].last + " and " + a[1].last;
    return a[0].last + " et al.";
  }
  function nameFull(p, invert) {
    if (p.literal || !p.first) return escapeHtml(p.last);
    return invert ? escapeHtml(p.last + ", " + initials(p.first)) : escapeHtml(initials(p.first) + " " + p.last);
  }
  function joinNames(list, invert, max, others) {
    var shown = list;
    var etal = others;
    if (list.length > max) { shown = list.slice(0, Math.max(1, max - 2)); etal = true; }
    var parts = shown.map(function (p) { return nameFull(p, invert); });
    if (etal) return parts.join(", ") + ", et al.";
    if (parts.length <= 1) return parts.join("");
    if (parts.length === 2) return parts[0] + (invert ? ", and " : " and ") + parts[1];
    return parts.slice(0, -1).join(", ") + ", and " + parts[parts.length - 1];
  }
  function venueBlock(e, short) {
    var v = short && e.venueShort ? e.venueShort : e.venue;
    var bits = [];
    var t = e.type;
    if (t === "article") {
      if (v) {
        var s = '<span class="bib-venue">' + v + "</span>";
        if (!short) {
          if (e.volume) s += ", " + escapeHtml(e.volume) + (e.number ? "(" + escapeHtml(e.number) + ")" : "");
          if (e.pages) s += (e.volume ? ":" : ", ") + escapeHtml(e.pages);
        }
        bits.push(s);
      } else if (e.eprint) bits.push(escapeHtml(e.eprint));
    } else if (t === "inproceedings" || t === "conference" || t === "incollection") {
      if (v) bits.push((short ? "" : "In ") + '<span class="bib-venue">' + v + "</span>");
      if (!short && e.pages) bits.push("pages " + escapeHtml(e.pages));
    } else if (t === "book") {
      if (e.publisher) bits.push(e.publisher);
    } else if (t === "phdthesis" || t === "mastersthesis") {
      bits.push((t === "phdthesis" ? "PhD thesis" : "Master’s thesis") + (e.institution ? ", " + e.institution : ""));
    } else if (t === "techreport") {
      bits.push("Technical report" + (e.institution ? ", " + e.institution : ""));
    } else {
      if (v) bits.push('<span class="bib-venue">' + v + "</span>");
      else if (e.howpublished) bits.push(e.howpublished);
      else if (e.eprint) bits.push(escapeHtml(e.eprint));
      else if (e.institution) bits.push(e.institution);
    }
    return bits.join(", ");
  }
  function titleHtml(e, quoted) {
    var t = e.type === "book" ? "<i>" + e.title + "</i>" : e.title;
    if (e.url) t = '<a class="bib-title" href="' + escapeHtml(e.url) + '" target="_blank" rel="noopener">' + t + "</a>";
    else t = '<span class="bib-title">' + t + "</span>";
    return quoted ? "“" + t + ".”" : t + ".";
  }
  function endDot(s) { return /[.?!]$/.test(s.replace(/<[^>]+>/g, "")) ? s : s + "."; }

  /** Full entry for the References slide. */
  function formatFull(e, style, maxAuthors) {
    var year = escapeHtml(e.year + e.suffix);
    var v = venueBlock(e, false);
    if (style === "author-year") {
      var s = (e.authors.length ? joinNames(e.authors, true, maxAuthors, e.others) : "") + " (" + year + "). ";
      s += titleHtml(e, false);
      if (v) s += " " + endDot(v);
      if (e.note) s += " " + endDot(e.note);
      return s;
    }
    var out = e.authors.length ? endDot(joinNames(e.authors, false, maxAuthors, e.others)) + " " : "";
    out += titleHtml(e, false);
    out += " " + (v ? v + ", " : "") + year + ".";
    if (e.note) out += " " + endDot(e.note);
    return out;
  }
  /** Compact entry for the bottom of a slide. */
  function formatShort(e) {
    var a = e.authors;
    var who = "";
    if (a.length === 1 && !e.others) who = nameFull(a[0], false);
    else if (a.length === 2 && !e.others) who = nameFull(a[0], false) + " and " + nameFull(a[1], false);
    else if (a.length) who = nameFull(a[0], false) + " et al.";
    var v = venueBlock(e, true);
    return (who ? endDot(who) + " " : "") + titleHtml(e, true) + " " + (v ? v + " " : "") + escapeHtml(e.year + e.suffix) + ".";
  }

  // ======================================================================
  //  Math segmentation
  // ======================================================================
  var MATH_ENVS = ["equation", "equation*", "align", "align*", "gather", "gather*", "multline", "multline*"];

  function findClose(text, close, from) {
    var depth = 0;
    for (var k = from; k < text.length; k++) {
      if (depth === 0 && text.startsWith(close, k)) return k;
      var c = text[k];
      if (c === "\\") { k++; continue; }
      if (c === "{") depth++;
      else if (c === "}") depth = Math.max(0, depth - 1);
    }
    return -1;
  }

  /** Split text into [{text}|{math, display, env}] segments. */
  function splitMath(text) {
    var out = [], buf = "", i = 0;
    function flush() { if (buf) { out.push({ text: buf }); buf = ""; } }
    while (i < text.length) {
      var c = text[i];
      if (c === "\\" && text[i + 1] === "$") { buf += "\\$"; i += 2; continue; }
      var open = null, close = null, display = false, env = null;
      if (text.startsWith("$$", i)) { open = "$$"; close = "$$"; display = true; }
      else if (text.startsWith("\\[", i)) { open = "\\["; close = "\\]"; display = true; }
      else if (text.startsWith("\\(", i)) { open = "\\("; close = "\\)"; }
      else if (c === "$") { open = "$"; close = "$"; }
      else if (text.startsWith("\\begin{", i)) {
        var m = /^\\begin\{([a-z]+\*?)\}/.exec(text.slice(i, i + 30));
        if (m && MATH_ENVS.indexOf(m[1]) >= 0) { env = m[1]; open = m[0]; close = "\\end{" + env + "}"; display = true; }
      }
      if (open) {
        var j = findClose(text, close, i + open.length);
        if (j > -1 && (open !== "$" || j > i + 1)) {
          flush();
          out.push({ math: text.slice(i + open.length, j), display: display, env: env });
          i = j + close.length;
          continue;
        }
      }
      if (c === "\\") { buf += text.slice(i, i + 2); i += 2; continue; }
      buf += c; i++;
    }
    flush();
    return out;
  }

  /** Convert an equation environment into {tex, numbered}. */
  function envToTex(env, body) {
    var starred = /\*$/.test(env);
    var base = env.replace("*", "");
    var tex = body;
    if (base === "align") tex = "\\begin{aligned}" + body + "\\end{aligned}";
    else if (base === "gather") tex = "\\begin{gathered}" + body + "\\end{gathered}";
    else if (base === "multline") tex = "\\begin{gathered}" + body + "\\end{gathered}";
    return { tex: tex, numbered: !starred };
  }

  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, PRE: 1, CODE: 1, TEXTAREA: 1, KBD: 1, SAMP: 1, svg: 1, SVG: 1 };
  function isSkipped(node, root) {
    for (var p = node.parentNode; p && p !== root.parentNode; p = p.parentNode) {
      if (p.nodeType !== 1) continue;
      if (SKIP_TAGS[p.tagName]) return true;
      var cl = p.classList;
      if (cl && (cl.contains("katex") || cl.contains("nomath") || cl.contains("mbz-math") || cl.contains("equation") || cl.contains("notes"))) return true;
    }
    return false;
  }

  var TEXT_CMD_RE = /\\(citep|citet|cite|eqref|cref|Cref|autoref|ref|footnote)\s*\{/g;

  /** Replace LaTeX-ish commands in plain text by elements. Returns a DocumentFragment. */
  function textToNodes(text) {
    var frag = document.createDocumentFragment();
    var last = 0, m;
    TEXT_CMD_RE.lastIndex = 0;
    var plain = function (s) {
      if (!s) return;
      frag.appendChild(document.createTextNode(s.replace(/\\\$/g, "$")));
    };
    while ((m = TEXT_CMD_RE.exec(text))) {
      var start = m.index, braceAt = start + m[0].length - 1;
      var end = findClose(text, "}", braceAt + 1);
      if (end < 0) break;
      var arg = text.slice(braceAt + 1, end);
      plain(text.slice(last, start));
      var cmd = m[1], node;
      if (cmd === "cite" || cmd === "citep" || cmd === "citet") {
        node = el("cite");
        node.setAttribute("data-key", arg);
        if (cmd === "citet") node.classList.add("t");
      } else if (cmd === "footnote") {
        node = el("span", "footnote");
        appendRichText(node, arg);
      } else {
        node = el("a", "ref");
        node.setAttribute("href", "#" + arg.trim());
        node.setAttribute("data-ref-style", cmd === "eqref" ? "eqref" : cmd === "ref" ? "ref" : "cref");
      }
      frag.appendChild(node);
      last = end + 1;
      TEXT_CMD_RE.lastIndex = last;
    }
    plain(text.slice(last));
    return frag;
  }

  function mathNode(tex, display) {
    var span = el(display ? "div" : "span", "mbz-math");
    span.setAttribute("data-tex", tex);
    if (display) span.setAttribute("data-display", "true");
    return span;
  }

  function equationNode(tex, numbered) {
    var div = el("div", "equation" + (numbered ? "" : " nonumber"));
    div.textContent = tex;
    return div;
  }

  function appendRichText(parent, text) {
    splitMath(text).forEach(function (seg) {
      if (seg.math == null) { parent.appendChild(textToNodes(seg.text)); return; }
      if (seg.env) {
        var r = envToTex(seg.env, seg.math);
        parent.appendChild(equationNode(r.tex, r.numbered));
      } else if (seg.display && /\\label\s*\{/.test(seg.math)) {
        parent.appendChild(equationNode(seg.math, true));
      } else {
        parent.appendChild(mathNode(seg.math, seg.display));
      }
    });
  }

  function segmentMath(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var t = node.nodeValue;
      if (!t || (t.indexOf("$") < 0 && t.indexOf("\\") < 0)) return;
      if (isSkipped(node, root)) return;
      var frag = document.createDocumentFragment();
      appendRichText(frag, t);
      node.parentNode.replaceChild(frag, node);
    });
  }

  // ======================================================================
  //  Notation glossary: hover a symbol inside any formula to see its meaning
  // ======================================================================
  // Symbols are matched at the TeX level and wrapped in \htmlData{mbz-sym=ID}{…},
  // so KaTeX emits <span data-mbz-sym="ID"> around exactly that symbol.

  // Commands whose argument changes the identity of a symbol (\hat y ≠ y, \mathcal L ≠ L):
  // their argument is never matched on its own, only as part of a longer key.
  var TEX_MODIFIERS = {};
  ("hat widehat bar overline underline tilde widetilde vec dot ddot dddot check breve acute grave mathring " +
   "overrightarrow overleftarrow overleftrightarrow mathbf mathbb mathcal mathfrak mathscr mathsf mathtt mathit " +
   "mathnormal boldsymbol bm pmb left right middle big Big bigg Bigg bigl bigr Bigl Bigr biggl biggr Biggl Biggr")
    .split(" ").forEach(function (c) { TEX_MODIFIERS[c] = 1; });
  // Commands with ordinary arguments, where an argument can hold a single symbol.
  var TEX_ARGS = { frac: 2, dfrac: 2, tfrac: 2, cfrac: 2, binom: 2, dbinom: 2, tbinom: 2, overset: 2, underset: 2,
    stackrel: 2, sqrt: 1, underbrace: 1, overbrace: 1, boxed: 1, mathop: 1, mathbin: 1, mathrel: 1, mathord: 1 };
  // Commands whose arguments are text, names or options: kept as one opaque token.
  var TEX_OPAQUE = { text: 1, textrm: 1, textit: 1, textbf: 1, textsf: 1, texttt: 1, textup: 1, textnormal: 1,
    mbox: 1, mathrm: 1, operatorname: 1, label: 1, tag: 1, begin: 1, end: 1, color: 1, textcolor: 2, colorbox: 2,
    htmlData: 2, htmlClass: 2, htmlId: 2, htmlStyle: 2, href: 2, url: 1, hspace: 1, vspace: 1 };

  function texTokens(tex, from, to) {
    var out = [], i = from;
    while (i < to) {
      var ch = tex[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (ch === "%") { while (i < to && tex[i] !== "\n") i++; continue; }
      var s = i;
      if (ch === "\\") {
        var m = /^\\([A-Za-z]+\*?|[\s\S])/.exec(tex.slice(i, to));
        var name = m ? m[1] : "";
        i += m ? m[0].length : 1;
        var base = name.replace("*", "");
        var nOpaque = TEX_OPAQUE[base];
        if (nOpaque) {
          for (var a = 0; a < nOpaque; a++) {
            while (i < to && /\s/.test(tex[i])) i++;
            if (tex[i] === "[") { var jb = findClose(tex, "]", i + 1); i = jb < 0 ? to : jb + 1; a--; continue; }
            if (tex[i] === "{") { var j = findClose(tex, "}", i + 1); i = j < 0 ? to : j + 1; }
          }
          out.push({ c: tex.slice(s, i).replace(/\s+/g, ""), s: s, e: i, opaque: true });
          continue;
        }
        out.push({ c: "\\" + name, s: s, e: i, cmd: /^[A-Za-z]/.test(name) ? base : null });
        continue;
      }
      if (ch === "{") {
        var jj = findClose(tex, "}", i + 1);
        if (jj < 0 || jj >= to) { out.push({ c: "{", s: i, e: i + 1, brace: 1 }); i++; continue; }
        var inner = texTokens(tex, i + 1, jj);
        if (inner.length === 1) out.push({ c: inner[0].c, s: i, e: jj + 1, opaque: inner[0].opaque });
        else {
          out.push({ c: "{", s: i, e: i + 1, brace: 1 });
          Array.prototype.push.apply(out, inner);
          out.push({ c: "}", s: jj, e: jj + 1, brace: -1 });
        }
        i = jj + 1;
        continue;
      }
      var cp = String.fromCodePoint(tex.codePointAt(i));
      out.push({ c: cp, s: i, e: i + cp.length });
      i += cp.length;
    }
    return out;
  }

  /** Index of the last token of the TeX unit (token or braced region) starting at k. */
  function texUnitEnd(toks, k) {
    if (k >= toks.length) return -1;
    if (toks[k].brace !== 1) return k;
    var depth = 0;
    for (var q = k; q < toks.length; q++) {
      depth += toks[q].brace || 0;
      if (depth === 0) return q;
    }
    return toks.length - 1;
  }

  /** Mark argument positions: `locked` (inside a modifier) and `slot` (single-symbol argument). */
  function markTexArgs(toks) {
    function unitEnd(k) { return texUnitEnd(toks, k); }
    for (var k = 0; k < toks.length; k++) {
      var t = toks[k];
      var n = 0, lock = false;
      if (t.cmd && TEX_MODIFIERS[t.cmd]) { n = 1; lock = true; }
      else if (t.cmd && TEX_ARGS[t.cmd]) n = TEX_ARGS[t.cmd];
      else if (t.c === "_" || t.c === "^") n = 1;
      var p = k + 1;
      for (var a = 0; a < n && p < toks.length; a++) {
        var end = unitEnd(p);
        for (var q = p; q <= end; q++) { if (lock) toks[q].locked = true; else if (q === p) toks[q].slot = true; }
        p = end + 1;
      }
    }
  }

  function stripExplain(tex) {
    var out = "", i = 0, m;
    var re = /\\explain\s*\{/g;
    while ((m = re.exec(tex))) {
      var a1 = m.index + m[0].length;
      var e1 = findClose(tex, "}", a1);
      if (e1 < 0) break;
      var rest = tex.slice(e1 + 1).match(/^\s*\{/);
      var e2 = rest ? findClose(tex, "}", e1 + 1 + rest[0].length) : -1;
      out += tex.slice(i, m.index) + "{" + tex.slice(a1, e1) + "}";
      i = e2 < 0 ? e1 + 1 : e2 + 1;
      re.lastIndex = i;
    }
    return out + tex.slice(i);
  }

  var NOTATION = [];   // id → { key, meaning (string|function), type }
  var notationStats = { annotated: 0, skipped: 0 };

  function notationEntry(key, meaning, type) {
    var e = { id: NOTATION.length, key: key, meaning: meaning, type: type || "", used: false };
    NOTATION.push(e);
    return e;
  }

  /** Build a matcher from a { texKey: entry } map. */
  function compileGlossary(map) {
    var byFirst = {};
    Object.keys(map).forEach(function (key) {
      var toks = texTokens(key, 0, key.length).map(function (t) { return t.c; });
      if (!toks.length) return;
      (byFirst[toks[0]] = byFirst[toks[0]] || []).push({ toks: toks, entry: map[key] });
    });
    Object.keys(byFirst).forEach(function (k) { byFirst[k].sort(function (a, b) { return b.toks.length - a.toks.length; }); });
    return { byFirst: byFirst, explained: {} };
  }

  function wrapSym(id, body) { return "{\\htmlData{mbz-sym=" + id + "}{" + body + "}}"; }

  function annotateTex(tex, gl) {
    // 1. inline one-off explanations: \explain{symbol}{meaning}
    var pre = "", i = 0, m;
    var re = /\\explain\s*\{/g;
    while ((m = re.exec(tex))) {
      var a1 = m.index + m[0].length;
      var e1 = findClose(tex, "}", a1);
      if (e1 < 0) break;
      var rest = tex.slice(e1 + 1).match(/^\s*\{/);
      if (!rest) break;
      var a2 = e1 + 1 + rest[0].length;
      var e2 = findClose(tex, "}", a2);
      if (e2 < 0) break;
      var sym = tex.slice(a1, e1), meaning = tex.slice(a2, e2);
      var dk = sym + "\u0000" + meaning;
      var entry = gl.explained[dk] || (gl.explained[dk] = notationEntry(sym, meaning, ""));
      entry.used = true;
      notationStats.annotated++;
      pre += tex.slice(i, m.index) + wrapSym(entry.id, sym);
      i = e2 + 1;
      re.lastIndex = i;
    }
    tex = pre + tex.slice(i);
    return annotateCore(tex, gl);
  }

  function annotateCore(tex, gl) {
    // Glossary symbols, longest match first. A match absorbs trailing scripts
    // (K^\top, x_t', …) so the script stays attached to a real symbol and KaTeX
    // keeps its normal script placement; symbols inside the scripts are annotated recursively.
    var toks = texTokens(tex, 0, tex.length);
    markTexArgs(toks);
    var out = "", last = 0, k = 0;
    while (k < toks.length) {
      var t = toks[k], done = false;
      var cands = !t.locked && gl.byFirst[t.c];
      if (cands) {
        for (var ci = 0; ci < cands.length && !done; ci++) {
          var cand = cands[ci], L = cand.toks.length;
          if (k + L > toks.length || (L > 1 && t.slot)) continue;
          var ok = true, depth = 0;
          for (var q = 0; q < L; q++) {
            var tq = toks[k + q];
            if (tq.c !== cand.toks[q] || (q > 0 && tq.locked && !toks[k].cmd)) { ok = false; break; }
            depth += tq.brace || 0;
          }
          if (!ok || depth !== 0) continue;
          var endTok = toks[k + L - 1];
          var body = tex.slice(t.s, endTok.e);
          var j = k + L;
          while (j < toks.length && (toks[j].c === "^" || toks[j].c === "_" || toks[j].c === "'")) {
            if (toks[j].c === "'") { body += tex.slice(endTok.e, toks[j].e); endTok = toks[j]; j++; continue; }
            var ue = texUnitEnd(toks, j + 1);
            if (ue < 0) break;
            body += tex.slice(endTok.e, toks[j + 1].s) + annotateCore(tex.slice(toks[j + 1].s, toks[ue].e), gl);
            endTok = toks[ue];
            j = ue + 1;
          }
          out += tex.slice(last, t.s) + wrapSym(cand.entry.id, body);
          last = endTok.e;
          cand.entry.used = true;
          notationStats.annotated++;
          k = j;
          done = true;
        }
      }
      if (!done) k++;
    }
    return out + tex.slice(last);
  }

  // ======================================================================
  //  Rendering helpers (KaTeX)
  // ======================================================================
  var katexOptions;
  function renderTex(tex, display, context) {
    if (!window.katex) return escapeHtml((display ? "$$" : "$") + tex + (display ? "$$" : "$"));
    try {
      return window.katex.renderToString(tex, Object.assign({}, katexOptions, { displayMode: display, throwOnError: true }));
    } catch (e) {
      report.katexErrors.push({ slide: context || null, tex: tex.slice(0, 200), error: String(e.message || e) });
      console.warn("[MBZUAI] KaTeX error on slide " + context + ": " + e.message);
      return window.katex.renderToString(tex, Object.assign({}, katexOptions, { displayMode: display, throwOnError: false }));
    }
  }

  // ======================================================================
  //  Deck build
  // ======================================================================
  function logoSet(spec, variant) {
    spec = (spec || "").trim();
    if (!spec || spec === "none") return null;
    var box = el("div", "mbz-logos");
    var tokens = spec.split(/[\s|,]+/).filter(Boolean);
    tokens.forEach(function (tok, idx) {
      if (idx > 0) box.appendChild(el("span", "sep"));
      var img = el("img");
      var key = tok.toLowerCase();
      if (LOGOS[variant][key]) { img.src = themeUrl(LOGOS[variant][key]); img.className = key; img.alt = key.toUpperCase(); }
      else { img.src = tok; img.alt = ""; }
      box.appendChild(img);
    });
    return box;
  }

  function buildRegularSlide(slide, cfg) {
    var h2 = null;
    for (var c = slide.firstElementChild; c; c = c.nextElementSibling) { if (c.tagName === "H2") { h2 = c; break; } }
    var header = null;
    if (h2 && !slide.classList.contains("no-header")) {
      header = el("header", "mbz-header");
      h2.classList.add("frametitle");
      header.appendChild(h2);
      var logos = logoSet(slide.dataset.headerLogos || cfg.headerLogos, "header");
      if (logos) header.appendChild(logos);
    } else {
      if (h2) h2.remove();
      slide.classList.add("no-header");
    }
    var content = el("div", "mbz-content");
    var body = el("div", "mbz-body");
    var main = el("div", "mbz-main");
    var bottom = el("div", "mbz-bottom");
    var kids = Array.prototype.slice.call(slide.childNodes);
    kids.forEach(function (k) {
      if (k.nodeType === 1 && k.tagName === "ASIDE" && k.classList.contains("notes")) return;
      main.appendChild(k);
    });
    body.appendChild(main);
    content.appendChild(body);
    content.appendChild(bottom);
    if (header) slide.appendChild(header);
    slide.appendChild(content);
    // keep notes at the end
    $all(":scope > aside.notes", slide).forEach(function (n) { slide.appendChild(n); });
  }

  function buildTitleSlide(slide, cfg) {
    var h1 = slide.querySelector(":scope > h1");
    var sub = slide.querySelector(":scope > .subtitle");
    var bar = el("div", "mbz-title-bar");
    if (h1) bar.appendChild(h1);
    if (sub) bar.appendChild(sub);
    var meta = el("div", "mbz-title-meta");
    Array.prototype.slice.call(slide.childNodes).forEach(function (k) {
      if (k.nodeType === 1 && k.tagName === "ASIDE") return;
      meta.appendChild(k);
    });
    var logos = logoSet(slide.dataset.logos || cfg.titleLogos, "light");
    if (logos) meta.appendChild(logos);
    slide.appendChild(bar);
    slide.appendChild(meta);
    var bottom = el("div", "mbz-bottom floating");
    slide.appendChild(bottom);
    slide.classList.add("no-footer");
  }

  function buildClosingSlide(slide, cfg, titleSlide) {
    var hasContent = slide.querySelector(":scope > h1, :scope > h2, :scope > p, :scope > div");
    var body = el("div", "mbz-close-body");
    if (!hasContent) {
      body.appendChild(el("h1", null, "Thank You"));
      body.appendChild(el("p", "subtitle", "Questions?"));
      if (titleSlide) {
        $all(".presenter, .author, .authors", titleSlide).slice(0, 1).forEach(function (a) {
          var p = el("p", "author"); p.innerHTML = a.innerHTML; body.appendChild(p);
        });
        $all(".institute", titleSlide).slice(0, 1).forEach(function (a) {
          var p = el("p", "institute"); p.innerHTML = a.innerHTML; body.appendChild(p);
        });
      }
    } else {
      Array.prototype.slice.call(slide.childNodes).forEach(function (k) {
        if (k.nodeType === 1 && k.tagName === "ASIDE") return;
        if (k.nodeType === 1 && k.tagName === "H2") { var h = el("h1"); h.innerHTML = k.innerHTML; k.remove(); body.appendChild(h); return; }
        body.appendChild(k);
      });
    }
    var logos = logoSet(slide.dataset.logos || cfg.titleLogos, "light");
    if (logos) body.appendChild(logos);
    slide.appendChild(el("div", "mbz-close-bar"));
    slide.appendChild(body);
    slide.appendChild(el("div", "mbz-bottom floating"));
    slide.classList.add("no-footer");
  }

  function buildSectionSlide(slide, sectionIndex) {
    var name = slide.dataset.section || (slide.querySelector("h2") || {}).textContent || "";
    var body = el("div", "mbz-section-body");
    body.appendChild(el("div", "section-num", slide.dataset.sectionLabel || ("Section " + sectionIndex)));
    var h = el("h2", "section-title");
    var givenH2 = slide.querySelector(":scope > h2");
    h.innerHTML = givenH2 ? givenH2.innerHTML : escapeHtml(name);
    if (givenH2) givenH2.remove();
    body.appendChild(h);
    body.appendChild(el("div", "section-rule"));
    Array.prototype.slice.call(slide.childNodes).forEach(function (k) {
      if (k.nodeType === 1 && k.tagName === "ASIDE") return;
      if (k.nodeType === 1 && k.tagName === "P" && !k.className) k.classList.add("section-lead");
      body.appendChild(k);
    });
    slide.appendChild(body);
    slide.appendChild(el("div", "mbz-bottom floating"));
  }

  function addFooter(slide, cfg, ctx) {
    if (slide.classList.contains("no-footer")) return;
    var f = el("footer", "mbz-footer");
    function fill(tpl) {
      return String(tpl == null ? "" : tpl)
        .replace(/\{page\}/g, ctx.page).replace(/\{total\}/g, ctx.total)
        .replace(/\{section\}/g, escapeHtml(ctx.section || "")).replace(/\{title\}/g, escapeHtml(ctx.title || ""));
    }
    var left = fill(cfg.footLeft != null ? cfg.footLeft : ctx.shortTitle);
    var mid = fill(cfg.footMid != null ? cfg.footMid : ctx.subtitle);
    var right = fill(cfg.footRight != null ? cfg.footRight : "{page} / {total}");
    if (left) f.appendChild(el("span", "foot-left", left));
    if (left && mid) f.appendChild(el("span", "foot-sep", "|"));
    if (mid) f.appendChild(el("span", "foot-mid", mid));
    f.appendChild(el("span", "foot-right", right));
    slide.appendChild(f);
  }

  // ── Blocks and theorem environments ───────────────────────────────────
  function prepareBlocks(slide) {
    $all(".block", slide).forEach(function (b) {
      if (b.querySelector(":scope > .block-body")) return;
      var title = b.querySelector(":scope > .block-title");
      var body = el("div", "block-body");
      Array.prototype.slice.call(b.childNodes).forEach(function (k) { if (k !== title) body.appendChild(k); });
      if (!title && b.dataset.title) { title = el("div", "block-title"); title.innerHTML = b.dataset.title; }
      if (title) b.appendChild(title);
      b.appendChild(body);
    });
  }

  function insertHead(container, headEl) {
    var first = container.firstElementChild;
    var leadingText = "";
    for (var n = container.firstChild; n && n !== first; n = n.nextSibling) leadingText += n.textContent || "";
    if (first && first.tagName === "P" && !leadingText.trim()) {
      first.insertBefore(document.createTextNode(" "), first.firstChild);
      first.insertBefore(headEl, first.firstChild);
    } else {
      container.insertBefore(document.createTextNode(" "), container.firstChild);
      container.insertBefore(headEl, container.firstChild);
    }
  }

  // ======================================================================
  //  Main pipeline
  // ======================================================================
  function build() {
    var deck = document.querySelector(".deck");
    if (!deck) { console.error("[MBZUAI] No .deck element found."); return; }
    var cfg = readConfig(deck);
    katexOptions = {
      macros: cfg.macros, strict: "ignore", output: "htmlAndMathml",
      trust: function (ctx) { return ctx.command === "\\htmlData"; }
    };

    var slides = $all(":scope > section.slide, :scope > .slide", deck);
    var titleSlide = slides.filter(function (s) { return s.classList.contains("title-slide"); })[0] || null;

    // ── 0. Detect a raw "<" inside math, which the HTML parser turns into a bogus tag
    $all("*", deck).forEach(function (n) {
      var bad = /[$\\{}^]/.test(n.tagName) ||
        Array.prototype.some.call(n.attributes, function (a) { return /[$\\{}^]/.test(a.name); });
      if (bad) {
        var si = slides.indexOf(n.closest(".slide")) + 1;
        warn("Slide " + si + ': raw "<" inside math was parsed as an HTML tag <' + n.tagName.toLowerCase() +
          ">. Write \\lt or &lt; instead of <, and \\gt or &gt; instead of >.");
      }
    });

    // ── 1. Math / LaTeX command segmentation (before anything moves) ────
    slides.forEach(function (s) { segmentMath(s); });

    // ── 2. Sections ─────────────────────────────────────────────────────
    var sections = [];
    var current = null;
    slides.forEach(function (s) {
      var sec = s.dataset.section;
      if (!sec && s.classList.contains("section-slide")) {
        var h = s.querySelector("h2"); sec = h ? h.textContent.trim() : "";
        s.dataset.section = sec;
      }
      if (sec && sec !== current) { sections.push(sec); current = sec; }
      if (!s.classList.contains("title-slide") && !s.classList.contains("closing-slide")) s.dataset.mbzSection = current || "";
    });

    // ── 3. Chrome ───────────────────────────────────────────────────────
    slides.forEach(function (s) {
      if (s.classList.contains("title-slide")) buildTitleSlide(s, cfg);
      else if (s.classList.contains("closing-slide")) buildClosingSlide(s, cfg, titleSlide);
      else if (s.classList.contains("section-slide")) buildSectionSlide(s, sections.indexOf(s.dataset.section) + 1);
      else buildRegularSlide(s, cfg);
      prepareBlocks(s);
    });

    // ── 4. Equations: extract TeX, labels, numbers ──────────────────────
    var labels = {};
    function register(id, kind, num, slide, elx) {
      if (!id) return;
      if (labels[id]) warn('Duplicate label "' + id + '"');
      labels[id] = { kind: kind, num: num, slide: slide };
      if (elx && !elx.id) elx.id = id;
    }
    var eqCounter = 0, secEq = {}, counters = {};
    slides.forEach(function (s, si) {
      $all(".equation", s).forEach(function (eq) {
        if (eq.dataset.mbzDone) return;
        eq.dataset.mbzDone = "1";
        var tex = eq.getAttribute("data-tex") || eq.textContent;
        var label = eq.id || eq.dataset.label || "";
        tex = tex.replace(/\\label\s*\{([^}]*)\}/g, function (m0, l) { if (!label) label = l.trim(); return ""; });
        tex = tex.replace(/\\(nonumber|notag)\b/g, function () { eq.classList.add("nonumber"); return ""; });
        var tag = null;
        tex = tex.replace(/\\tag\*?\s*\{([^}]*)\}/g, function (m0, t) { tag = t; return ""; });
        var envM = /^\s*\\begin\{(equation\*?|align\*?|gather\*?)\}([\s\S]*)\\end\{\1\}\s*$/.exec(tex);
        if (envM) { var r = envToTex(envM[1], envM[2]); tex = r.tex; if (!r.numbered) eq.classList.add("nonumber"); }
        eq.textContent = "";
        var bodyEl = el("div", "eq-body");
        bodyEl.setAttribute("data-tex", tex.trim());
        eq.appendChild(bodyEl);
        var num = null;
        if (tag != null) num = tag;
        else if (!eq.classList.contains("nonumber")) {
          if (cfg.equationNumbering === "section") {
            var sidx = Math.max(1, sections.indexOf(s.dataset.mbzSection) + 1);
            secEq[sidx] = (secEq[sidx] || 0) + 1;
            num = sidx + "." + secEq[sidx];
          } else num = String(++eqCounter);
        }
        if (num != null) {
          eq.appendChild(el("span", "eq-num", "(" + escapeHtml(num) + ")"));
          register(label, "eq", num, si, eq);
        } else if (label) register(label, "eq", "?", si, eq);
      });

      // Figures / tables / algorithms
      $all("figure", s).forEach(function (fig) {
        var cap = fig.querySelector(":scope > figcaption");
        if (!cap || fig.classList.contains("nonumber") || (fig.parentElement && fig.parentElement.closest("figure"))) return;
        var kind = fig.classList.contains("table") ? "table" : fig.classList.contains("algorithm") ? "algorithm" : "figure";
        counters[kind] = (counters[kind] || 0) + 1;
        var num = counters[kind];
        var lab = el("span", "cap-label", REF_NAMES[kind] + " " + num + ":");
        cap.insertBefore(document.createTextNode(" "), cap.firstChild);
        cap.insertBefore(lab, cap.firstChild);
        register(fig.id || fig.dataset.label, kind, String(num), si, fig);
      });

      // Theorem-like environments
      Object.keys(THEOREM_KINDS).forEach(function (kind) {
        $all("." + kind, s).forEach(function (env) {
          if (env.classList.contains("block")) return; // .block.example is a block, not an env
          var num = null;
          if (!env.classList.contains("nonumber")) { counters[kind] = (counters[kind] || 0) + 1; num = counters[kind]; }
          var note = env.dataset.name || env.dataset.title;
          var head = el("span", "thm-head",
            THEOREM_KINDS[kind] + (num != null ? " " + num : "") +
            (note ? ' <span class="thm-note">(' + note + ")</span>" : "") + ".");
          insertHead(env, head);
          register(env.id || env.dataset.label, kind, num != null ? String(num) : "?", si, env);
        });
      });
      $all(".proof", s).forEach(function (pf) {
        insertHead(pf, el("span", "proof-head", (pf.dataset.title || "Proof") + "."));
        var tgt = pf.lastElementChild && pf.lastElementChild.tagName === "P" ? pf.lastElementChild : pf;
        tgt.appendChild(el("span", "qed", "□"));
      });
    });
    sections.forEach(function (name, idx) {
      var sl = slides.filter(function (s) { return s.dataset.section === name; })[0];
      if (sl) register(sl.dataset.sectionId || null, "section", String(idx + 1), slides.indexOf(sl), null);
    });

    // ── 5. Bibliography & citations ─────────────────────────────────────
    var bibRaw = {};
    $all('script[type="text/x-bibtex"], script[type="application/x-bibtex"]').forEach(function (sc) {
      Object.assign(bibRaw, parseBibtex(sc.textContent));
    });
    $all('script[type="application/json"]#bibliography, script[type="application/json"][data-bibliography]').forEach(function (sc) {
      try {
        var arr = JSON.parse(sc.textContent);
        (Array.isArray(arr) ? arr : Object.keys(arr).map(function (k) { var o = arr[k]; o.id = o.id || k; return o; }))
          .forEach(function (o) {
            var f = {}; Object.keys(o).forEach(function (k) { f[k.toLowerCase()] = o[k]; });
            f._key = o.id || o.key; f._type = (o.type || "misc").toLowerCase();
            if (Array.isArray(o.author)) f.author = o.author;
            bibRaw[f._key] = f;
          });
      } catch (e) { warn("Invalid bibliography JSON: " + e.message); }
    });
    var renderInline = function (tex) { return renderTex(tex, false, "bibliography"); };
    var bib = {};
    Object.keys(bibRaw).forEach(function (k) {
      var raw = bibRaw[k];
      if (Array.isArray(raw.author)) { var e = normalizeEntry(Object.assign({}, raw, { author: null }), renderInline); e.authors = parseNames(raw.author); bib[k] = e; }
      else bib[k] = normalizeEntry(raw, renderInline);
    });

    // author-year disambiguation (2019a, 2019b)
    if (cfg.citeStyle === "author-year") {
      var groups = {};
      Object.keys(bib).forEach(function (k) { var e = bib[k]; var g = namesShort(e) + "|" + e.year; (groups[g] = groups[g] || []).push(e); });
      Object.keys(groups).forEach(function (g) {
        var list = groups[g];
        if (list.length < 2) return;
        list.sort(function (a, b) { return a.titleText.localeCompare(b.titleText); });
        list.forEach(function (e, idx) { e.suffix = String.fromCharCode(97 + idx); });
      });
    }

    var citeOrder = [];
    var citeNum = {};
    var slideCites = slides.map(function () { return []; });
    slides.forEach(function (s, si) {
      if (s.classList.contains("references")) return;
      $all("cite", s).forEach(function (c) {
        var keys = (c.getAttribute("data-key") || c.textContent).split(",").map(function (k) { return k.trim(); }).filter(Boolean);
        c.setAttribute("data-key", keys.join(","));
        keys.forEach(function (k) {
          if (!bib[k]) { if (report.missingCitations.indexOf(k) < 0) { report.missingCitations.push(k); warn('Missing bibliography entry "' + k + '"'); } return; }
          if (citeNum[k] == null) { citeOrder.push(k); citeNum[k] = citeOrder.length; }
          slideCites[si].push(k);
        });
      });
    });

    function citeHtml(c) {
      var keys = c.getAttribute("data-key").split(",").filter(Boolean);
      var textual = c.classList.contains("t") || c.classList.contains("textual");
      var note = c.dataset.note ? ", " + escapeHtml(c.dataset.note) : "";
      var found = keys.filter(function (k) { return bib[k]; });
      var missing = keys.filter(function (k) { return !bib[k]; });
      if (missing.length) c.classList.add("mbz-missing");
      var miss = missing.map(function (k) { return "?" + escapeHtml(k); });
      var link = function (k, txt) { return '<a href="#bib-' + escapeHtml(k) + '">' + txt + "</a>"; };
      if (cfg.citeStyle === "numeric") {
        var nums = found.map(function (k) { return citeNum[k]; }).sort(function (a, b) { return a - b; });
        var byNum = {}; found.forEach(function (k) { byNum[citeNum[k]] = k; });
        // compress runs: 1, 2, 3 → 1–3
        var parts = [];
        for (var q = 0; q < nums.length; q++) {
          var r = q;
          while (r + 1 < nums.length && nums[r + 1] === nums[r] + 1) r++;
          if (r - q >= 2) { parts.push(link(byNum[nums[q]], nums[q]) + "–" + link(byNum[nums[r]], nums[r])); q = r; }
          else parts.push(link(byNum[nums[q]], nums[q]));
        }
        parts = parts.concat(miss);
        if (textual) {
          return found.map(function (k) { return escapeHtml(namesShort(bib[k])) + " [" + link(k, citeNum[k]) + "]"; }).concat(miss).join(", ");
        }
        return "[" + parts.join(", ") + note + "]";
      }
      // author-year
      if (textual) {
        return found.map(function (k) {
          var e = bib[k]; return escapeHtml(namesShort(e)) + " (" + link(k, escapeHtml(e.year + e.suffix)) + (found.length === 1 ? note : "") + ")";
        }).concat(miss).join("; ");
      }
      var items = found.map(function (k) { var e = bib[k]; return escapeHtml(namesShort(e)) + ", " + link(k, escapeHtml(e.year + e.suffix)); });
      return "(" + items.concat(miss).join("; ") + note + ")";
    }
    slides.forEach(function (s) { $all("cite", s).forEach(function (c) { c.innerHTML = citeHtml(c); }); });

    // ── 6. Cross-references ─────────────────────────────────────────────
    slides.forEach(function (s) {
      $all("a.ref, a.eqref, a[data-ref]", s).forEach(function (a) {
        var id = (a.getAttribute("data-ref") || a.getAttribute("href") || "").replace(/^#/, "");
        var style = a.getAttribute("data-ref-style") || (a.classList.contains("eqref") ? "eqref" : "cref");
        if (!a.getAttribute("href")) a.setAttribute("href", "#" + id);
        var L = labels[id];
        if (!L) {
          if (report.missingLabels.indexOf(id) < 0) { report.missingLabels.push(id); warn('Undefined reference "' + id + '"'); }
          a.classList.add("mbz-missing");
          if (!a.textContent.trim()) a.textContent = "??";
          return;
        }
        if (a.textContent.trim()) return; // author supplied text
        var txt;
        if (style === "eqref" || (style === "ref" && L.kind === "eq")) txt = "(" + L.num + ")";
        else if (style === "ref") txt = L.num;
        else txt = (REF_NAMES[L.kind] || "") + " " + (L.kind === "eq" ? "(" + L.num + ")" : L.num);
        a.textContent = txt;
      });
    });

    // ── 7. Footnotes, per-slide references, source locators ─────────────
    var globalFn = 0;
    slides.forEach(function (s, si) {
      var bottom = s.querySelector(".mbz-bottom");
      if (!bottom) return;
      var fns = $all(".footnote, .fn", s).filter(function (f) { return !f.closest(".mbz-bottom"); });
      if (fns.length) {
        var list = el("ol", "mbz-footnotes");
        fns.forEach(function (f, idx) {
          var n = cfg.footnoteNumbering === "global" ? ++globalFn : idx + 1;
          var mark = cfg.footnoteStyle === "symbol" ? FOOTNOTE_SYMBOLS[(n - 1) % FOOTNOTE_SYMBOLS.length] : String(n);
          if (f.dataset.mark) mark = f.dataset.mark;
          var sup = el("sup", "fn-mark", escapeHtml(mark));
          var li = el("li");
          li.appendChild(el("span", "fn-num", escapeHtml(mark)));
          while (f.firstChild) li.appendChild(f.firstChild);
          f.parentNode.replaceChild(sup, f);
          list.appendChild(li);
        });
        bottom.appendChild(list);
      }
      var keys = uniq(slideCites[si]);
      var slideRefsOn = s.dataset.slideRefs ? s.dataset.slideRefs !== "false" : cfg.slideRefs;
      if (slideRefsOn && keys.length && !s.classList.contains("references")) {
        if (cfg.citeStyle === "numeric") keys.sort(function (a, b) { return citeNum[a] - citeNum[b]; });
        var rl = el("ol", "mbz-slide-refs" + (cfg.citeStyle === "author-year" ? " author-year" : ""));
        keys.forEach(function (k) {
          var li = el("li");
          if (cfg.citeStyle === "numeric") li.appendChild(el("span", "ref-num", "[" + citeNum[k] + "]"));
          li.insertAdjacentHTML("beforeend", formatShort(bib[k]));
          rl.appendChild(li);
        });
        bottom.appendChild(rl);
      }
      var main = s.querySelector(".mbz-main");
      if (main) $all(":scope > .source", main).forEach(function (src) { bottom.appendChild(src); });
    });

    // ── 8. TOC ──────────────────────────────────────────────────────────
    slides.forEach(function (s) {
      $all(".toc", s).forEach(function (toc) {
        var ol = toc.tagName === "OL" ? toc : el("ol", "toc");
        if (ol !== toc) { ol.className = toc.className; toc.parentNode.replaceChild(ol, toc); }
        var cur = toc.dataset.current || (toc.hasAttribute("data-highlight") ? s.dataset.mbzSection : null);
        ol.innerHTML = "";
        sections.forEach(function (name) {
          var li = el("li", cur ? (name === cur ? "current" : "dim") : "", escapeHtml(name));
          ol.appendChild(li);
        });
      });
    });

    // ── 9. Notation glossaries (hover a symbol to see its meaning) ───────
    var glossaries = slides.map(function () { return null; });
    var deckKeys = [];
    if (cfg.notationHover) {
      var parseNotationJson = function (sc, into) {
        try {
          var obj = JSON.parse(sc.textContent);
          Object.keys(obj).forEach(function (key) {
            var v = obj[key];
            var meaning = typeof v === "string" ? v : (v && (v.meaning || v.text || v.description)) || "";
            into[key] = notationEntry(key, meaning, v && typeof v === "object" ? v.type : "");
          });
        } catch (e) { warn("Invalid notation JSON: " + e.message); }
      };
      var deckMap = {};
      $all('script[type="application/json"]#notation, script[type="application/json"][data-notation]').forEach(function (sc) {
        if (!sc.closest(".slide")) parseNotationJson(sc, deckMap);
      });
      deckKeys = Object.keys(deckMap).map(function (k) { return deckMap[k]; });

      // Harvest notation tables: first cell = symbol(s), last cell = meaning, middle = type.
      var tableGlobal = {};
      var tableLocal = slides.map(function () { return {}; });
      slides.forEach(function (s, si) {
        $all("table.notation tbody tr", s).forEach(function (tr) {
          var cells = tr.cells;
          if (!cells || cells.length < 2) return;
          var keys = [];
          if (tr.dataset.sym) keys = tr.dataset.sym.split("|");
          else $all(".mbz-math", cells[0]).forEach(function (mm) {
            splitTopLevel(mm.getAttribute("data-tex") || "", /,/y).forEach(function (part) {
              part = part.replace(/\\(?:[ ,;:!]|quad|qquad)|~/g, " ").trim();
              if (part) keys.push(part);
            });
          });
          var meaningCell = cells[cells.length - 1];
          var type = cells.length >= 3 ? cells[1].textContent.trim() : "";
          keys.forEach(function (key) {
            var e = notationEntry(key, function () { return meaningCell.innerHTML; }, type);
            tableLocal[si][key] = e;
            if (!tableGlobal[key] && tr.closest("table").dataset.notation !== "local") tableGlobal[key] = e;
          });
        });
      });

      slides.forEach(function (s, si) {
        var local = {};
        $all('script[type="application/json"].notation, script[type="application/json"][data-notation]', s)
          .forEach(function (sc) { parseNotationJson(sc, local); });
        var map = Object.assign({}, tableGlobal, deckMap, tableLocal[si], local);
        glossaries[si] = compileGlossary(map);
      });
    }

    // ── 10. Render math ─────────────────────────────────────────────────
    function renderSlideTex(tex, display, si) {
      var gl = glossaries[si];
      if (gl && window.katex) {
        var annotated = annotateTex(tex, gl);
        if (annotated !== tex) {
          try {
            return window.katex.renderToString(annotated, Object.assign({}, katexOptions, { displayMode: display, throwOnError: true }));
          } catch (e) { notationStats.skipped++; }
        }
      }
      return renderTex(stripExplain(tex), display, si + 1);
    }
    slides.forEach(function (s, si) {
      $all(".mbz-math", s).forEach(function (m) {
        var display = m.getAttribute("data-display") === "true";
        m.innerHTML = renderSlideTex(m.getAttribute("data-tex"), display, si);
      });
      $all(".equation > .eq-body", s).forEach(function (b) {
        b.innerHTML = renderSlideTex(b.getAttribute("data-tex"), true, si);
      });
    });
    report.notation = {
      entries: NOTATION.length,
      annotatedSymbols: notationStats.annotated,
      unusedDeckKeys: deckKeys.filter(function (e) { return !e.used; }).map(function (e) { return e.key; }),
      fallbackFormulas: notationStats.skipped
    };

    // ── 11. References slide(s) ─────────────────────────────────────────
    var refSlides = slides.filter(function (s) { return s.classList.contains("references"); });
    refSlides.forEach(function (s) {
      var main = s.querySelector(".mbz-main") || s;
      var ol = main.querySelector("ol.bibliography");
      if (!ol) { ol = el("ol", "bibliography"); main.appendChild(ol); }
      ol.classList.toggle("author-year", cfg.citeStyle === "author-year");
      var keys = (cfg.bibAll || s.dataset.bibAll === "true") ? Object.keys(bib) : citeOrder.slice();
      if (cfg.bibAll && cfg.citeStyle === "numeric") {
        keys = citeOrder.concat(Object.keys(bib).filter(function (k) { return citeNum[k] == null; }));
        keys.forEach(function (k) { if (citeNum[k] == null) { citeOrder.push(k); citeNum[k] = citeOrder.length; } });
      }
      if (cfg.citeStyle === "author-year") {
        keys.sort(function (a, b) {
          var ea = bib[a], eb = bib[b];
          return (ea.authors[0] ? ea.authors[0].last : ea.titleText).localeCompare(eb.authors[0] ? eb.authors[0].last : eb.titleText) ||
            (ea.year + ea.suffix).localeCompare(eb.year + eb.suffix);
        });
      }
      ol.innerHTML = "";
      keys.forEach(function (k) {
        var li = el("li");
        li.id = "bib-" + k;
        li.appendChild(el("span", "bib-label", "[" + citeNum[k] + "]"));
        li.insertAdjacentHTML("beforeend", formatFull(bib[k], cfg.citeStyle, cfg.bibMaxAuthors));
        ol.appendChild(li);
      });
      if (!keys.length) ol.appendChild(el("li", "muted", "No references cited."));
    });

    deck.classList.add("mbz-built");
    return { deck: deck, cfg: cfg, slides: slides, sections: sections, titleSlide: titleSlide, labels: labels };
  }

  // ── Layout passes that need real measurements ─────────────────────────
  function measurePass(ctx) {
    var deck = ctx.deck;
    document.body.classList.add("mbz-measuring");
    var styleTag = el("style", null, "body.mbz-measuring .deck > .slide{display:block !important;}");
    document.head.appendChild(styleTag);

    // Title auto-shrink (like the Beamer theme)
    $all(".slide.title-slide", deck).forEach(function (s) {
      var h1 = s.querySelector(".mbz-title-bar h1");
      var bar = s.querySelector(".mbz-title-bar");
      if (h1) {
        var size = 64;
        var lh = function () { return parseFloat(getComputedStyle(h1).lineHeight) || size * 1.08; };
        while (size > 38 && (h1.scrollWidth > h1.clientWidth + 1 || h1.offsetHeight > lh() * 2.2)) {
          size -= 2; h1.style.fontSize = size + "px";
        }
      }
      if (bar) s.style.setProperty("--title-bar-h", bar.offsetHeight + "px");
    });

    // Frame titles: shrink long titles so they stay on one line in the banner
    // (two lines at the minimum size as a last resort).
    $all(".mbz-header .frametitle", deck).forEach(function (h) {
      if (h.querySelector(".framesubtitle")) return;
      var size = parseFloat(getComputedStyle(h).fontSize) || 40;
      var oneLine = function () { return h.offsetHeight <= size * 1.12 * 1.3; };
      while (!oneLine() && size > 28) { size -= 1; h.style.fontSize = size + "px"; }
      if (!oneLine()) {
        var si = $all(":scope > .slide", deck).indexOf(h.closest(".slide")) + 1;
        warn("Slide " + si + ": frame title is too long for one line; shorten it.");
      }
    });

    // Paginate references slides
    $all(".slide.references", deck).forEach(function (s) {
      var guard = 0;
      var currentSlide = s;
      while (guard++ < 20) {
        var body = currentSlide.querySelector(".mbz-body");
        var ol = currentSlide.querySelector("ol.bibliography");
        if (!body || !ol || body.scrollHeight <= body.clientHeight + 2 || ol.children.length < 2) break;
        var clone = currentSlide.cloneNode(true);
        var cOl = clone.querySelector("ol.bibliography");
        cOl.innerHTML = "";
        while (body.scrollHeight > body.clientHeight + 2 && ol.children.length > 1) {
          cOl.insertBefore(ol.lastElementChild, cOl.firstChild);
        }
        var t = clone.querySelector(".frametitle");
        if (t && !/\(cont\.\)/.test(t.textContent)) t.insertAdjacentText("beforeend", " (cont.)");
        // anything before the list (intro text) only on the first page
        var cMain = clone.querySelector(".mbz-main");
        Array.prototype.slice.call(cMain.children).forEach(function (k) { if (k !== cOl) k.remove(); });
        currentSlide.parentNode.insertBefore(clone, currentSlide.nextSibling);
        currentSlide = clone;
      }
    });

    var slides = $all(":scope > .slide", deck);
    // Footer + page numbers (after pagination)
    var shortTitle = ctx.cfg.shortTitle;
    var subtitle = "";
    if (ctx.titleSlide) {
      var h1 = ctx.titleSlide.querySelector("h1");
      if (!shortTitle) shortTitle = ctx.titleSlide.dataset.shortTitle || (h1 ? h1.textContent.trim() : "");
      var st = ctx.titleSlide.querySelector(".subtitle");
      subtitle = ctx.titleSlide.dataset.footMid != null ? ctx.titleSlide.dataset.footMid : (st ? st.textContent.trim() : "");
    }
    slides.forEach(function (s, i) {
      if (!s.querySelector(":scope > .mbz-footer")) {
        addFooter(s, ctx.cfg, { page: i + 1, total: slides.length, section: s.dataset.mbzSection, title: shortTitle,
          shortTitle: escapeHtml(shortTitle || ""), subtitle: escapeHtml(subtitle || "") });
      }
    });

    // Overflow detection
    report.overflow = [];
    slides.forEach(function (s, i) {
      s.classList.remove("mbz-overflow");
      var over = false;
      var body = s.querySelector(".mbz-body");
      var main = s.querySelector(".mbz-main");
      if (body && main) {
        if (main.scrollHeight > body.clientHeight + 2 || body.scrollHeight > body.clientHeight + 2) over = true;
        if (main.scrollWidth > main.clientWidth + 2) over = true;
        var content = s.querySelector(".mbz-content");
        if (content && content.scrollHeight > content.clientHeight + 2) over = true;
      }
      var tm = s.querySelector(".mbz-title-meta, .mbz-close-body, .mbz-section-body");
      if (tm && tm.scrollHeight > tm.clientHeight + 2) over = true;
      if (over) {
        s.classList.add("mbz-overflow");
        report.overflow.push({ slide: i + 1, title: slideLabel(s) });
      }
    });
    if (report.overflow.length) {
      console.warn("[MBZUAI] Content overflows on slide(s): " + report.overflow.map(function (o) { return o.slide; }).join(", ") +
        ". Shorten text, use .small/.footnotesize, or split the slide.");
    }

    document.body.classList.remove("mbz-measuring");
    styleTag.remove();
    return slides;
  }

  // ======================================================================
  //  Viewer
  // ======================================================================
  function initNotationHover(deck) {
    if (!NOTATION.length) return function () {};
    var tip = el("div", "mbz-tip");
    tip.setAttribute("role", "tooltip");
    document.body.appendChild(tip);
    var current = null;
    var cache = {};

    function meaningHtml(e) {
      if (typeof e.meaning === "function") return e.meaning();
      if (cache[e.id] != null) return cache[e.id];
      var box = el("div");
      box.innerHTML = e.meaning;            // author-supplied HTML, may contain $math$
      segmentMath(box);
      $all(".mbz-math", box).forEach(function (m) {
        m.innerHTML = renderTex(m.getAttribute("data-tex"), m.getAttribute("data-display") === "true", "notation");
      });
      return (cache[e.id] = box.innerHTML);
    }
    function clear() {
      $all(".mbz-sym-active, .mbz-sym-hover", deck).forEach(function (n) { n.classList.remove("mbz-sym-active", "mbz-sym-hover"); });
    }
    function hide() { tip.classList.remove("show"); clear(); current = null; }
    function show(span) {
      if (span === current) return;
      var e = NOTATION[+span.getAttribute("data-mbz-sym")];
      if (!e) return;
      clear();
      current = span;
      var slide = span.closest(".slide");
      $all('[data-mbz-sym="' + e.id + '"]', slide).forEach(function (n) { n.classList.add("mbz-sym-active"); });
      span.classList.add("mbz-sym-hover");
      tip.innerHTML = '<div class="mbz-tip-head"><span class="mbz-tip-sym">' + renderTex(stripExplain(e.key), false, "notation") + "</span>" +
        (e.type ? '<span class="mbz-tip-type">' + escapeHtml(e.type) + "</span>" : "") + "</div>" +
        '<div class="mbz-tip-body">' + meaningHtml(e) + "</div>";
      var scale = parseFloat(deck.style.getPropertyValue("--scale")) || 1;
      tip.style.fontSize = Math.max(13, 19 * scale) + "px";
      tip.style.maxWidth = Math.max(240, 480 * scale) + "px";
      tip.style.left = "0px"; tip.style.top = "0px";
      tip.classList.add("show");
      var r = span.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight, gap = 10 * scale + 4;
      var left = Math.min(window.innerWidth - tw - 8, Math.max(8, r.left + r.width / 2 - tw / 2));
      var top = r.top - th - gap;
      if (top < 8) top = r.bottom + gap;
      tip.style.left = left + "px";
      tip.style.top = top + "px";
    }
    // Geometric hit-testing: KaTeX stacks positioned layers (vlists, radicals) over
    // glyphs, so elementFromPoint is unreliable. Pick the smallest symbol box under the pointer.
    function symAt(x, y) {
      var slide = deck.querySelector(":scope > .slide.active");
      if (!slide) return null;
      var best = null, bestArea = Infinity;
      $all("[data-mbz-sym]", slide).forEach(function (n) {
        if (n.closest(".fragment:not(.visible)")) return;
        var rects = n.getClientRects();
        for (var q = 0; q < rects.length; q++) {
          var r = rects[q];
          if (x >= r.left - 1 && x <= r.right + 1 && y >= r.top - 1 && y <= r.bottom + 1) {
            var area = r.width * r.height;
            if (area < bestArea) { best = n; bestArea = area; }
          }
        }
      });
      return best;
    }
    deck.addEventListener("mousemove", function (ev) {
      if (document.body.classList.contains("mbz-overview")) return;
      var span = symAt(ev.clientX, ev.clientY);   // a few dozen rects per slide: cheap enough per event
      if (span) show(span); else if (current) hide();
    });
    deck.addEventListener("mouseleave", hide);
    deck.addEventListener("click", function (ev) {   // touch screens: tap a symbol
      if (document.body.classList.contains("mbz-overview")) return;
      var span = symAt(ev.clientX, ev.clientY);
      if (span) { show(span); ev.stopPropagation(); }
    }, true);
    window.addEventListener("scroll", hide, true);
    return hide;
  }

  function initViewer(deck, slides) {
    var params = new URLSearchParams(location.search);
    var printMode = params.has("print");
    if (params.has("debug")) document.body.classList.add("mbz-debug");
    if (printMode) document.body.classList.add("mbz-print");


    var idx = 0;
    var step = 0;
    var frags = slides.map(function (s) {
      var list = $all(".fragment", s);
      var counter = 0;
      list.forEach(function (f) {
        var st = f.dataset.step ? parseInt(f.dataset.step, 10) : ++counter;
        if (f.dataset.step) counter = Math.max(counter, st);
        f._mbzStep = st;
      });
      return { list: list, max: list.reduce(function (m, f) { return Math.max(m, f._mbzStep); }, 0) };
    });

    function applyFragments() {
      var F = frags[idx];
      F.list.forEach(function (f) {
        f.classList.toggle("visible", f._mbzStep <= step);
        f.classList.toggle("past", f._mbzStep < step);
      });
    }
    function fit() {
      var s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
      deck.style.setProperty("--scale", String(s));
    }
    function show(i, st, noHash) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      if (hideTip) hideTip();
      slides[idx].classList.remove("active");
      idx = i;
      slides[idx].classList.add("active");
      step = st === "end" ? frags[idx].max : (st || 0);
      applyFragments();
      if (!noHash) history.replaceState(null, "", "#/" + (idx + 1));
      document.title = document.title.replace(/ \[\d+\/\d+\]$/, "");
    }
    function next() { if (step < frags[idx].max) { step++; applyFragments(); } else if (idx < slides.length - 1) show(idx + 1, 0); }
    function prev() { if (step > 0) { step--; applyFragments(); } else if (idx > 0) show(idx - 1, "end"); }
    function slideOf(node) { var s = node && node.closest(".slide"); return s ? slides.indexOf(s) : -1; }
    function gotoHash(h) {
      if (!h || h === "#") return false;
      var m = /^#\/(\d+)/.exec(h);
      if (m) { show(parseInt(m[1], 10) - 1, 0, true); return true; }
      var target = document.getElementById(decodeURIComponent(h.slice(1)));
      var si = slideOf(target);
      if (si >= 0) { show(si, "end"); return true; }
      return false;
    }

    if (printMode) {
      slides.forEach(function (s) { s.classList.add("active"); });
      frags.forEach(function (F) { F.list.forEach(function (f) { f.classList.add("visible"); }); });
      return;
    }

    var hideTip = initNotationHover(deck);
    window.addEventListener("resize", function () { hideTip(); fit(); });
    fit();
    if (!gotoHash(location.hash)) show(0, 0, true);

    document.addEventListener("keydown", function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var tag = (e.target && e.target.tagName) || "";
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      var k = e.key;
      if (document.body.classList.contains("mbz-overview")) {
        if (k === "Escape" || k === "o" || k === "Enter") { toggleOverview(); e.preventDefault(); }
        return;
      }
      if (k === "ArrowRight" || k === "PageDown" || k === " " || k === "n" || k === "Enter") { next(); e.preventDefault(); }
      else if (k === "ArrowLeft" || k === "PageUp" || k === "Backspace" || k === "p") { prev(); e.preventDefault(); }
      else if (k === "ArrowDown") { show(idx + 1, 0); e.preventDefault(); }
      else if (k === "ArrowUp") { show(idx - 1, 0); e.preventDefault(); }
      else if (k === "Home") { show(0, 0); e.preventDefault(); }
      else if (k === "End") { show(slides.length - 1, "end"); e.preventDefault(); }
      else if (k === "o" || k === "Escape") { toggleOverview(); e.preventDefault(); }
      else if (k === "f") {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
        else document.exitFullscreen && document.exitFullscreen();
      } else if (k === "d") document.body.classList.toggle("mbz-debug");
      else if (k === "g") document.body.classList.toggle("mbz-show-syms");
    });

    function toggleOverview() {
      var on = document.body.classList.toggle("mbz-overview");
      slides.forEach(function (s, i) {
        s.classList.toggle("ov-current", on && i === idx);
      });
      if (on) {
        frags.forEach(function (F) { F.list.forEach(function (f) { f.classList.add("visible"); }); });
        slides[idx].scrollIntoView({ block: "center" });
      } else {
        frags.forEach(function (F, i) { if (i !== idx) F.list.forEach(function (f) { f.classList.remove("visible"); }); });
        show(idx, step);
      }
    }
    deck.addEventListener("click", function (e) {
      if (document.body.classList.contains("mbz-overview")) {
        var si = slideOf(e.target);
        if (si >= 0) { idx = si; toggleOverview(); show(si, 0); }
        e.preventDefault();
        return;
      }
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (a) {
        if (gotoHash(a.getAttribute("href"))) e.preventDefault();
      }
    });
    window.addEventListener("hashchange", function () { gotoHash(location.hash); });

    var tx = null;
    deck.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    deck.addEventListener("touchend", function (e) {
      if (tx == null) return;
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 50) { if (dx < 0) next(); else prev(); }
      tx = null;
    });

    window.addEventListener("beforeprint", function () {
      frags.forEach(function (F) { F.list.forEach(function (f) { f.classList.add("visible"); }); });
    });
    window.addEventListener("afterprint", function () { show(idx, step, true); });

    window.MBZUAI.goto = function (n) { show(n - 1, 0); };
    window.MBZUAI.next = next;
    window.MBZUAI.prev = prev;
  }

  // ======================================================================
  //  Boot
  // ======================================================================
  function ensureKatex() {
    if (window.katex) return Promise.resolve();
    loadCss(KATEX_CDN + "katex.min.css");
    return loadScript(KATEX_CDN + "katex.min.js").catch(function () {
      warn("KaTeX could not be loaded; math is shown as raw TeX.");
    });
  }

  function writeReport() {
    var old = document.getElementById("mbz-report");
    if (old) old.remove();
    var s = document.createElement("script");
    s.type = "application/json";
    s.id = "mbz-report";
    s.textContent = JSON.stringify(report, null, 2);
    document.body.appendChild(s);
    document.documentElement.setAttribute("data-mbz-ready", "true");
    document.documentElement.setAttribute("data-mbz-overflow", report.overflow.map(function (o) { return o.slide; }).join(","));
  }

  function boot() {
    ensureKatex().then(function () {
      var ctx;
      try { ctx = build(); } catch (e) { console.error("[MBZUAI] build failed", e); report.warnings.push("build failed: " + e.message); }
      if (!ctx) {
        var d = document.querySelector(".deck");
        if (d) { d.classList.add("mbz-ready"); document.body.classList.add("mbz-print"); }
        writeReport();
        return;
      }
      var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      var timeout = new Promise(function (r) { setTimeout(r, 3000); });
      Promise.race([fontsReady, timeout]).then(function () {
        // Give images a chance to get their intrinsic size
        var imgs = $all("img", ctx.deck).filter(function (i) { return !i.complete; });
        return Promise.race([Promise.all(imgs.map(function (i) {
          return new Promise(function (r) { i.addEventListener("load", r); i.addEventListener("error", r); });
        })), new Promise(function (r) { setTimeout(r, 3000); })]);
      }).then(function () {
        var slides = measurePass(ctx);
        report.slides = slides.length;
        report.sections = ctx.sections;
        report.ready = true;
        ctx.deck.classList.add("mbz-ready");
        initViewer(ctx.deck, slides);
        writeReport();
        document.dispatchEvent(new CustomEvent("mbzuai:ready", { detail: report }));
      });
    });
  }

  window.MBZUAI = { version: VERSION, report: report, parseBibtex: parseBibtex };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
