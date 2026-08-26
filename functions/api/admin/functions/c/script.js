/* ==========================================================
   تیزهۆشی — Quiz engine
   All content is self-contained; no network calls, no backend.
   ========================================================== */

(function () {
  "use strict";

  /* ---------- shape rendering helper ---------- */

  function shapeEl(cfg) {
    var kind = cfg.kind || "circle";
    var size = cfg.size || 44;
    var color = cfg.color || "var(--ink)";
    var outline = !!cfg.outline;
    var rotation = cfg.rotation || 0;

    var cls = "shape shape-" + kind;
    var style = "width:" + size + "px;height:" + size + "px;";

    if (kind === "triangle") {
      style += "--tri-w:" + size / 2 + "px;--tri-h:" + size * 0.86 + "px;--tri-color:" + color + ";width:0;height:0;";
      if (rotation) style += "transform:rotate(" + rotation + "deg);";
    } else if (outline) {
      cls += " shape-outline";
      style += "--outline-color:" + color + ";";
      if (rotation) style += "transform:rotate(" + rotation + "deg);";
    } else {
      style += "background:" + color + ";";
      var totalRotation = kind === "diamond" ? 45 + rotation : rotation;
      if (totalRotation) style += "transform:rotate(" + totalRotation + "deg);";
    }

    return '<span class="' + cls + '" style="' + style + '"></span>';
  }

  function dotsEl(count, color) {
    var out = '<span class="dot-row">';
    for (var i = 0; i < count; i++) {
      out += '<span class="dot" style="background:' + (color || "var(--ink)") + '"></span>';
    }
    out += "</span>";
    return out;
  }

  var GOLD = "#a9823f";
  var INK = "#1a2530";
  var ACCENT = "#7a2e2e";
  var TEAL = "#2f6b63";

  /* ---------- question bank ---------- */
  /* categories: number | shape | analogy | odd */

  var CATEGORY_LABELS = {
    number: "زنجیرەی ژمارە",
    shape: "لۆژیکی شێوە",
    analogy: "پەیوەندی وشە",
    odd: "وشەی نامۆ"
  };

  var CATEGORY_INSTRUCTIONS = {
    number: "کام ژمارە دواتر دێت؟",
    shape: "کام وێنە لە شوێنی نیشانەی پرسیار دادەنرێت؟",
    analogy: "پەیوەندییەکە تەواو بکە.",
    odd: "کام یەکە لەگەڵ ئەوانی تر ناگونجێت؟"
  };

  function numQ(id, sequence, options, correctIndex) {
    return {
      id: id,
      category: "number",
      bodyType: "numbers",
      numbers: sequence,
      options: options.map(function (t) { return { type: "text", label: t }; }),
      correctIndex: correctIndex
    };
  }

  function analogyQ(id, sentence, options, correctIndex) {
    return {
      id: id,
      category: "analogy",
      bodyType: "text",
      bodyText: sentence,
      options: options.map(function (t) { return { type: "text", label: t }; }),
      correctIndex: correctIndex
    };
  }

  function oddQ(id, words, correctIndex) {
    return {
      id: id,
      category: "odd",
      bodyType: "text",
      bodyText: "کام لەم وشانە لەگەڵ ئەوانی تر جیاوازە؟",
      options: words.map(function (t) { return { type: "text", label: t }; }),
      correctIndex: correctIndex
    };
  }

  function shapeQ(id, visualSeq, options, correctIndex) {
    return {
      id: id,
      category: "shape",
      bodyType: "visual",
      visual: visualSeq,
      options: options.map(function (cfg) { return { type: "shape", shape: cfg }; }),
      correctIndex: correctIndex
    };
  }

  var QUESTIONS = [];

  /* ---- number sequences (8) ---- */
  QUESTIONS.push(numQ("n1", ["2", "4", "6", "8", "؟"], ["9", "10", "11", "12"], 1));
  QUESTIONS.push(numQ("n2", ["3", "6", "9", "12", "؟"], ["14", "15", "16", "18"], 1));
  QUESTIONS.push(numQ("n3", ["1", "4", "9", "16", "؟"], ["20", "24", "25", "30"], 2));
  QUESTIONS.push(numQ("n4", ["2", "4", "8", "16", "؟"], ["24", "28", "30", "32"], 3));
  QUESTIONS.push(numQ("n5", ["1", "1", "2", "3", "5", "8", "؟"], ["11", "12", "13", "14"], 2));
  QUESTIONS.push(numQ("n6", ["5", "10", "20", "40", "؟"], ["60", "70", "80", "90"], 2));
  QUESTIONS.push(numQ("n7", ["1", "3", "6", "10", "15", "؟"], ["18", "20", "21", "22"], 2));
  QUESTIONS.push(numQ("n8", ["81", "27", "9", "3", "؟"], ["0", "1", "2", "3"], 1));

  /* ---- verbal analogies (6) ---- */
  QUESTIONS.push(analogyQ("a1", "خۆر بۆ ڕۆژ، هەروەکو مانگ بۆ ___", ["شەو", "ئەستێرە", "ئاسمان", "ڕۆژ"], 0));
  QUESTIONS.push(analogyQ("a2", "باڵندە بۆ فڕین، هەروەکو ماسی بۆ ___", ["مەلەکردن", "ڕاکردن", "گەڕان", "نووستن"], 0));
  QUESTIONS.push(analogyQ("a3", "مامۆستا بۆ قوتابخانە، هەروەکو پزیشک بۆ ___", ["نەخۆشخانە", "بازاڕ", "کارگە", "فڕۆکەخانە"], 0));
  QUESTIONS.push(analogyQ("a4", "کتێب بۆ خوێندنەوە، هەروەکو مۆسیقا بۆ ___", ["گوێگرتن", "بینین", "نووسین", "کێشان"], 0));
  QUESTIONS.push(analogyQ("a5", "سەرما بۆ زستان، هەروەکو گەرما بۆ ___", ["هاوین", "بەهار", "پاییز", "بەرەبەیان"], 0));
  QUESTIONS.push(analogyQ("a6", "دار بۆ باخ، هەروەکو ماسی بۆ ___", ["دەریا", "چۆڵەوانی", "شاخ", "شەقام"], 0));

  /* ---- odd one out (6) ---- */
  QUESTIONS.push(oddQ("o1", ["سێو", "پرتەقاڵ", "مۆز", "پیاز"], 3));
  QUESTIONS.push(oddQ("o2", ["شێر", "پڵنگ", "گورگ", "مریشک"], 3));
  QUESTIONS.push(oddQ("o3", ["سوور", "شین", "سەوز", "گەورە"], 3));
  QUESTIONS.push(oddQ("o4", ["تاکسی", "پاس", "شەمەندەفەر", "پیاسەکردن"], 3));
  QUESTIONS.push(oddQ("o5", ["سەگ", "پشیلە", "مانگا", "دار"], 3));
  QUESTIONS.push(oddQ("o6", ["کتێب", "ڕۆژنامە", "مەجەلە", "کورسی"], 3));

  /* ---- shape / pattern logic (8) ---- */

  // S1: growing dot count 1,2,3,4 -> 5
  QUESTIONS.push({
    id: "s1", category: "shape", bodyType: "visual",
    visual: { kind: "custom", html:
      '<div class="question-visual-row">' +
      dotsEl(1) + dotsEl(2) + dotsEl(3) + dotsEl(4) +
      '<span style="font-size:28px;font-weight:800;color:var(--accent)">؟</span>' +
      "</div>"
    },
    options: [
      { type: "custom", html: dotsEl(4) },
      { type: "custom", html: dotsEl(5) },
      { type: "custom", html: dotsEl(6) },
      { type: "custom", html: dotsEl(7) }
    ],
    correctIndex: 1
  });

  // S2: color pattern red, gold, red, gold, red -> gold
  QUESTIONS.push(shapeQ("s2",
    { kind: "row", items: [
      { kind: "circle", size: 40, color: ACCENT },
      { kind: "circle", size: 40, color: GOLD },
      { kind: "circle", size: 40, color: ACCENT },
      { kind: "circle", size: 40, color: GOLD },
      { kind: "circle", size: 40, color: ACCENT }
    ]},
    [
      { kind: "circle", size: 40, color: GOLD },
      { kind: "circle", size: 40, color: TEAL },
      { kind: "circle", size: 40, color: INK },
      { kind: "circle", size: 40, color: ACCENT }
    ], 0
  ));

  // S3: shape alternation circle, square, circle, square, circle -> square
  QUESTIONS.push(shapeQ("s3",
    { kind: "row", items: [
      { kind: "circle", size: 38, color: INK },
      { kind: "square", size: 38, color: INK },
      { kind: "circle", size: 38, color: INK },
      { kind: "square", size: 38, color: INK },
      { kind: "circle", size: 38, color: INK }
    ]},
    [
      { kind: "circle", size: 38, color: INK },
      { kind: "square", size: 38, color: INK },
      { kind: "diamond", size: 38, color: INK },
      { kind: "triangle", size: 38, color: INK }
    ], 1
  ));

  // S4: size growth small -> large -> next: extra-large
  QUESTIONS.push(shapeQ("s4",
    { kind: "row", items: [
      { kind: "circle", size: 20, color: TEAL },
      { kind: "circle", size: 32, color: TEAL },
      { kind: "circle", size: 44, color: TEAL }
    ]},
    [
      { kind: "circle", size: 32, color: TEAL },
      { kind: "circle", size: 40, color: TEAL },
      { kind: "circle", size: 56, color: TEAL },
      { kind: "circle", size: 20, color: TEAL }
    ], 2
  ));

  // S5: rotating triangle up, right, down, left -> up
  QUESTIONS.push(shapeQ("s5",
    { kind: "row", items: [
      { kind: "triangle", size: 34, color: ACCENT, rotation: 0 },
      { kind: "triangle", size: 34, color: ACCENT, rotation: 90 },
      { kind: "triangle", size: 34, color: ACCENT, rotation: 180 },
      { kind: "triangle", size: 34, color: ACCENT, rotation: 270 }
    ]},
    [
      { kind: "triangle", size: 34, color: ACCENT, rotation: 180 },
      { kind: "triangle", size: 34, color: ACCENT, rotation: 0 },
      { kind: "triangle", size: 34, color: ACCENT, rotation: 90 },
      { kind: "triangle", size: 34, color: ACCENT, rotation: 270 }
    ], 1
  ));

  // S6: sides increase triangle(3) square(4) pentagon(5) -> hexagon(6)
  QUESTIONS.push(shapeQ("s6",
    { kind: "row", items: [
      { kind: "triangle", size: 36, color: INK },
      { kind: "square", size: 36, color: INK },
      { kind: "pentagon", size: 40, color: INK }
    ]},
    [
      { kind: "square", size: 36, color: INK },
      { kind: "hexagon", size: 40, color: INK },
      { kind: "pentagon", size: 40, color: INK },
      { kind: "circle", size: 36, color: INK }
    ], 1
  ));

  // S7: fill alternation filled, outline, filled, outline -> filled
  QUESTIONS.push(shapeQ("s7",
    { kind: "row", items: [
      { kind: "circle", size: 36, color: ACCENT, outline: false },
      { kind: "circle", size: 36, color: ACCENT, outline: true },
      { kind: "circle", size: 36, color: ACCENT, outline: false },
      { kind: "circle", size: 36, color: ACCENT, outline: true }
    ]},
    [
      { kind: "circle", size: 36, color: ACCENT, outline: true },
      { kind: "circle", size: 36, color: ACCENT, outline: false },
      { kind: "square", size: 36, color: ACCENT, outline: false },
      { kind: "diamond", size: 36, color: ACCENT, outline: false }
    ], 1
  ));

  // S8: combined rule - size grows AND fill alternates: small-filled, medium-outline, large-filled -> xl-outline
  QUESTIONS.push(shapeQ("s8",
    { kind: "row", items: [
      { kind: "circle", size: 22, color: TEAL, outline: false },
      { kind: "circle", size: 34, color: TEAL, outline: true },
      { kind: "circle", size: 46, color: TEAL, outline: false }
    ]},
    [
      { kind: "circle", size: 46, color: TEAL, outline: false },
      { kind: "circle", size: 58, color: TEAL, outline: false },
      { kind: "circle", size: 58, color: TEAL, outline: true },
      { kind: "circle", size: 34, color: TEAL, outline: true }
    ], 2
  ));

  /* ---- harder additions ---- */

  // N9-N11: less obvious numeric rules
  QUESTIONS.push(numQ("n9", ["3", "7", "15", "31", "63", "؟"], ["95", "111", "127", "135"], 2)); // x2+1
  QUESTIONS.push(numQ("n10", ["2", "6", "12", "20", "30", "؟"], ["36", "40", "42", "44"], 2)); // n(n+1)
  QUESTIONS.push(numQ("n11", ["1", "2", "6", "24", "120", "؟"], ["600", "640", "720", "840"], 2)); // factorial

  // A7-A9: more abstract relationships
  QUESTIONS.push(analogyQ("a7", "ئاگر بۆ گەرمی، هەروەکو بەفر بۆ ___", ["سارمی", "ئاو", "زستان", "سپی"], 0));
  QUESTIONS.push(analogyQ("a8", "دەرمان بۆ نەخۆشی، هەروەکو کلیل بۆ ___", ["قوفڵ", "دەرگا", "ماڵ", "زیندان"], 0));
  QUESTIONS.push(analogyQ("a9", "پەنجە بۆ دەست، هەروەکو گەڵا بۆ ___", ["دار", "باخ", "ڕەگ", "گوڵ"], 0));

  // O7-O9: odd one out by a subtler shared property, not obvious surface category
  QUESTIONS.push(oddQ("o7", ["باران", "بەفر", "تەم", "خۆر"], 3)); // three involve moisture/precipitation
  QUESTIONS.push(oddQ("o8", ["دەرزی", "مەقەص", "تیشوو", "چەقۆ"], 2)); // three are cutting tools, thread is material
  QUESTIONS.push(oddQ("o9", ["وێنەکێشان", "پەیکەرتاشی", "وێنەگرتن", "مۆسیقا"], 3)); // three are visual arts

  // S9-S11: two independent rules layered at once - the "hardest" tier
  QUESTIONS.push(shapeQ("s9",
    { kind: "row", items: [
      { kind: "triangle", size: 30, color: ACCENT, rotation: 0 },
      { kind: "square", size: 30, color: ACCENT },
      { kind: "triangle", size: 30, color: ACCENT, rotation: 90 },
      { kind: "square", size: 30, color: ACCENT },
      { kind: "triangle", size: 30, color: ACCENT, rotation: 180 },
      { kind: "square", size: 30, color: ACCENT }
    ]},
    [
      { kind: "triangle", size: 30, color: ACCENT, rotation: 270 },
      { kind: "triangle", size: 30, color: ACCENT, rotation: 90 },
      { kind: "square", size: 30, color: ACCENT },
      { kind: "diamond", size: 30, color: ACCENT }
    ], 0
  ));
  // S10: two independent periodic cycles - shape repeats every 3, color repeats every 2
  QUESTIONS.push(shapeQ("s10",
    { kind: "row", items: [
      { kind: "circle", size: 34, color: GOLD },
      { kind: "square", size: 34, color: ACCENT },
      { kind: "diamond", size: 34, color: GOLD },
      { kind: "circle", size: 34, color: ACCENT },
      { kind: "square", size: 34, color: GOLD }
    ]},
    [
      { kind: "diamond", size: 34, color: GOLD },
      { kind: "diamond", size: 34, color: ACCENT },
      { kind: "circle", size: 34, color: ACCENT },
      { kind: "square", size: 34, color: ACCENT }
    ], 1
  ));
  // S11: exponential growth (doubling), not linear
  QUESTIONS.push({
    id: "s11", category: "shape", bodyType: "visual",
    visual: { kind: "custom", html:
      '<div class="question-visual-row">' +
      dotsEl(1) + dotsEl(2) + dotsEl(4) + dotsEl(8) +
      '<span style="font-size:28px;font-weight:800;color:var(--accent)">؟</span>' +
      "</div>"
    },
    options: [
      { type: "custom", html: dotsEl(10) },
      { type: "custom", html: dotsEl(12) },
      { type: "custom", html: dotsEl(16) },
      { type: "custom", html: dotsEl(20) }
    ],
    correctIndex: 2
  });

  /* shuffle categories together in a fixed pleasant order: gently interleaved */
  function interleave() {
    var byCat = { number: [], shape: [], analogy: [], odd: [] };
    QUESTIONS.forEach(function (q) { byCat[q.category].push(q); });
    var order = ["number", "shape", "analogy", "odd"];
    var result = [];
    var maxLen = Math.max.apply(null, order.map(function (c) { return byCat[c].length; }));
    for (var i = 0; i < maxLen; i++) {
      order.forEach(function (c) {
        if (byCat[c][i]) result.push(byCat[c][i]);
      });
    }
    return result;
  }

  var ORDERED = interleave();

  /* ---------- state ---------- */

  var state = {
    index: 0,
    answers: new Array(ORDERED.length).fill(null),
    name: "",
    lastResults: null
  };

  /* ---------- DOM refs ---------- */

  var viewIntro = document.getElementById("view-intro");
  var viewQuiz = document.getElementById("view-quiz");
  var viewGate = document.getElementById("view-gate");
  var viewResults = document.getElementById("view-results");

  var btnStart = document.getElementById("btn-start");
  var btnBack = document.getElementById("btn-back");
  var btnNext = document.getElementById("btn-next");
  var btnRetake = document.getElementById("btn-retake");
  var gateForm = document.getElementById("gate-form");
  var gateNameInput = document.getElementById("gate-name");

  var certForm = document.getElementById("cert-form");
  var certEmailInput = document.getElementById("cert-email");
  var certLinkRow = document.getElementById("cert-link-row");
  var certLinkInput = document.getElementById("cert-link-input");
  var certStatus = document.getElementById("cert-status");
  var btnCopyLink = document.getElementById("btn-copy-link");
  var btnDownloadCert = document.getElementById("btn-download-cert");

  var categoryLabelEl = document.getElementById("quiz-category-label");
  var counterEl = document.getElementById("quiz-counter");
  var progressFillEl = document.getElementById("progress-fill");
  var instructionEl = document.getElementById("question-instruction");
  var bodyEl = document.getElementById("question-body");
  var optionsEl = document.getElementById("options-grid");

  function showView(view) {
    [viewIntro, viewQuiz, viewGate, viewResults].forEach(function (v) {
      v.classList.remove("view-active");
    });
    view.classList.add("view-active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- render quiz ---------- */

  function renderQuestion() {
    var q = ORDERED[state.index];

    categoryLabelEl.textContent = CATEGORY_LABELS[q.category];
    counterEl.textContent = (state.index + 1) + " / " + ORDERED.length;
    progressFillEl.style.width = ((state.index) / ORDERED.length * 100) + "%";
    instructionEl.textContent = CATEGORY_INSTRUCTIONS[q.category];

    // body
    if (q.bodyType === "numbers") {
      var html = '<div class="question-numbers">';
      q.numbers.forEach(function (n, i) {
        if (i > 0) html += '<span class="sep">،</span>';
        html += n === "؟" ? '<span class="qmark">؟</span>' : "<span>" + n + "</span>";
      });
      html += "</div>";
      bodyEl.innerHTML = html;
    } else if (q.bodyType === "text") {
      bodyEl.innerHTML = '<p style="margin:0;text-align:center;">' + q.bodyText + "</p>";
    } else if (q.bodyType === "visual") {
      if (q.visual.kind === "custom") {
        bodyEl.innerHTML = q.visual.html;
      } else {
        var row = '<div class="question-visual-row">';
        q.visual.items.forEach(function (cfg, i) {
          row += shapeEl(cfg);
        });
        row += '<span style="font-size:28px;font-weight:800;color:var(--accent);margin-inline-start:6px;">؟</span>';
        row += "</div>";
        bodyEl.innerHTML = row;
      }
    }

    // options
    var isVisualOptions = q.options[0].type === "shape" || q.options[0].type === "custom";
    optionsEl.className = "options-grid " + (isVisualOptions ? "options-visual" : "options-text");
    optionsEl.innerHTML = "";

    q.options.forEach(function (opt, i) {
      var btn = document.createElement("button");
      btn.className = "option-btn";
      btn.type = "button";
      if (state.answers[state.index] === i) btn.classList.add("selected");

      if (opt.type === "text") {
        btn.textContent = opt.label;
      } else if (opt.type === "shape") {
        btn.innerHTML = '<span class="option-visual-inner">' + shapeEl(opt.shape) + "</span>";
      } else if (opt.type === "custom") {
        btn.innerHTML = opt.html;
      }

      btn.addEventListener("click", function () {
        state.answers[state.index] = i;
        renderQuestion();
      });

      optionsEl.appendChild(btn);
    });

    btnBack.disabled = state.index === 0;
    var answered = state.answers[state.index] !== null;
    btnNext.disabled = !answered;
    btnNext.innerHTML = state.index === ORDERED.length - 1
      ? "بینینی ئەنجام <span class=\"btn-arrow\">←</span>"
      : "پرسیاری داهاتوو <span class=\"btn-arrow\">←</span>";
  }

  /* ---------- results ---------- */

  var CATEGORY_ORDER = ["number", "shape", "analogy", "odd"];

  function computeResults() {
    var totals = { number: 0, shape: 0, analogy: 0, odd: 0 };
    var correct = { number: 0, shape: 0, analogy: 0, odd: 0 };
    var totalCorrect = 0;

    ORDERED.forEach(function (q, i) {
      totals[q.category]++;
      if (state.answers[i] === q.correctIndex) {
        correct[q.category]++;
        totalCorrect++;
      }
    });

    var pct = totalCorrect / ORDERED.length;
    // Friendly score scaled roughly onto a familiar 70-145 style band,
    // clearly framed as an informal estimate (see disclaimer).
    var scaledScore = Math.round(70 + pct * 75);

    var band, heading, summary;
    if (pct >= 0.9) {
      band = "ئاستی زۆر بەرز";
      heading = "کارلێکی مێشکی نایاب!";
      summary = "ئەنجامەکەت نیشانی دەدات کە تواناکانی لۆژیک، ژمارە و وشەت زۆر بەهێزە. بەردەوام بە لە تاقیکردنەوەی مێشکت.";
    } else if (pct >= 0.75) {
      band = "ئاستی بەرز";
      heading = "ئەنجامێکی زۆر باش!";
      summary = "تۆ لە زۆربەی جۆرەکاندا دەرچووی. کەمێک ڕاهێنانی زیاتر لە بەشە لاوازەکەت دەتوانێت یارمەتیت بدات بگەیت بۆ ئاستی بەرزتر.";
    } else if (pct >= 0.55) {
      band = "مامناوەندی بەرزتر";
      heading = "بنیاتێکی باش هەیە";
      summary = "بەشێکی زۆر لە پرسیارەکانت وەڵام دایەوە بە دروستی. ڕاهێنانی بەردەوام لە بەشە جیاوازەکان زیاتر زیرەکت دەکات.";
    } else if (pct >= 0.4) {
      band = "ئاستی مامناوەند";
      heading = "خاڵی دەستپێکی باش";
      summary = "ئەمە خاڵێکی باشە بۆ دەستپێک. هەر جۆرێک لە بەشەکان ڕاهێنانی جیاوازی دەوێت، دووبارە هەوڵبدەوە بۆ بینینی گەشەکردنت.";
    } else {
      band = "خاڵی دەستپێک";
      heading = "دەستپێکێکە، نەک کۆتایی";
      summary = "هەموو کەسێک لە شوێنێکەوە دەستپێدەکات. دووبارە هەوڵبدەوە و سەیرکە کام بەش زیاتر پێویستی بە کاتە.";
    }

    return {
      totalCorrect: totalCorrect,
      totalQuestions: ORDERED.length,
      pct: pct,
      scaledScore: scaledScore,
      band: band,
      heading: heading,
      summary: summary,
      totals: totals,
      correct: correct
    };
  }

  function renderResults() {
    var r = computeResults();
    state.lastResults = r;
    resetCertPanel();

    document.getElementById("score-number").textContent = r.scaledScore;
    document.getElementById("score-band").textContent = r.band;
    document.getElementById("results-heading").textContent = r.heading;
    document.getElementById("results-summary").textContent =
      r.summary + " (" + r.totalCorrect + " لە " + r.totalQuestions + " پرسیار بە دروستی وەڵامدرایەوە)";

    var circumference = 540.35;
    var offset = circumference * (1 - r.pct);
    var dial = document.getElementById("dial-fill-final");
    requestAnimationFrame(function () {
      dial.style.strokeDashoffset = offset;
    });

    var breakdown = document.getElementById("category-breakdown");
    breakdown.innerHTML = "";
    CATEGORY_ORDER.forEach(function (cat) {
      var total = r.totals[cat];
      var got = r.correct[cat];
      var pctCat = total ? (got / total * 100) : 0;
      var row = document.createElement("div");
      row.className = "breakdown-row";
      row.innerHTML =
        '<span class="breakdown-label">' + CATEGORY_LABELS[cat] + "</span>" +
        '<span class="breakdown-track"><span class="breakdown-fill" style="width:0%"></span></span>' +
        '<span class="breakdown-score">' + got + "/" + total + "</span>";
      breakdown.appendChild(row);
      var fill = row.querySelector(".breakdown-fill");
      requestAnimationFrame(function () {
        fill.style.width = pctCat + "%";
      });
    });

    showView(viewResults);
  }

  /* ---------- certificate panel ---------- */

  function resetCertPanel() {
    certForm.reset();
    certLinkRow.hidden = true;
    certLinkInput.value = "";
    certStatus.textContent = "";
    certStatus.className = "cert-status";
    state.certSerial = null;
  }

  function setCertStatus(text, kind) {
    certStatus.textContent = text;
    certStatus.className = "cert-status" + (kind ? " is-" + kind : "");
  }

  async function submitResultToBackend(email) {
    var r = state.lastResults;
    var payload = {
      name: state.name || "",
      email: email || "",
      website: "", // honeypot, always empty for real users
      scaledScore: r.scaledScore,
      pct: r.pct,
      band: r.band,
      totals: r.totals,
      correct: r.correct
    };

    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 8000);

    try {
      var res = await fetch("/api/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) return null;
      var data = await res.json();
      return data && data.id ? data.id : null;
    } catch (err) {
      clearTimeout(timeout);
      return null;
    }
  }

  certForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    var honeypot = certForm.querySelector('input[name="website"]').value;
    if (honeypot) return; // silently ignore, bot filled the trap field

    var email = certEmailInput.value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setCertStatus("تکایە ئیمەیلێکی دروست بنووسە.", "error");
      return;
    }

    setCertStatus("چاوەڕوان بە...", null);
    var id = await submitResultToBackend(email);

    if (!id) {
      setCertStatus("لینکی هاوبەشکردن ئێستا بەردەست نییە، بەڵام دەتوانیت وێنەی بروانامە داگریت.", "error");
      return;
    }

    var link = window.location.origin + "/c/" + id;
    certLinkInput.value = link;
    certLinkRow.hidden = false;
    setCertStatus("لینکەکەت دروستکرا!", "success");
  });

  btnCopyLink.addEventListener("click", async function () {
    try {
      await navigator.clipboard.writeText(certLinkInput.value);
      setCertStatus("لینک کۆپیکرا.", "success");
    } catch (err) {
      certLinkInput.select();
      setCertStatus("لینکەکە هەڵبژێردرا، Ctrl+C بکە بۆ کۆپیکردن.", null);
    }
  });

  /* ---------- certificate image (client-side canvas, no backend needed) ---------- */

  function certSerial() {
    if (!state.certSerial) {
      var chars = "0123456789ABCDEF";
      var code = "";
      for (var i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
      state.certSerial = "TZ-" + code;
    }
    return state.certSerial;
  }

  var CAT_ORDER_FOR_CERT = ["number", "shape", "analogy", "odd"];

  function drawCertificate() {
    var r = state.lastResults;
    var canvas = document.getElementById("cert-canvas");

    // Render at 2x so the downloaded file looks crisp on high-density phone
    // screens, not just on a standard desktop monitor.
    var SCALE = 2;
    var W = 1000, H = 780;
    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    var ctx = canvas.getContext("2d");
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.clearRect(0, 0, W, H);

    var INK_C = "#1a2530", GOLD_C = "#a9823f", ACCENT_C = "#7a2e2e",
        SOFT_C = "#55636d", FAINT_C = "#8b9395", PAPER_DEEP_C = "#efe7d4";

    // paper background with a soft tint in two corners, echoing the site's texture
    ctx.fillStyle = "#f7f3ea";
    ctx.fillRect(0, 0, W, H);
    var g1 = ctx.createRadialGradient(120, 90, 0, 120, 90, 340);
    g1.addColorStop(0, "rgba(122,46,46,0.05)");
    g1.addColorStop(1, "rgba(122,46,46,0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);
    var g2 = ctx.createRadialGradient(W - 120, H - 90, 0, W - 120, H - 90, 380);
    g2.addColorStop(0, "rgba(169,130,63,0.07)");
    g2.addColorStop(1, "rgba(169,130,63,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    // ornamental double border
    ctx.strokeStyle = "rgba(26,37,48,0.16)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(24, 24, W - 48, H - 48);
    ctx.strokeStyle = GOLD_C;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    // small diamond ornaments at the four inner corners
    function cornerDiamond(cx, cy) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = GOLD_C;
      ctx.fillRect(-5, -5, 10, 10);
      ctx.restore();
    }
    cornerDiamond(40, 40);
    cornerDiamond(W - 40, 40);
    cornerDiamond(40, H - 40);
    cornerDiamond(W - 40, H - 40);

    ctx.direction = "rtl";
    ctx.textAlign = "center";

    // seal emblem (mirrors the site's circular brand mark)
    var sealX = W / 2, sealY = 96, sealR = 30;
    ctx.beginPath();
    ctx.arc(sealX, sealY, sealR + 8, 0, Math.PI * 2);
    ctx.strokeStyle = GOLD_C;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(sealX, sealY, sealR, 0, Math.PI * 2);
    ctx.fillStyle = INK_C;
    ctx.fill();
    ctx.fillStyle = "#f7f3ea";
    ctx.font = "800 26px Vazirmatn, Tahoma, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText("ت", sealX, sealY + 2);
    ctx.textBaseline = "alphabetic";

    ctx.fillStyle = INK_C;
    ctx.font = "800 30px Vazirmatn, Tahoma, sans-serif";
    ctx.fillText("تیزهۆشی", W / 2, 168);

    ctx.fillStyle = GOLD_C;
    ctx.font = "700 15px Vazirmatn, Tahoma, sans-serif";
    ctx.fillText("بروانامەی فەرمی", W / 2, 192);

    // divider with center diamond
    function divider(y, halfWidth) {
      ctx.strokeStyle = "rgba(26,37,48,0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 - halfWidth, y);
      ctx.lineTo(W / 2 - 8, y);
      ctx.moveTo(W / 2 + 8, y);
      ctx.lineTo(W / 2 + halfWidth, y);
      ctx.stroke();
      ctx.save();
      ctx.translate(W / 2, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = GOLD_C;
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }
    divider(222, 90);

    var displayName = state.name && state.name.trim() ? state.name.trim() : "میوانێکی تیزهۆش";
    ctx.fillStyle = INK_C;
    ctx.font = "800 40px Vazirmatn, Tahoma, sans-serif";
    ctx.fillText(displayName, W / 2, 278);

    ctx.fillStyle = ACCENT_C;
    ctx.font = "700 18px Vazirmatn, Tahoma, sans-serif";
    ctx.fillText(r.band, W / 2, 310);

    ctx.fillStyle = INK_C;
    ctx.font = "900 96px Vazirmatn, Tahoma, sans-serif";
    ctx.fillText(String(r.scaledScore), W / 2, 418);

    ctx.fillStyle = SOFT_C;
    ctx.font = "500 15px Vazirmatn, Tahoma, sans-serif";
    ctx.fillText("خاڵی مامناوەند", W / 2, 444);

    divider(472, 60);

    // category breakdown, mirroring the results page
    var barLeft = 220, barRight = 780, barW = barRight - barLeft;
    var rowY = 512;
    CAT_ORDER_FOR_CERT.forEach(function (cat) {
      var total = r.totals[cat] || 0;
      var got = r.correct[cat] || 0;
      var pct = total ? got / total : 0;

      ctx.textAlign = "right";
      ctx.fillStyle = SOFT_C;
      ctx.font = "600 14px Vazirmatn, Tahoma, sans-serif";
      ctx.fillText(CATEGORY_LABELS[cat], barRight, rowY + 5);

      var trackY = rowY - 10;
      ctx.fillStyle = PAPER_DEEP_C;
      roundRect(ctx, barLeft, trackY, barW * 0.62, 7, 3.5);
      ctx.fill();
      var fillGrad = ctx.createLinearGradient(barLeft, 0, barLeft + barW * 0.62, 0);
      fillGrad.addColorStop(0, "#c9a662");
      fillGrad.addColorStop(1, ACCENT_C);
      ctx.fillStyle = fillGrad;
      roundRect(ctx, barLeft, trackY, Math.max(6, barW * 0.62 * pct), 7, 3.5);
      ctx.fill();

      ctx.textAlign = "left";
      ctx.direction = "ltr";
      ctx.fillStyle = INK_C;
      ctx.font = "700 13px Vazirmatn, Tahoma, sans-serif";
      ctx.fillText(got + "/" + total, barLeft + barW * 0.62 + 16, rowY + 5);
      ctx.direction = "rtl";

      rowY += 34;
    });

    // footer: date + serial number, both short alphanumeric strings so we
    // force LTR explicitly (see note on canvas bidi limitations below).
    ctx.textAlign = "center";
    var dateStr = new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
    ctx.direction = "ltr";
    ctx.font = "400 14px Vazirmatn, Tahoma, sans-serif";
    ctx.fillStyle = FAINT_C;
    ctx.fillText(dateStr, W / 2, H - 66);

    // Canvas text doesn't apply full bidi reordering the way HTML does, so a
    // mixed Latin/number string drawn with direction:"rtl" comes out
    // scrambled. Serial number and date are both forced to "ltr" for that reason.
    ctx.font = "500 12px Vazirmatn, Tahoma, sans-serif";
    ctx.fillStyle = "rgba(139,147,149,0.8)";
    ctx.fillText(certSerial(), W / 2, H - 44);
    ctx.direction = "rtl";
  }

  function roundRect(ctx, x, y, w, h, radius) {
    var r = Math.min(radius, h / 2, w / 2 > 0 ? w / 2 : radius);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  btnDownloadCert.addEventListener("click", function () {
    if (!document.fonts || !document.fonts.ready) {
      drawCertificate();
      triggerCertDownload();
      return;
    }
    document.fonts.ready.then(function () {
      drawCertificate();
      triggerCertDownload();
    });
  });

  function triggerCertDownload() {
    var canvas = document.getElementById("cert-canvas");
    canvas.toBlob(function (blob) {
      if (!blob) return;
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "tizhoshi-certificate.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    }, "image/png");
  }

  /* ---------- events ---------- */

  btnStart.addEventListener("click", function () {
    state.index = 0;
    renderQuestion();
    showView(viewQuiz);
  });

  btnBack.addEventListener("click", function () {
    if (state.index > 0) {
      state.index--;
      renderQuestion();
    }
  });

  btnNext.addEventListener("click", function () {
    if (state.answers[state.index] === null) return;
    if (state.index < ORDERED.length - 1) {
      state.index++;
      renderQuestion();
    } else {
      showView(viewGate);
      gateNameInput.focus();
    }
  });

  gateForm.addEventListener("submit", function (e) {
    e.preventDefault();
    state.name = gateNameInput.value.trim().slice(0, 60);
    renderResults();
  });

  btnRetake.addEventListener("click", function () {
    state.index = 0;
    state.answers = new Array(ORDERED.length).fill(null);
    showView(viewIntro);
  });

  // animate intro dial gently on load for visual interest
  window.addEventListener("load", function () {
    var introDial = document.querySelector("#view-intro .dial-fill");
    if (introDial) {
      requestAnimationFrame(function () {
        introDial.style.strokeDashoffset = 540.35 * 0.35;
      });
    }
  });
})();
