const metricSelect = document.getElementById("metricSelect");
const toggleFacilities = document.getElementById("toggleFacilities");
const tractCountEl = document.getElementById("tractCount");
const facilityCountEl = document.getElementById("facilityCount");
const corrValueEl = document.getElementById("corrValue");
const insightTextEl = document.getElementById("insightText");
const legendEl = document.getElementById("legend");
const langZhBtn = document.getElementById("langZh");
const langEnBtn = document.getElementById("langEn");
const pressureChartCanvas = document.getElementById("pressureChart");

const selected = {
  name: document.getElementById("selectedTractName"),
  ses: document.getElementById("selSes"),
  access: document.getElementById("selAccess"),
  kidsPitch: document.getElementById("selKidsPitch"),
  facilityCount: document.getElementById("selFacilityCount"),
  income: document.getElementById("selIncome"),
  poverty: document.getElementById("selPoverty"),
};

const textNodes = {
  eyebrow: document.getElementById("eyebrowText"),
  title: document.getElementById("titleText"),
  welcomeLead: document.getElementById("welcomeLead"),
  welcomeMuted: document.getElementById("welcomeMuted"),
  metricLabel: document.getElementById("metricLabel"),
  toggleFacilitiesLabel: document.getElementById("toggleFacilitiesLabel"),
  tractCountLabel: document.getElementById("tractCountLabel"),
  facilityCountLabel: document.getElementById("facilityCountLabel"),
  corrLabel: document.getElementById("corrLabel"),
  chartTitle: document.getElementById("chartTitle"),
  chartHint: document.getElementById("chartHint"),
  insightTitle: document.getElementById("insightTitle"),
  insightHint: document.getElementById("insightHint"),
  snapshotTitle: document.getElementById("snapshotTitle"),
  snapshotHint: document.getElementById("snapshotHint"),
  selSesLabel: document.getElementById("selSesLabel"),
  selAccessLabel: document.getElementById("selAccessLabel"),
  selKidsPitchLabel: document.getElementById("selKidsPitchLabel"),
  selFacilityCountLabel: document.getElementById("selFacilityCountLabel"),
  selIncomeLabel: document.getElementById("selIncomeLabel"),
  selPovertyLabel: document.getElementById("selPovertyLabel"),
};

