/* ============================================================
   个人主页 · 交互
   ① 手机端导航   ② 学习记录筛选 + 搜索   ③ 联系页：复制 + 表单校验
   原生 JS，无依赖。每个功能先判断元素是否存在，同一个文件挂全站。
   ============================================================ */
(function () {
  "use strict";

  /* ---------- ① 手机端导航 ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  if (navToggle && nav) {
    var closeNav = function () {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    };

    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
  }

  /* ---------- ② 学习记录：标签筛选 + 关键词搜索 ---------- */
  var list = document.getElementById("record-list");
  if (list) {
    var records = Array.prototype.slice.call(list.querySelectorAll(".record"));
    var chips = Array.prototype.slice.call(document.querySelectorAll(".chip[data-filter]"));
    var search = document.getElementById("record-search");
    var meta = document.getElementById("filter-meta");
    var noMatch = document.getElementById("no-match");
    var activeTag = "all";

    var apply = function () {
      var q = search ? search.value.trim().toLowerCase() : "";
      var shown = 0;

      records.forEach(function (rec) {
        var tags = (rec.dataset.tags || "").split(/\s+/);
        var tagOk = activeTag === "all" || tags.indexOf(activeTag) !== -1;
        var hay = ((rec.dataset.search || "") + " " + rec.textContent).toLowerCase();
        var textOk = q === "" || hay.indexOf(q) !== -1;
        var visible = tagOk && textOk;

        rec.classList.toggle("is-hidden", !visible);
        if (visible) shown++;
      });

      if (meta) meta.textContent = "显示 " + shown + " / " + records.length + " 条";
      if (noMatch) noMatch.classList.toggle("is-visible", shown === 0);
    };

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        activeTag = chip.dataset.filter;
        chips.forEach(function (c) {
          c.setAttribute("aria-pressed", String(c === chip));
        });
        apply();
      });
    });

    if (search) {
      search.addEventListener("input", apply);
      search.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { search.value = ""; apply(); }
      });
    }

    apply();
  }

  /* ---------- ③ 联系页：一键复制 ---------- */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.dataset.copy;
      var done = function () {
        var old = btn.textContent;
        btn.textContent = "已复制";
        setTimeout(function () { btn.textContent = old; }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { window.prompt("手动复制：", text); });
      } else {
        window.prompt("手动复制：", text);
      }
    });
  });

  /* ---------- ③ 联系页：表单校验 + 本地保存 ---------- */
  var form = document.getElementById("contact-form");
  if (form) {
    var status = document.getElementById("form-status");
    var KEY = "growth-messages";
    var f = {
      name: form.querySelector("#name"),
      email: form.querySelector("#email"),
      topic: form.querySelector("#topic"),
      message: form.querySelector("#message")
    };
    var counter = document.getElementById("message-count");
    var savedBox = document.getElementById("saved-note");
    var savedList = document.getElementById("saved-list");
    var clearBtn = document.getElementById("clear-saved");

    var setError = function (el, msg) {
      var box = document.getElementById(el.id + "-error");
      if (box) box.textContent = msg || "";
      if (msg) { el.setAttribute("aria-invalid", "true"); }
      else { el.removeAttribute("aria-invalid"); }
      return !msg;
    };

    var validate = function () {
      var ok = true;
      ok = setError(f.name, f.name.value.trim().length >= 2 ? "" : "请填写至少 2 个字的称呼。") && ok;
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim());
      ok = setError(f.email, emailOk ? "" : "邮箱格式不对，检查一下是不是漏了 @ 或域名。") && ok;
      var len = f.message.value.trim().length;
      ok = setError(f.message, len >= 10 ? "" : "再多写几个字（至少 10 字，现在 " + len + " 字）。") && ok;
      return ok;
    };

    var showStatus = function (msg, isError) {
      if (!status) return;
      status.textContent = msg;
      status.classList.add("is-visible");
      status.classList.toggle("is-error", Boolean(isError));
    };

    var read = function () {
      try {
        var raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) { return []; }
    };

    var render = function () {
      if (!savedBox || !savedList) return;
      var items = read();
      savedBox.style.display = items.length ? "block" : "none";
      savedList.innerHTML = "";
      items.forEach(function (item) {
        var li = document.createElement("li");
        var when = item.time ? new Date(item.time).toLocaleString("zh-CN", { hour12: false }) : "";
        li.textContent = "[" + when + "] " + item.name + "（" + item.topic + "）：" + item.message;
        savedList.appendChild(li);
      });
    };

    if (f.message && counter) {
      var count = function () { counter.textContent = f.message.value.trim().length + " 字"; };
      f.message.addEventListener("input", count);
      count();
    }

    ["name", "email", "message"].forEach(function (k) {
      f[k].addEventListener("blur", function () {
        if (f[k].value.trim() !== "") validate();
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!validate()) {
        var bad = form.querySelectorAll('[aria-invalid="true"]').length;
        showStatus("还有 " + bad + " 项需要修正，见下方红字提示。", true);
        var first = form.querySelector('[aria-invalid="true"]');
        if (first) first.focus();
        return;
      }

      var items = read();
      items.unshift({
        name: f.name.value.trim(),
        email: f.email.value.trim(),
        topic: f.topic ? f.topic.value : "",
        message: f.message.value.trim(),
        time: new Date().toISOString()
      });

      try {
        localStorage.setItem(KEY, JSON.stringify(items.slice(0, 5)));
      } catch (err) {
        showStatus("浏览器不允许保存（可能是隐私模式）。内容已校验通过，但没有保存下来。", true);
        return;
      }

      render();
      showStatus("收到，谢谢你！这条留言已保存在本机浏览器里（演示用，未真的发送）。", false);
      form.reset();
      if (counter) counter.textContent = "0 字";
      Object.keys(f).forEach(function (k) { f[k].removeAttribute("aria-invalid"); });
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        try { localStorage.removeItem(KEY); } catch (e) { /* 忽略 */ }
        render();
        showStatus("已清空本机保存的留言。", false);
      });
    }

    render();
  }
})();
