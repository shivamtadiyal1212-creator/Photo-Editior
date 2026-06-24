// ─── Default filter values ────────────────────────────────────────────────────
const defaultFilters = {
    Brightness:  { value: 100, min: 0,   max: 200, unit: "%",  icon: "ri-sun-line" },
    Contrast:    { value: 100, min: 0,   max: 200, unit: "%",  icon: "ri-contrast-2-line" },
    Saturation:  { value: 100, min: 0,   max: 200, unit: "%",  icon: "ri-drop-line" },
    Huerotation: { value: 0,   min: 0,   max: 360, unit: "deg",icon: "ri-palette-line" },
    Blur:        { value: 0,   min: 0,   max: 20,  unit: "px", icon: "ri-blur-off-line" },
    Grayscale:   { value: 0,   min: 0,   max: 100, unit: "%",  icon: "ri-grayscale-line" },
    Sepia:       { value: 0,   min: 0,   max: 100, unit: "%",  icon: "ri-image-2-line" },
    Opacity:     { value: 100, min: 0,   max: 100, unit: "%",  icon: "ri-eye-line" },
    Invert:      { value: 0,   min: 0,   max: 100, unit: "%",  icon: "ri-contrast-fill" }
};

// ─── Filter presets ───────────────────────────────────────────────────────────
const presets = [
    {
        name: "Original",
        icon: "✨",
        filters: {}
    },
    {
        name: "Vivid",
        icon: "🌈",
        filters: {
            Brightness: 110,
            Contrast: 130,
            Saturation: 180,
        }
    },
    {
        name: "Vintage",
        icon: "📷",
        filters: {
            Brightness: 95,
            Contrast: 90,
            Saturation: 70,
            Sepia: 40,
            Huerotation: 5
        }
    },
    {
        name: "Noir",
        icon: "🎞️",
        filters: {
            Brightness: 90,
            Contrast: 140,
            Grayscale: 100,
        }
    }
];

// ─── State ────────────────────────────────────────────────────────────────────
let filters = JSON.parse(JSON.stringify(defaultFilters));
let image = null;
let activePreset = null;

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const filterContainer  = document.querySelector("#filters-container");
const presetsGrid      = document.querySelector("#presets-grid");
const imageCanvas      = document.querySelector("#image-canvas");
const imgInput         = document.querySelector("#image-input");
const canvasCtx        = imageCanvas.getContext("2d");
const resetBtn         = document.querySelector("#reset-btn");
const downloadBtn      = document.querySelector("#download-btn");
const placeholder      = document.querySelector("#placeholder");

// ─── Create filter slider UI ──────────────────────────────────────────────────
function createFilterElement(name, filterData) {
    const { unit, value, min, max, icon } = filterData;

    const div = document.createElement("div");
    div.classList.add("filter");

    // Header row: label + live value badge
    const header = document.createElement("div");
    header.classList.add("filter-header");

    const nameEl = document.createElement("span");
    nameEl.classList.add("filter-name");
    nameEl.innerHTML = `<i class="${icon}"></i>${name}`;

    const valueEl = document.createElement("span");
    valueEl.classList.add("filter-value");
    valueEl.id = `${name}-value`;
    valueEl.textContent = `${value}${unit}`;

    header.appendChild(nameEl);
    header.appendChild(valueEl);

    // Slider
    const input = document.createElement("input");
    input.type = "range";
    input.min = min;
    input.max = max;
    input.value = value;
    input.id = name;

    // Set initial gradient fill
    updateSliderFill(input, min, max, value);

    input.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        filters[name].value = val;
        valueEl.textContent = `${val}${unit}`;
        updateSliderFill(input, min, max, val);
        clearActivePreset();
        applyFilters();
    });

    div.appendChild(header);
    div.appendChild(input);

    return div;
}

// Update the slider gradient track fill
function updateSliderFill(input, min, max, value) {
    const pct = ((value - min) / (max - min)) * 100;
    input.style.setProperty("--slider-percent", `${pct}%`);
}

// ─── Build all filter sliders ─────────────────────────────────────────────────
function createFilters() {
    filterContainer.innerHTML = "";
    Object.entries(filters).forEach(([name, data]) => {
        const el = createFilterElement(name, data);
        filterContainer.appendChild(el);
    });
}

// ─── Build presets ────────────────────────────────────────────────────────────
function createPresets() {
    presetsGrid.innerHTML = "";
    presets.forEach((preset, idx) => {
        const btn = document.createElement("button");
        btn.classList.add("preset-btn");
        btn.id = `preset-${idx}`;
        btn.innerHTML = `<span>${preset.icon}</span> ${preset.name}`;

        btn.addEventListener("click", () => applyPreset(preset, btn));
        presetsGrid.appendChild(btn);
    });
}

// ─── Apply preset ─────────────────────────────────────────────────────────────
function applyPreset(preset, btnEl) {
    // Reset to defaults then apply preset overrides
    filters = JSON.parse(JSON.stringify(defaultFilters));
    Object.entries(preset.filters).forEach(([key, val]) => {
        if (filters[key]) filters[key].value = val;
    });

    // Update active button
    document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
    btnEl.classList.add("active");
    activePreset = preset.name;

    // Rebuild sliders to reflect new values
    createFilters();

    if (image) applyFilters();
}

function clearActivePreset() {
    document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
    activePreset = null;
}

// ─── Apply CSS filter to canvas ───────────────────────────────────────────────
function applyFilters() {
    if (!image) return;
    canvasCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
    canvasCtx.filter = `
        brightness(${filters.Brightness.value}${filters.Brightness.unit})
        contrast(${filters.Contrast.value}${filters.Contrast.unit})
        saturate(${filters.Saturation.value}${filters.Saturation.unit})
        hue-rotate(${filters.Huerotation.value}${filters.Huerotation.unit})
        blur(${filters.Blur.value}${filters.Blur.unit})
        grayscale(${filters.Grayscale.value}${filters.Grayscale.unit})
        sepia(${filters.Sepia.value}${filters.Sepia.unit})
        opacity(${filters.Opacity.value}${filters.Opacity.unit})
        invert(${filters.Invert.value}${filters.Invert.unit})
    `.trim();
    canvasCtx.drawImage(image, 0, 0);
}

// ─── Image input ──────────────────────────────────────────────────────────────
imgInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    imageCanvas.style.display = "block";
    placeholder.style.display = "none";

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
        image = img;
        imageCanvas.width  = img.width;
        imageCanvas.height = img.height;
        canvasCtx.drawImage(img, 0, 0);
        applyFilters();
    };
});

// ─── Reset ────────────────────────────────────────────────────────────────────
resetBtn.addEventListener("click", () => {
    filters = JSON.parse(JSON.stringify(defaultFilters));
    clearActivePreset();
    createFilters();
    if (image) applyFilters();
});

// ─── Download ─────────────────────────────────────────────────────────────────
downloadBtn.addEventListener("click", () => {
    if (!image) return;
    const link = document.createElement("a");
    link.download = "lumix-edited.png";
    link.href = imageCanvas.toDataURL();
    link.click();
});

// ─── Init ─────────────────────────────────────────────────────────────────────
createFilters();
createPresets();