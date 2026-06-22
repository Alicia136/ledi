(function () {
  var script = document.currentScript;
  if (!script) return;

  var partnerId = script.getAttribute("data-partner") || "demo";
  var style = script.getAttribute("data-style") || "floating";
  var baseUrl = script.getAttribute("data-base") || "https://ledi.no";

  var css = [
    ".ledi-widget-btn {",
    "  display: inline-flex;",
    "  align-items: center;",
    "  gap: 8px;",
    "  background: linear-gradient(135deg, #00B4D8, #0090a8);",
    "  color: #fff;",
    "  font-family: 'DM Sans', system-ui, sans-serif;",
    "  font-size: 14px;",
    "  font-weight: 700;",
    "  padding: 12px 20px;",
    "  border-radius: 50px;",
    "  text-decoration: none;",
    "  box-shadow: 0 4px 20px rgba(0,180,216,0.35);",
    "  transition: transform 0.15s, box-shadow 0.15s;",
    "  white-space: nowrap;",
    "  cursor: pointer;",
    "  border: none;",
    "}",
    ".ledi-widget-btn:hover {",
    "  transform: translateY(-2px);",
    "  box-shadow: 0 6px 28px rgba(0,180,216,0.5);",
    "}",
    ".ledi-widget-btn .ledi-logo {",
    "  font-weight: 900;",
    "  letter-spacing: -0.5px;",
    "}",
    ".ledi-widget-wrap.floating {",
    "  position: fixed;",
    "  bottom: 24px;",
    "  right: 24px;",
    "  z-index: 9999;",
    "}",
    ".ledi-widget-wrap.inline {",
    "  display: inline-block;",
    "  margin: 8px 0;",
    "}",
    ".ledi-widget-badge {",
    "  display: block;",
    "  font-size: 10px;",
    "  font-weight: 400;",
    "  opacity: 0.8;",
    "  margin-top: 1px;",
    "  font-family: system-ui, sans-serif;",
    "  text-align: center;",
    "}",
  ].join("\n");

  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  var wrap = document.createElement("div");
  wrap.className = "ledi-widget-wrap " + style;

  var link = document.createElement("a");
  link.href = baseUrl + "/?partner=" + encodeURIComponent(partnerId) + "&from=widget";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "ledi-widget-btn";
  link.setAttribute("aria-label", "Book parkering via Ledi");

  link.innerHTML =
    '<span style="font-size:18px">🅿️</span>' +
    '<span>Book parkering via <span class="ledi-logo">Ledi</span></span>';

  link.addEventListener("click", function () {
    var img = new Image();
    img.src = baseUrl + "/api/widget/" + encodeURIComponent(partnerId) + "/klikk";
  });

  wrap.appendChild(link);

  var badge = document.createElement("span");
  badge.className = "ledi-widget-badge";
  badge.textContent = "Powered by Ledi";
  badge.style.color = "rgba(255,255,255,0.65)";
  badge.style.display = "block";
  badge.style.textAlign = "center";
  badge.style.fontSize = "9px";
  badge.style.marginTop = "4px";
  badge.style.fontFamily = "system-ui, sans-serif";
  wrap.appendChild(badge);

  if (style === "floating") {
    document.body ? document.body.appendChild(wrap) : window.addEventListener("DOMContentLoaded", function () { document.body.appendChild(wrap); });
  } else {
    script.parentNode.insertBefore(wrap, script.nextSibling);
  }
})();