const translations = {
  zh: {
    pageTitle: "King County 青少年足球地图",
    eyebrow: "Seattle Region · Soccer Access",
    title: "King County Youth Soccer Equity Lab",
    welcomeLead:
      "这个界面用来快速看 King County 不同区域的球场够不够、找球场方不方便，以及孩子多不多。",
    welcomeMuted: "左边负责切换和解读，右边专心看地图。点地图里的区域，就能在右下角看详情。",
    metricLabel: "地图上看什么",
    toggleFacilitiesLabel: "显示球场点位",
    stats: {
      tracts: "区域数量",
      facilities: "球场数量",
      corr: "家庭条件和球场便利度是否同向",
    },
    chartTitle: "球场压力和找球场便利度",
    chartHint: "每个点代表一个区域",
    insightTitle: "当前解读",
    insightHint: "尽量用直白的话说明",
    snapshotTitle: "当前区域",
    snapshotHint: "点地图更新",
    fields: {
      ses: "家庭条件",
      access: "找球场方便程度",
      kidsPitch: "每片球场对应儿童",
      facilityCount: "球场数量",
      income: "家庭收入中位数",
      poverty: "贫困率",
    },
    metrics: {
      ses_index: "家庭条件",
      access_index: "找球场方便程度",
      kids_per_pitch: "每片球场要分担多少孩子",
    },
    legend: {
      byMetric: {
        ses_index: "家庭条件",
        access_index: "找球场方便程度",
        kids_per_pitch: "球场压力",
      },
      levels: ["低", "中低", "中高", "高"],
      pressure: ["压力低", "还好", "偏高", "很高"],
    },
    popup: {
      ses: "家庭条件",
      access: "找球场方便程度",
      kidsPitch: "每片球场对应儿童",
      facilityCount: "球场数量",
    },
    insight: {
      metric: {
        ses_index: "现在颜色表示家庭条件。颜色越深，代表整体生活条件更宽裕。",
        access_index: "现在颜色表示找球场方不方便。颜色越深，代表附近更容易接触到球场。",
        kids_per_pitch: "现在颜色表示球场压力。颜色越深，代表每片球场要分担的孩子更多。",
      },
      strength: { strong: "关系比较明显", medium: "关系有一点", weak: "关系不算强" },
      direction: { positive: "同向", negative: "反向" },
      closing: "如果你想找优先补位的地方，可以重点看颜色深、但找球场又不方便的区域。",
    },
    fallback: {
      title: "这次没法显示地图",
      body1: "当前环境没有打开 WebGL，所以地图初始化不出来。",
      body2: "左边控制和右下角区域信息仍然可用。",
      body3: "换到支持 WebGL 的浏览器或会话里，就能正常显示地图。",
    },
    errors: {
      runtime: "现在是直接用 file:// 打开的。请先启动本地服务，例如 `python3 -m http.server 8080`，再访问 http://localhost:8080。",
      maplibre: "MapLibre 没有加载成功，请检查网络或 CDN。",
      chart: "图表组件没有加载成功，请检查网络或 CDN。",
      fetch: "读取数据失败",
      invalidJson: "数据文件不是有效 JSON",
      initFailed: "初始化失败",
      unknown: "未知错误",
    },
    unknownTract: "未选择区域",
  },
  en: {
    pageTitle: "King County Youth Soccer Map",
    eyebrow: "Seattle Region · Soccer Access",
    title: "King County Youth Soccer Equity Lab",
    welcomeLead:
      "This view helps you quickly see where fields feel scarce, where getting to a field is easier, and where more kids are competing for the same space.",
    welcomeMuted: "Use the left side for switching views and reading the summary. Click any area on the map to update the detail card in the lower right.",
    metricLabel: "What to show",
    toggleFacilitiesLabel: "Show field locations",
    stats: {
      tracts: "Areas",
      facilities: "Fields",
      corr: "Do money and access move together",
    },
    chartTitle: "Field pressure vs field access",
    chartHint: "Each dot is one area",
    insightTitle: "Current Read",
    insightHint: "Plain-language summary",
    snapshotTitle: "Selected Area",
    snapshotHint: "Click map to update",
    fields: {
      ses: "Family resources",
      access: "How easy it is to reach a field",
      kidsPitch: "Kids per field",
      facilityCount: "Field count",
      income: "Median household income",
      poverty: "Poverty rate",
    },
    metrics: {
      ses_index: "Family resources",
      access_index: "Ease of reaching a field",
      kids_per_pitch: "How many kids each field serves",
    },
    legend: {
      byMetric: {
        ses_index: "Family resources",
        access_index: "Field access",
        kids_per_pitch: "Field pressure",
      },
      levels: ["Low", "Lower-mid", "Upper-mid", "High"],
      pressure: ["Low pressure", "Okay", "Higher", "Very high"],
    },
    popup: {
      ses: "Family resources",
      access: "Field access",
      kidsPitch: "Kids per field",
      facilityCount: "Field count",
    },
    insight: {
      metric: {
        ses_index: "The colors now show family resources. Darker areas are generally better off.",
        access_index: "The colors now show how easy it is to reach a field. Darker areas have better field access nearby.",
        kids_per_pitch: "The colors now show field pressure. Darker areas mean more kids are sharing each field.",
      },
      strength: { strong: "The relationship is fairly clear", medium: "There is some relationship", weak: "The relationship is fairly weak" },
      direction: { positive: "they move together", negative: "they move in opposite directions" },
      closing: "If you want likely priority areas, focus on places with high field pressure and weaker field access.",
    },
    fallback: {
      title: "Map cannot render here",
      body1: "WebGL is not available in this session, so the map cannot start.",
      body2: "The controls and area summary are still available.",
      body3: "Open the page in a browser or session with WebGL enabled to see the map.",
    },
    errors: {
      runtime: "The app is being opened with file://. Start a local server, for example `python3 -m http.server 8080`, then open http://localhost:8080.",
      maplibre: "MapLibre failed to load. Check network or CDN access.",
      chart: "Chart.js failed to load. Check network or CDN access.",
      fetch: "Failed to load data",
      invalidJson: "The data file is not valid JSON",
      initFailed: "Initialization failed",
      unknown: "Unknown error",
    },
    unknownTract: "No area selected",
  },
};

