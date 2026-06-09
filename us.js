const metricSelect = document.getElementById("metricSelect");
const toggleLabels = document.getElementById("toggleLabels");
const stateCountEl = document.getElementById("stateCount");
const facilityCountEl = document.getElementById("facilityCount");
const corrValueEl = document.getElementById("corrValue");
const insightTextEl = document.getElementById("insightText");
const legendEl = document.getElementById("legend");
const pressureChartCanvas = document.getElementById("pressureChart");
const selected = {
  name: document.getElementById("selectedStateName"),
  ses: document.getElementById("selSes"),
  access: document.getElementById("selAccess"),
  pressure: document.getElementById("selPressure"),
  facilityCount: document.getElementById("selFacilityCount"),
  kids: document.getElementById("selKids"),
  facilitiesPer10k: document.getElementById("selFacilitiesPer10k"),
  kidsPerFacility: document.getElementById("selKidsPerFacility"),
  income: document.getElementById("selIncome"),
  poverty: document.getElementById("selPoverty"),
  source: document.getElementById("snapshotSource"),
};

const metricMeta = {
  ses_index: {
    label: "家庭条件",
    legend: ["较低", "中低", "中高", "较高"],
    colors: ["#edf1ef", "#c0d8d0", "#8db7ab", "#5d8f81"],
    description: "颜色表示州级家庭条件综合指数。颜色越深，说明收入更高且贫困率更低。",
  },
  access_index: {
    label: "球场机会",
    legend: ["较少", "偏少", "偏多", "较多"],
    colors: ["#eef3f5", "#c7dae2", "#92b8c5", "#5e8da0"],
    description: "颜色表示每万名 5-17 岁儿童大致对应多少片 soccer 场地。颜色越深，州级场地供给越充足。",
  },
  pressure_index: {
    label: "球场压力",
    legend: ["压力较低", "还好", "偏高", "很高"],
    colors: ["#f4ebe2", "#e2c5ae", "#cf9b73", "#a36a46"],
    description: "颜色表示每一片 soccer 场地需要分担多少儿童。颜色越深，说明场地压力越高。",
  },
};

let usStatesData;
let map;
let ready = false;
let selectedStateName = null;
let pressureChart = null;
const featureByName = new Map();

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function fmtNumber(value, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(toNumber(value));
}

