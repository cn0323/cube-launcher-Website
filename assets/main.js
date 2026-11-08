/* ==========================================================================
   Cube Launcher — 官网交互
   ========================================================================== */

(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------------------------- 滚动揭示 ---------------------------- */
  const revealNodes = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealNodes.forEach((n) => n.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );
    revealNodes.forEach((n) => io.observe(n));
  }

  /* ---------------------------- 滚动进度与导航 ---------------------------- */
  const nav = document.getElementById("nav");
  const progress = document.getElementById("progress");
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY || 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, y / max) : 0;

    if (progress) progress.style.setProperty("--p", p.toFixed(4));
    if (nav) nav.classList.toggle("scrolled", y > 18);
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(onScroll);
    },
    { passive: true }
  );
  onScroll();

  /* ---------------------------- 跟随鼠标的光 ---------------------------- */
  if (finePointer && !reduceMotion) {
    document.body.classList.add("has-pointer");

    let raf = 0;
    let mx = 0;
    let my = 0;

    window.addEventListener(
      "pointermove",
      (e) => {
        mx = e.clientX;
        my = e.clientY;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          document.documentElement.style.setProperty("--mx", `${mx}px`);
          document.documentElement.style.setProperty("--my", `${my}px`);
          const spot = document.getElementById("spotlight");
          if (spot) {
            const rect = spot.getBoundingClientRect();
            spot.style.setProperty("--mx", `${mx - rect.left}px`);
            spot.style.setProperty("--my", `${my - rect.top}px`);
          }
        });
      },
      { passive: true }
    );
  }

  /* ---------------------------- 卡片冷光跟随 ---------------------------- */
  document.querySelectorAll("[data-sheen]").forEach((card) => {
    if (!finePointer) return;
    card.addEventListener(
      "pointermove",
      (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--x", `${((e.clientX - r.left) / r.width) * 100}%`);
        card.style.setProperty("--y", `${((e.clientY - r.top) / r.height) * 100}%`);
      },
      { passive: true }
    );
  });

  /* ---------------------------- 界面示意图的倾斜 ---------------------------- */
  const tilt = document.getElementById("tilt");

  if (tilt && finePointer && !reduceMotion) {
    const MAX = 7;

    const reset = () => {
      tilt.style.setProperty("--rx", "0deg");
      tilt.style.setProperty("--ry", "0deg");
    };

    tilt.addEventListener(
      "pointermove",
      (e) => {
        const r = tilt.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        tilt.style.setProperty("--ry", `${(px * MAX * 2).toFixed(2)}deg`);
        tilt.style.setProperty("--rx", `${(-py * MAX * 1.4).toFixed(2)}deg`);
      },
      { passive: true }
    );

    tilt.addEventListener("pointerleave", reset);
  }

  /* ---------------------------- 数字滚动 ---------------------------- */
  const counters = document.querySelectorAll("[data-count]");

  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    if (!Number.isFinite(target)) return;
    const decimals = (el.dataset.count.split(".")[1] || "").length;
    const duration = 1100;
    const start = performance.now();

    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals);
    };

    requestAnimationFrame(step);
  };

  if (counters.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      counters.forEach((el) => (el.textContent = el.dataset.count));
    } else {
      const co = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            animateCount(entry.target);
            co.unobserve(entry.target);
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach((el) => co.observe(el));
    }
  }

  /* ---------------------------- 界面截图切换 ---------------------------- */
  const stageName = document.getElementById("stageName");
  const stageIndex = document.getElementById("stageIndex");
  const shotTabs = Array.from(document.querySelectorAll(".shot-tab"));
  const stageImages = Array.from(document.querySelectorAll(".stage-img"));

  if (shotTabs.length && stageImages.length >= 2) {
    let active = 0;
    let token = 0;

    const showShot = (tab, order) => {
      const src = tab.getAttribute("data-src");
      const label = tab.getAttribute("data-label") || "";
      const alt = tab.querySelector(".tab-name")?.textContent?.trim() || label;
      const incoming = stageImages[1 - active];
      const outgoing = stageImages[active];
      const mine = ++token;

      const swap = () => {
        if (mine !== token) return;
        incoming.classList.add("on");
        outgoing.classList.remove("on");
        active = 1 - active;
      };

      if (incoming.getAttribute("src") !== src) {
        incoming.setAttribute("src", src);
        incoming.setAttribute("alt", alt);
        if (incoming.complete && incoming.naturalWidth) {
          swap();
        } else {
          incoming.addEventListener("load", swap, { once: true });
        }
      } else {
        swap();
      }

      shotTabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", String(on));
      });

      if (stageName) stageName.textContent = label;
      if (stageIndex) stageIndex.textContent = String(order + 1);
    };

    shotTabs.forEach((tab, i) => {
      tab.addEventListener("click", () => showShot(tab, i));
      tab.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        const next = (i + (e.key === "ArrowRight" ? 1 : -1) + shotTabs.length) % shotTabs.length;
        shotTabs[next].focus();
        showShot(shotTabs[next], next);
      });
    });
  }

  /* ---------------------------- 更新日志（读 Releases） ---------------------------- */
  const logList = document.getElementById("logList");

  const FALLBACK = [
    {
      tag: "v1.2.0",
      name: "Cube Launcher 1.2.0",
      date: "2026-11-07",
      body: "## Cube Launcher 1.2.0\n\n版本号正式进入 **1.2** 系列。功能上相对 0.10.3 主要是把「液态玻璃」做成可开关的外观项，并把版本号体系、检查更新链路重新对齐。\n\n### 更新说明\n\n- **版本号变更**：`0.10.3` → `1.2.0`，版本码 `100399` → `1020099`。旧版本判断升级只看版本码大小，所以 0.10.3 及更早的构建都能正常识别到 1.2.0 并一键升级。\n- **液态玻璃可开关**：设置 → 主题 → 「液态玻璃效果」，默认关闭，打开即时生效、不用重启。\n\n### 新增\n\n- **液态玻璃效果**：面板、输入框、下拉框换成半透明玻璃材质，边角带内高光与亮边；页面上有缓慢漂移的柔光，还有一条 18° 斜向扫过的反光；同时会额外打开系统模糊，Windows 11 上层次最明显。\n- **开关粒度可控**：关掉后玻璃资源层整层卸载，立刻回到原来的实心面板，不残留重绘开销；已开图片 / 视频背景时会自动收敛成很轻的光晕。\n- **首页卡片长按拖动排序**：长按卡片约 0.4 秒进入拖动，越过中线换位，松手落位并记住顺序。\n- **联机分两栏**：拆成「陶瓦联机」与「红石联机」，陶瓦内部再分创建 / 加入。\n- **皮肤拖动旋转**：账号页中间的皮肤按住左右拖动即可旋转，带惯性衰减。\n\n### 改进\n\n- **检查更新走 GitHub Releases**：仓库打 `vX.Y.Z` tag 并上传 exe 即可被识别，不需要额外维护清单；Releases 取不到时回退查 Tags。\n- **正版登录开箱即用**：内置可用的 Microsoft 应用 ID，不用自己配 Azure；仍可用环境变量 / 配置文件覆盖。\n- **主题切换前置**：主界面右上角太阳 / 月亮按钮即可切换明暗主题。\n- **设置页精简**：登录入口只保留在账户页。\n\n### 修复\n\n- 版本号解析对 `v1.2.0`、`CubeLauncher-1.2.0`、`1.2`、`1.2.0-beta.2` 等写法都能正确排序，不再把新版本判成「已是最新」。\n- 用户协议 / 版权声明 / 开源协议三个入口直达指定文档。\n- 背景视频音量改为独立设置项，可随时调节。\n\n### 下载说明\n\n- `CubeLauncher_x64.exe`：单文件，**框架依赖**，需要先装 [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/download/dotnet/8.0)（x64）。\n- `CubeLauncher-win64.zip`：exe + 使用说明 + 正版登录说明，解压即用。\n- `CubeLauncher-1.2.0-source.zip`：完整源码（GPL-3.0）。\n\n> 0.10.3 及更早的构建，在「设置 → 关于 → 检查更新」里可以直接看到 1.2.0 并一键升级（下载后先校验 sha256 再替换程序并重启）。"
    },
    {
      tag: "v0.10.3",
      name: "Cube Launcher 0.10.3",
      date: "2026-11-07",
      body: "版本号进入 1.2 系列，液态玻璃做成可开关的外观项。\n\n### 新增\n\n- **液态玻璃效果**：设置 → 主题里新增开关，默认关闭，打开即时生效、不用重启。面板/输入框/下拉框换成半透明玻璃材质，带内高光与亮边；页面上有缓慢漂移的柔光，还有一条 18° 斜向扫过的反光；同时额外启用系统模糊（Windows 11 上质感最好）。\n- **首页卡片长按拖动排序**：长按约 0.4 秒进入拖动，越过中线换位，松手落位并记住顺序。\n- **联机分两栏**：拆成「陶瓦联机」和「红石联机」，陶瓦内部再分创建 / 加入。\n- **皮肤拖动旋转**：账号页中间的皮肤按住左右拖动即可旋转，带惯性衰减。\n\n### 改进\n\n- **检查更新走 GitHub Releases**：打 `vX.Y.Z` tag 并上传 exe 即可被识别。\n- **正版登录开箱即用**：内置可用的 Microsoft 应用 ID。\n- **主界面可切主题**：右上角太阳 / 月亮按钮直接切换明暗。\n\n### 下载说明\n\n- `CubeLauncher_x64.exe`：单文件，**框架依赖**，需要先装 [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/download/dotnet/8.0)（x64）。\n- `CubeLauncher-win64.zip`：exe + 使用说明 + 正版登录说明，解压即用。\n- `CubeLauncher-1.2.0-source.zip`：完整源码（GPL-3.0）。\n\n> 0.10.3 及更早的构建，「设置 → 关于 → 检查更新」里能直接看到 1.2.0 并一键升级。"
    }
  ];

  const escapeHtml = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const inline = (s) =>
    escapeHtml(s)
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  const stripDuplicateTitle = (raw, tag) => {
    const lines = String(raw || "").split(/\r?\n/);
    const idx = lines.findIndex((l) => l.trim());
    if (idx === -1) return raw;
    const first = lines[idx].trim();
    if (!/^#{1,6}\s+/.test(first)) return raw;
    const text = first.replace(/^#{1,6}\s+/, "").toLowerCase();
    const version = String(tag || "").replace(/^v/i, "").toLowerCase();
    if (text.includes("cube launcher") || (version && text.includes(version))) {
      lines.splice(idx, 1);
      return lines.join("\n");
    }
    return raw;
  };

  const renderBody = (raw) => {
    const out = [];
    const lines = String(raw || "").split(/\r?\n/);
    let inList = false;
    let inQuote = false;

    const closeList = () => {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      if (inQuote) {
        out.push("</blockquote>");
        inQuote = false;
      }
    };

    for (const line of lines) {
      const t = line.trim();
      if (!t) {
        closeList();
        continue;
      }
      if (/^#{1,6}\s+/.test(t)) {
        closeList();
        out.push(`<h4>${inline(t.replace(/^#{1,6}\s+/, ""))}</h4>`);
        continue;
      }
      if (/^[-*+]\s+/.test(t)) {
        if (!inList) {
          out.push("<ul>");
          inList = true;
        }
        out.push(`<li>${inline(t.replace(/^[-*+]\s+/, ""))}</li>`);
        continue;
      }
      if (/^>\s?/.test(t)) {
        closeList();
        if (!inQuote) {
          out.push("<blockquote>");
          inQuote = true;
        }
        out.push(`<p>${inline(t.replace(/^>\s?/, ""))}</p>`);
        continue;
      }
      if (inQuote) {
        out.push("</blockquote>");
        inQuote = false;
      }
      closeList();
      out.push(`<p>${inline(t)}</p>`);
    }
    closeList();
    if (inQuote) out.push("</blockquote>");
    return out.join("");
  };

  const formatDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const renderLogs = (items) => {
    if (!logList) return;
    logList.innerHTML = items
      .map(
        (it) => `
      <article class="log-item reveal in">
        <div class="log-head">
          <span class="log-tag">${escapeHtml(it.tag)}</span>
          <span class="log-name">${escapeHtml(it.name || "")}</span>
          <span class="log-date">${escapeHtml(it.date || "")}</span>
        </div>
        <div class="log-clip">
          <div class="log-body">${renderBody(stripDuplicateTitle(it.body, it.tag))}</div>
        </div>
        <button class="log-expand" type="button" hidden>
          <span>展开全文</span>
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/></svg>
        </button>
      </article>`
      )
      .join("");

    // 内容过长时折叠，避免一屏被一段日志占满
    logList.querySelectorAll(".log-item").forEach((item) => {
      const clip = item.querySelector(".log-clip");
      const btn = item.querySelector(".log-expand");
      if (!clip || !btn) return;
      if (clip.scrollHeight <= 470) return;

      btn.hidden = false;
      btn.addEventListener("click", () => {
        const open = item.classList.toggle("expanded");
        btn.querySelector("span").textContent = open ? "收起" : "展开全文";
        if (!open) item.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
    });
  };

  const loadLogs = async () => {
    if (!logList) return;
    try {
      const res = await fetch(
        "https://api.github.com/repos/cn0323/Cube-launcher/releases?per_page=3",
        { headers: { Accept: "application/vnd.github+json" } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error("empty");

      const items = data
        .filter((r) => !r.draft)
        .map((r) => ({
          tag: r.tag_name || "",
          name: r.name || "",
          date: formatDate(r.published_at),
          body: r.body || ""
        }));

      if (items.length === 0) throw new Error("empty");

      renderLogs(items);

      const dateEl = document.getElementById("releaseDate");
      if (dateEl && items[0].date) dateEl.textContent = items[0].date;
    } catch (err) {
      renderLogs(FALLBACK);
    }
  };

  /* ---------------------------- 宣传片 ---------------------------- */
  const filmModal = document.getElementById("filmModal");
  const filmVideo = document.getElementById("filmVideo");
  const filmPlay = document.getElementById("filmPlay");
  let filmLoaded = false;

  const openFilm = () => {
    if (!filmModal || !filmVideo) return;
    if (!filmLoaded) {
      filmVideo.src = filmVideo.dataset.src;
      filmLoaded = true;
    }
    filmModal.classList.add("open");
    filmModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("film-open");
    const playing = filmVideo.play();
    if (playing && playing.catch) playing.catch(() => {});
  };

  const closeFilm = () => {
    if (!filmModal || !filmVideo) return;
    filmModal.classList.remove("open");
    filmModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("film-open");
    filmVideo.pause();
    filmVideo.currentTime = 0;
  };

  if (filmPlay) filmPlay.addEventListener("click", openFilm);
  if (filmModal) {
    filmModal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeFilm));
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && filmModal && filmModal.classList.contains("open")) closeFilm();
  });

  loadLogs();
})();