let tractsData;
let facilitiesData;
let map;
let ready = false;
let selectedTractName = null;
let currentLanguage = localStorage.getItem("soccer-language") || "zh";
const featureByName = new Map();
let webglAvailable = false;
let pressureChart = null;

function getText() {
  return translations[currentLanguage] || translations.zh;
}

function getNumberLocale() {
  return currentLanguage === "zh" ? "zh-CN" : "en-US";
}

function ensureDependencies() {
  if (!window.maplibregl) {
    throw new Error(getText().errors.maplibre);
  }

  if (!window.Chart) {
    throw new Error(getText().errors.chart);
  }
}

function detectRuntime() {
  if (window.location.protocol === "file:") {
    throw new Error(getText().errors.runtime);
  }

  try {
    const canvas = document.createElement("canvas");
    webglAvailable = !!(window.WebGLRenderingContext && canvas.getContext("webgl"));
  } catch {
    webglAvailable = false;
  }
}

function showMapUnavailableMessage() {
  const t = getText();
  const mapEl = document.getElementById("map");
  mapEl.innerHTML = `
    <div class="map-fallback" role="status" aria-live="polite">
      <h3>${t.fallback.title}</h3>
      <p>${t.fallback.body1}</p>
      <p>${t.fallback.body2}</p>
      <p>${t.fallback.body3}</p>
    </div>
  `;
}