function fmtMoney(value) {
  return new Intl.NumberFormat("en-US", {
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

function ensureDependencies() {
  if (!window.maplibregl) {
    throw new Error("MapLibre 没有加载成功，请检查网络或 CDN。");
  }

  if (!window.Chart) {
    throw new Error("Chart.js 没有加载成功，请检查网络或 CDN。");
  }

  if (window.location.protocol === "file:") {
    throw new Error(
      "当前页面是通过 file:// 打开的。请先启动本地服务，例如 `python3 -m http.server 8080`，再访问 http://localhost:8080/us.html。"
    );
  }
}

function stateFillExpression() {
  const meta = metricMeta[metricSelect.value] || metricMeta.pressure_index;
  const [c0, c1, c2, c3] = meta.colors;
  return ["step", ["to-number", ["get", metricSelect.value]], c0, 25, c1, 50, c2, 75, c3];
}

function renderSelectOptions() {
  metricSelect.innerHTML = Object.entries(metricMeta)
    .map(([value, meta]) => `<option value="${value}">${meta.label}</option>`)
    .join("");
  metricSelect.value = metricSelect.value || "pressure_index";
}

function buildLegend() {
  const meta = metricMeta[metricSelect.value] || metricMeta.pressure_index;
  legendEl.innerHTML = `
    <div class="legend-head">
      <span class="legend-subtitle">${meta.label}</span>
    </div>
    <div class="legend-rows">
      ${meta.colors
        .map(
          (color, index) =>
            `<div class="legend-item"><span class="swatch" style="background:${color}"></span><span>${meta.legend[index]}</span></div>`
        )
        .join("")}
    </div>
    <div class="legend-caption">州级真实基线：ACS 2023 5-year + OSM soccer pitch count</div>
  `;
}

function setInsightText() {
  const corr = Number(corrValueEl.textContent);
  const absCorr = Math.abs(corr);
  const strength = absCorr >= 0.6 ? "关系比较明显" : absCorr >= 0.35 ? "关系有一些" : "关系不算强";
  const direction = corr >= 0 ? "大体同向" : "大体反向";
  const meta = metricMeta[metricSelect.value] || metricMeta.pressure_index;

  insightTextEl.textContent = `${meta.description} 从州级基线看，家庭条件和球场机会 ${strength}，并且 ${direction}（r = ${corr.toFixed(2)}）。这页最适合用来判断全国 inventory gap 在哪里更值得继续做 tract + catchment。`;
}

function updateSelectedPanel(props) {
  selected.name.textContent = `${props.state_name} (${props.state_abbr})`;
  selected.ses.textContent = fmtNumber(props.ses_index);
  selected.access.textContent = fmtNumber(props.access_index);
  selected.pressure.textContent = fmtNumber(props.pressure_index);
  selected.facilityCount.textContent = fmtNumber(props.facility_count);
  selected.kids.textContent = fmtNumber(props.kids_5_17);
  selected.facilitiesPer10k.textContent = fmtNumber(props.facilities_per_10k_kids, 2);
  selected.kidsPerFacility.textContent = fmtNumber(props.kids_per_facility, 1);
  selected.income.textContent = fmtMoney(props.median_income);
  selected.poverty.textContent = fmtPct(props.poverty_rate);
  selected.source.textContent = props.source_note || "ACS + OSM state inventory";
  buildPressureChart();
}

function popupHtml(props) {
  return `
    <strong>${props.state_name} (${props.state_abbr})</strong><br>
    家庭条件: ${fmtNumber(props.ses_index)}<br>
    球场机会: ${fmtNumber(props.access_index)}<br>
    球场压力: ${fmtNumber(props.pressure_index)}<br>
    场地数量: ${fmtNumber(props.facility_count)}
  `;
}

function buildPressureChart() {
  if (!usStatesData || !pressureChartCanvas) return;

  const activeName = normalizeName(selectedStateName);
  const points = usStatesData.features.map((feature) => {
    const props = feature.properties;
    const isActive = normalizeName(props.state_name) === activeName;

    return {
      x: toNumber(props.kids_per_facility),
      y: toNumber(props.facilities_per_10k_kids),
      state: props.state_name,
      pointBackgroundColor: isActive ? "#4d8d7d" : "rgba(207, 155, 115, 0.75)",
      pointBorderColor: isActive ? "#2d6357" : "#bf8861",
      pointRadius: isActive ? 6 : 4.1,
      pointHoverRadius: isActive ? 7 : 5.1,
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
              return `${point.state}: 每片球场儿童 ${fmtNumber(point.x, 1)}, 每万儿童球场 ${fmtNumber(point.y, 2)}`;
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: "每片球场对应儿童",
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
          title: {
            display: true,
            text: "每万儿童球场数",
            color: "#6d685f",
          },
          grid: { color: "rgba(56, 49, 38, 0.08)" },
          ticks: {
            color: "#403a32",
            callback: (value) => fmtNumber(value),
          },
        },
      },
    },
  });
}

function setSelectedState(name) {
  selectedStateName = name;
  const feature = featureByName.get(normalizeName(name));
  if (!feature) return;

  updateSelectedPanel(feature.properties);

  if (!ready) return;

  map.setFilter("state-selected-outline", ["==", ["get", "state_name"], feature.properties.state_name]);
}

function wireMapInteractions() {
  const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });

  map.on("mousemove", "state-fill", (event) => {
    map.getCanvas().style.cursor = "pointer";
    const feature = event.features && event.features[0];
    if (!feature) return;

    popup.setLngLat(event.lngLat).setHTML(popupHtml(feature.properties)).addTo(map);
  });

  map.on("mouseleave", "state-fill", () => {
    map.getCanvas().style.cursor = "";
    popup.remove();
  });

  map.on("click", "state-fill", (event) => {
    const feature = event.features && event.features[0];
    if (!feature) return;
    setSelectedState(feature.properties.state_name);
  });
}

