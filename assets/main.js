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
      tag: "v1.2.2",
      name: "Cube Launcher 1.2.2",
      date: "2026-11-10",
      body: "# Cube Launcher 1.2.2\n\n这一版基本都在修上一版的问题，顺手把更新流程做顺了。\n\n## 修复\n\n- **AI 助手打不了字**：设置页的通用标题层没给 AI 页让位，盖在聊天页上吃掉了鼠标点击。现在 AI 页独占输入，进页面自动聚焦输入框。\n- **模型设置关不掉**：右上角加了关闭按钮，底部加「取消」，按 Esc 或点空白处都能退出。\n- **服务商列表叠在一起**：下拉弹层换成可换行的胶囊按钮，缩放和不同 DPI 下也不会错位。\n\n## 更新\n\n- **在启动器里下载**：点更新后弹窗内直接显示百分比进度，不再跳浏览器。\n- **忽略此版本**：忽略后启动时的静默检查不再提醒，手动检查仍会显示。\n- **去官网更新**：自动更新失败或资产不可用时，一键打开官网下载页。\n- **自动覆盖旧版本**：下载校验 sha256 后替换当前 exe 并重启，旧文件自动备份。\n- **更新通道只保留正式版**：预发布版本不再参与自动更新。\n\n## 界面\n\n- **液态玻璃更接近苹果**：背景单独做全局动态模糊（半径缓慢呼吸），叠上色散描边和指针柔光。\n- **侧边栏去掉焦点虚线框**：点完左边图标不再留一圈蓝框。\n- **引用项目加 BlockHelm**：设置 → 关于的引用项目里加了 BlockHelmLauncher 的部分界面示意，可直接打开项目主页。\n- **移除添加卡片**：主页不再有长按添加卡片和一排按钮，卡片保持固定排列（仍可长按拖动换位）。\n- **AI 助手名字统一为 Cubi**：侧边栏、标题、提示语全部对齐。\n\n## 下载说明\n\n- `CubeLauncher_x64.exe`：单文件，**框架依赖**，需要先装 [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/download/dotnet/8.0)（x64）。\n- `CubeLauncher-win64.zip`：exe + 使用说明 + 正版登录说明，解压即用。\n- `CubeLauncher-1.2.2-source.zip`：完整源码（GPL-3.0）。\n\n> 1.2.1 及更早的构建，在「设置 → 关于 → 检查更新」里能直接看到 1.2.2 并一键升级。"
    },
    {
      tag: "v1.2.1",
      name: "Cube Launcher 1.2.1",
      date: "2026-11-09",
      body: "# Cube Launcher 1.2.1\n\n1.2.1 的核心是内置 AI 助手 **Cubi**。同时把开发中完成的运行态面板、主页卡片和账号页皮肤区一起并进 1.2 系列，版本号回到 1.2。\n\n## 新增\n\n- **AI 助手 Cubi**：侧边栏新增入口，打开就是聊天界面。可以直接问 Java 版本、内存分配、Mod 冲突、整合包安装、崩溃排查，也能问别的。\n  - 没配模型时走**内置离线知识库**，断网也能答；\n  - 在「模型设置」里填一个兼容 OpenAI 协议的接口（DeepSeek、通义千问、Kimi、智谱、硅基流动、Ollama 等），就能问任何问题；\n  - 对话会自动带上启动器版本、Minecraft 目录和默认内存，回答贴着实际配置走；\n  - 密钥只写在本地 settings.json，支持「测试连接」和一键停止生成。\n- **游戏运行态**：启动成功后，首页启动卡片切换为「已运行时长 + 实时网速 + 停止游戏」。上行下行分开显示，每秒刷新一次；点「停止游戏」会结束整个进程树，玩家自己关掉游戏时面板也会自动复原。\n- **主页小卡片**：长按任意首页卡片约 0.4 秒进入编辑态，可把联机、下载、资源、设置加进首页，同样支持拖动排序。\n- **账号页大图皮肤**：皮肤预览移到左侧并放大，按住可以上下左右拖动查看，披风同框显示在右下角；原来的按钮收敛成一个「更换皮肤」入口。\n\n## 改进\n\n- **液态玻璃**：面板更透，边缘加了青紫色散的透镜描边，覆盖层新增跟随鼠标的柔光反射。\n- **应用图标加入字母 C**：立方体正面上叠加白色 C，重新导出全部尺寸与 ico。\n- **侧边栏图标**：选中项加圆角强调色底板，图标尺寸统一收小。\n\n## 修复\n\n- **拖动开始游戏按钮闪退**：拖拽结束时不再把 RenderTransform 写成单位矩阵，改为清除本地值；坐标换算在元素被移出可视树时返回无效值并跳过当前帧；所有拖拽事件都加了异常边界，界面线程另有一层兜底。\n\n## 下载说明\n\n- `CubeLauncher_x64.exe`：单文件，**框架依赖**，需要先装 [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/download/dotnet/8.0)（x64）。\n- `CubeLauncher-win64.zip`：exe + 使用说明 + 正版登录说明，解压即用。\n- `CubeLauncher-1.2.1-source.zip`：完整源码（GPL-3.0）。\n\n> 1.2.0 及更早的构建，在「设置 → 关于 → 检查更新」里能直接看到 1.2.1 并一键升级（下载后先校验 sha256 再替换程序并重启）。"
    },
    {
      tag: "v1.2.0",
      name: "Cube Launcher 1.2.0",
      date: "2026-11-07",
      body: "版本号进入 1.2 系列。重点是启动之后的体验：游戏跑起来以后首页变成实时状态面板。\n\n### 新增\n\n- **游戏运行态**：启动成功后首页切换为「已运行时长 + 实时网速 + 停止游戏」，停止时结束整个进程树。\n- **主页小卡片**：长按任意卡片进入编辑态，可把联机、下载、资源、设置加进首页，同样支持拖动排序。\n- **账号页大图皮肤**：左侧大预览支持上下左右拖动，披风同框显示。\n\n### 改进\n\n- **液态玻璃更像苹果**：边缘色散描边、顶面斜光，覆盖层新增跟随鼠标的柔光反射。\n- **图标加入字母 C**，侧边栏选中项加圆角强调色底板。\n\n### 修复\n\n- **拖动开始游戏按钮闪退**：修正 RenderTransform 恢复方式，坐标换算加入无效值保护，拖拽事件全部加异常边界。\n\n> 1.2.0 及更早的构建，在「设置 → 关于 → 检查更新」里能直接看到 1.2.1 并一键升级。"
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