async function fetchGeoJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${getText().errors.fetch}: ${url} (HTTP ${res.status})`);
  }

  try {
    return await res.json();
  } catch {
    throw new Error(`${getText().errors.invalidJson}: ${url}`);
  }
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function fmtNumber(value) {
  return new Intl.NumberFormat(getNumberLocale()).format(Math.round(toNumber(value)));
}

function fmtMoney(value) {
  return new Intl.NumberFormat(getNumberLocale(), {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function fmtPct(value) {
  return `${toNumber(value).toFixed(1)}%`;
}

function normalizeName(name) {
  return String(name || "")
    .trim()
    .toLowerCase();
}

function pearson(arrX, arrY) {
  const n = arrX.length;
  if (n === 0) return 0;

  const meanX = arrX.reduce((sum, value) => sum + value, 0) / n;
  const meanY = arrY.reduce((sum, value) => sum + value, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let index = 0; index < n; index += 1) {
    const dx = arrX[index] - meanX;
    const dy = arrY[index] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denominator = Math.sqrt(denomX * denomY);
  return denominator === 0 ? 0 : numerator / denominator;
}

function tractFillExpression() {
  const metric = metricSelect.value;

  if (metric === "ses_index") {
    return ["step", ["to-number", ["get", metric]], "#edf1ef", 45, "#c0d8d0", 60, "#8db7ab", 75, "#5d8f81"];
  }

  if (metric === "access_index") {
    return ["step", ["to-number", ["get", metric]], "#eef3f5", 45, "#c7dae2", 60, "#92b8c5", 75, "#5e8da0"];
  }

  return ["step", ["to-number", ["get", metric]], "#f4ebe2", 500, "#e2c5ae", 900, "#cf9b73", 1600, "#a36a46"];
}

function renderSelectOptions() {
  const t = getText();
  const previousMetric = metricSelect.value || "kids_per_pitch";

  metricSelect.innerHTML = Object.entries(t.metrics)
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join("");
  metricSelect.value = previousMetric;
}

function buildPressureChart() {
  if (!tractsData || !pressureChartCanvas) return;

  const t = getText();
  const activeName = normalizeName(selectedTractName);
  const points = tractsData.features.map((feature) => {
    const props = feature.properties;
    const isActive = normalizeName(props.tract_name) === activeName;

    return {
      x: toNumber(props.kids_per_pitch),
      y: toNumber(props.access_index),
      tract: props.tract_name,
      pointBackgroundColor: isActive ? "#4d8d7d" : "rgba(207, 155, 115, 0.75)",
      pointBorderColor: isActive ? "#2d6357" : "#bf8861",
      pointRadius: isActive ? 6 : 4.2,
      pointHoverRadius: isActive ? 7 : 5.2,
    };
  });

  if (pressureChart) {
    pressureChart.destroy();
  }

  pressureChart = new Chart(pressureChartCanvas, {
    type: "scatter",
    data: {
      datasets: [
        {
          data: points,
          parsing: false,
          pointBackgroundColor: points.map((point) => point.pointBackgroundColor),
          pointBorderColor: points.map((point) => point.pointBorderColor),
          pointRadius: points.map((point) => point.pointRadius),
          pointHoverRadius: points.map((point) => point.pointHoverRadius),
          pointBorderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const point = context.raw;
              return `${point.tract}: ${t.fields.kidsPitch} ${fmtNumber(point.x)}, ${t.fields.access} ${fmtNumber(point.y)}`;
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: t.fields.kidsPitch,
            color: "#6d685f",
          },
          grid: { color: "rgba(56, 49, 38, 0.08)" },
          ticks: {
            color: "#6d685f",
            callback: (value) => fmtNumber(value),
          },
        },
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: t.fields.access,
            color: "#6d685f",
          },
          grid: { color: "rgba(56, 49, 38, 0.08)" },
          ticks: {
            color: "#403a32",
            font: { size: 11 },
          },
        },
      },
    },
  });
}

function buildLegend() {
  const t = getText();
  const metric = metricSelect.value;
  let subtitle = t.legend.byMetric[metric];
  let rows;

  if (metric === "kids_per_pitch") {
    rows = ["#f4ebe2", "#e2c5ae", "#cf9b73", "#a36a46"].map((color, index) => ({
      c: color,
      t: t.legend.pressure[index],
    }));
  } else if (metric === "access_index") {
    rows = ["#eef3f5", "#c7dae2", "#92b8c5", "#5e8da0"].map((color, index) => ({
      c: color,
      t: t.legend.levels[index],
    }));
  } else {
    rows = ["#edf1ef", "#c0d8d0", "#8db7ab", "#5d8f81"].map((color, index) => ({
      c: color,
      t: t.legend.levels[index],
    }));
  }

  legendEl.innerHTML = `
    <div class="legend-head">
      <span class="legend-subtitle">${subtitle}</span>
    </div>
    <div class="legend-rows">
      ${rows
        .map((row) => `<div class="legend-item"><span class="swatch" style="background:${row.c}"></span><span>${row.t}</span></div>`)
        .join("")}
    </div>
  `;
}

function setInsightText() {
  const t = getText();
  const corr = Number(corrValueEl.textContent);
  const directionKey = corr >= 0 ? "positive" : "negative";
  const absCorr = Math.abs(corr);
  const strengthKey = absCorr >= 0.6 ? "strong" : absCorr >= 0.35 ? "medium" : "weak";

  insightTextEl.textContent = [
    t.insight.metric[metricSelect.value],
    `${t.insight.strength[strengthKey]}，${t.insight.direction[directionKey]}（r = ${corr.toFixed(2)}）。`,
    t.insight.closing,
  ].join(" ");
}

function updateSelectedPanel(props) {
  const t = getText();
  selected.name.textContent = props.tract_name || t.unknownTract;
  selected.ses.textContent = fmtNumber(props.ses_index);
  selected.access.textContent = fmtNumber(props.access_index);
  selected.kidsPitch.textContent = fmtNumber(props.kids_per_pitch);
  selected.facilityCount.textContent = fmtNumber(props.facility_count);
  selected.income.textContent = fmtMoney(props.median_income);
  selected.poverty.textContent = fmtPct(props.poverty_rate);

  buildPressureChart();
}

function popupHtml(props) {
  const t = getText();
  return `
    <strong>${props.tract_name}</strong><br>
    ${t.popup.ses}: ${fmtNumber(props.ses_index)}<br>
    ${t.popup.access}: ${fmtNumber(props.access_index)}<br>
    ${t.popup.kidsPitch}: ${fmtNumber(props.kids_per_pitch)}<br>
    ${t.popup.facilityCount}: ${fmtNumber(props.facility_count)}
  `;
}

function updateStaticCopy() {
  const t = getText();
  document.documentElement.lang = currentLanguage === "zh" ? "zh-CN" : "en";
  document.title = t.pageTitle;

  textNodes.eyebrow.textContent = t.eyebrow;
  textNodes.title.textContent = t.title;
  textNodes.welcomeLead.textContent = t.welcomeLead;
  textNodes.welcomeMuted.textContent = t.welcomeMuted;
  textNodes.metricLabel.textContent = t.metricLabel;
  textNodes.toggleFacilitiesLabel.textContent = t.toggleFacilitiesLabel;
  textNodes.tractCountLabel.textContent = t.stats.tracts;
  textNodes.facilityCountLabel.textContent = t.stats.facilities;
  textNodes.corrLabel.textContent = t.stats.corr;
  textNodes.chartTitle.textContent = t.chartTitle;
  textNodes.chartHint.textContent = t.chartHint;
  textNodes.insightTitle.textContent = t.insightTitle;
  textNodes.insightHint.textContent = t.insightHint;
  textNodes.snapshotTitle.textContent = t.snapshotTitle;
  textNodes.snapshotHint.textContent = t.snapshotHint;
  textNodes.selSesLabel.textContent = t.fields.ses;
  textNodes.selAccessLabel.textContent = t.fields.access;
  textNodes.selKidsPitchLabel.textContent = t.fields.kidsPitch;
  textNodes.selFacilityCountLabel.textContent = t.fields.facilityCount;
  textNodes.selIncomeLabel.textContent = t.fields.income;
  textNodes.selPovertyLabel.textContent = t.fields.poverty;

  langZhBtn.classList.toggle("is-active", currentLanguage === "zh");
  langEnBtn.classList.toggle("is-active", currentLanguage === "en");

  renderSelectOptions();
  buildLegend();
  setInsightText();
  buildPressureChart();

  if (selectedTractName) {
    const feature = featureByName.get(normalizeName(selectedTractName));
    if (feature) {
      updateSelectedPanel(feature.properties);
    }
  } else {
    selected.name.textContent = t.unknownTract;
  }

  if (!webglAvailable) {
    showMapUnavailableMessage();
  }
}

function setLanguage(language) {
  currentLanguage = language;
  localStorage.setItem("soccer-language", language);
  updateStaticCopy();
}

function setSelectedTract(name) {
  selectedTractName = name;
  const feature = featureByName.get(normalizeName(name));
  if (!feature) return;

  updateSelectedPanel(feature.properties);

  if (!ready) return;

  map.setFilter("tract-selected-outline", ["==", ["get", "tract_name"], feature.properties.tract_name]);
}

function wireMapInteractions() {
  const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });

  map.on("mousemove", "tract-fill", (event) => {
    map.getCanvas().style.cursor = "pointer";
    const feature = event.features && event.features[0];
    if (!feature) return;

    popup.setLngLat(event.lngLat).setHTML(popupHtml(feature.properties)).addTo(map);
  });

  map.on("mouseleave", "tract-fill", () => {
    map.getCanvas().style.cursor = "";
    popup.remove();
  });

  map.on("click", "tract-fill", (event) => {
    const feature = event.features && event.features[0];
    if (!feature) return;
    setSelectedTract(feature.properties.tract_name);
  });
}

function updateMapStyling() {
  buildLegend();
  setInsightText();

  if (!ready || !map.getLayer("tract-fill")) return;

  map.setPaintProperty("tract-fill", "fill-color", tractFillExpression());
  map.setLayoutProperty("facility-circle", "visibility", toggleFacilities.checked ? "visible" : "none");
}

function initializeMap() {
  map = new maplibregl.Map({
    container: "map",
    style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    center: [-122.26, 47.53],
    zoom: 8.9,
    attributionControl: true,
  });

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-left");

  map.once("load", () => {
    map.addSource("tracts", { type: "geojson", data: tractsData });
    map.addSource("facilities", { type: "geojson", data: facilitiesData });

    map.addLayer({
      id: "tract-fill",
      type: "fill",
      source: "tracts",
      paint: {
        "fill-color": tractFillExpression(),
        "fill-opacity": 0.74,
      },
    });

    map.addLayer({
      id: "tract-outline",
      type: "line",
      source: "tracts",
      paint: {
        "line-color": "rgba(55, 49, 40, 0.26)",
        "line-width": 0.55,
        "line-opacity": 0.35,
      },
    });

    map.addLayer({
      id: "tract-selected-outline",
      type: "line",
      source: "tracts",
      filter: ["==", ["get", "tract_name"], ""],
      paint: {
        "line-color": "#3a342d",
        "line-width": 1.7,
        "line-opacity": 0.92,
      },
    });

    map.addLayer({
      id: "facility-circle",
      type: "circle",
      source: "facilities",
      paint: {
        "circle-radius": 3.1,
        "circle-color": "#4c5653",
        "circle-stroke-width": 0.75,
        "circle-stroke-color": "rgba(255, 255, 255, 0.92)",
        "circle-opacity": 0.68,
      },
      layout: {
        visibility: toggleFacilities.checked ? "visible" : "none",
      },
    });

    wireMapInteractions();
    ready = true;

    if (selectedTractName) {
      setSelectedTract(selectedTractName);
    }

    updateMapStyling();
  });
}

async function loadData() {
  ensureDependencies();
  detectRuntime();

  [tractsData, facilitiesData] = await Promise.all([
    fetchGeoJSON("data/tracts.geojson"),
    fetchGeoJSON("data/facilities.geojson"),
  ]);

  for (const feature of tractsData.features) {
    featureByName.set(normalizeName(feature.properties.tract_name), feature);
  }

  tractCountEl.textContent = fmtNumber(tractsData.features.length);
  facilityCountEl.textContent = fmtNumber(facilitiesData.features.length);

  const correlation = pearson(
    tractsData.features.map((feature) => toNumber(feature.properties.ses_index)),
    tractsData.features.map((feature) => toNumber(feature.properties.access_index))
  );
  corrValueEl.textContent = correlation.toFixed(2);

  const defaultFeature = [...tractsData.features].sort(
    (left, right) => toNumber(right.properties.kids_per_pitch) - toNumber(left.properties.kids_per_pitch)
  )[0];

  metricSelect.value = "kids_per_pitch";

  if (defaultFeature) {
    selectedTractName = defaultFeature.properties.tract_name;
    updateSelectedPanel(defaultFeature.properties);
  }

  buildPressureChart();

  if (webglAvailable) {
    initializeMap();
  } else {
    showMapUnavailableMessage();
    updateMapStyling();
  }
}

metricSelect.addEventListener("change", updateMapStyling);
toggleFacilities.addEventListener("change", updateMapStyling);
langZhBtn.addEventListener("click", () => setLanguage("zh"));
langEnBtn.addEventListener("click", () => setLanguage("en"));

updateStaticCopy();

loadData().catch((error) => {
  console.error("Failed to load data:", error);
  const message = error instanceof Error ? error.message : getText().errors.unknown;
  const fullMessage = `${getText().errors.initFailed}: ${message}`;
  insightTextEl.textContent = fullMessage;
  alert(fullMessage);
});