function updateMapStyling() {
  buildLegend();
  setInsightText();

  if (!ready || !map.getLayer("state-fill")) return;

  map.setPaintProperty("state-fill", "fill-color", stateFillExpression());
  map.setLayoutProperty("state-label", "visibility", toggleLabels.checked ? "visible" : "none");
}

function initializeMap() {
  map = new maplibregl.Map({
    container: "usMap",
    style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    center: [-97.6, 39.5],
    zoom: 3.25,
    attributionControl: true,
  });

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-left");

  map.once("load", () => {
    map.addSource("states", { type: "geojson", data: usStatesData });

    map.addLayer({
      id: "state-fill",
      type: "fill",
      source: "states",
      paint: {
        "fill-color": stateFillExpression(),
        "fill-opacity": 0.76,
      },
    });

    map.addLayer({
      id: "state-outline",
      type: "line",
      source: "states",
      paint: {
        "line-color": "rgba(55, 49, 40, 0.28)",
        "line-width": 0.7,
        "line-opacity": 0.4,
      },
    });

    map.addLayer({
      id: "state-selected-outline",
      type: "line",
      source: "states",
      filter: ["==", ["get", "state_name"], ""],
      paint: {
        "line-color": "#3a342d",
        "line-width": 1.8,
        "line-opacity": 0.95,
      },
    });

    map.addLayer({
      id: "state-label",
      type: "symbol",
      source: "states",
      layout: {
        "text-field": ["get", "state_abbr"],
        "text-size": 10,
        "text-font": ["Open Sans Regular"],
        visibility: toggleLabels.checked ? "visible" : "none",
      },
      paint: {
        "text-color": "rgba(49, 44, 37, 0.72)",
      },
    });

    wireMapInteractions();
    ready = true;

    if (selectedStateName) {
      setSelectedState(selectedStateName);
    }

    updateMapStyling();
  });
}

async function loadData() {
  ensureDependencies();
  renderSelectOptions();

  const res = await fetch("data/us_states.geojson");
  if (!res.ok) {
    throw new Error(`读取全美数据失败: HTTP ${res.status}`);
  }

  usStatesData = await res.json();

  for (const feature of usStatesData.features) {
    featureByName.set(normalizeName(feature.properties.state_name), feature);
  }

  stateCountEl.textContent = fmtNumber(usStatesData.features.length);
  facilityCountEl.textContent = fmtNumber(
    usStatesData.features.reduce(
      (sum, feature) => sum + toNumber(feature.properties.facility_count),
      0
    )
  );

  const correlation = pearson(
    usStatesData.features.map((feature) => toNumber(feature.properties.ses_index)),
    usStatesData.features.map((feature) => toNumber(feature.properties.access_index))
  );
  corrValueEl.textContent = correlation.toFixed(2);

  const defaultFeature = [...usStatesData.features].sort(
    (left, right) =>
      toNumber(right.properties.pressure_index) - toNumber(left.properties.pressure_index)
  )[0];

  metricSelect.value = "pressure_index";

  if (defaultFeature) {
    selectedStateName = defaultFeature.properties.state_name;
    updateSelectedPanel(defaultFeature.properties);
  }

  buildPressureChart();
  buildLegend();
  setInsightText();
  initializeMap();
}

metricSelect.addEventListener("change", updateMapStyling);
toggleLabels.addEventListener("change", updateMapStyling);

loadData().catch((error) => {
  console.error("Failed to load US data:", error);
  const message = error instanceof Error ? error.message : "未知错误";
  insightTextEl.textContent = `初始化失败: ${message}`;
  alert(`初始化失败: ${message}`);
});