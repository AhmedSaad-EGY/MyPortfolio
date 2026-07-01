const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = process.cwd();
const missing = [];
const ids = new Set();

function existsLocal(ref, source) {
  if (!ref || /^(https?:|mailto:|tel:|data:|javascript:)/i.test(ref)) {
    return;
  }

  if (ref.startsWith("#")) {
    const id = ref.slice(1);
    if (id && !ids.has(id)) {
      missing.push(`${source}: missing same-page anchor ${ref}`);
    }
    return;
  }

  const cleanRef = decodeURIComponent(ref.split("#")[0].split("?")[0]);
  if (!cleanRef) return;

  const absolutePath = path.resolve(root, cleanRef);
  if (!absolutePath.startsWith(root) || !fs.existsSync(absolutePath)) {
    missing.push(`${source}: missing local file ${ref}`);
  }
}

function collectHtmlIds(html) {
  for (const match of html.matchAll(/\sid=(["'])(.*?)\1/g)) {
    ids.add(match[2]);
  }
}

function checkHtmlRefs(html) {
  const attrPattern = /\s(?:src|href|poster|srcset)=(["'])(.*?)\1/g;
  for (const match of html.matchAll(attrPattern)) {
    const value = match[2].trim();
    const refs = match[0].includes("srcset")
      ? value.split(",").map((entry) => entry.trim().split(/\s+/)[0])
      : [value];

    refs.forEach((ref) => existsLocal(ref, "index.html"));
  }
}

function checkCssRefs(cssPath) {
  const css = fs.readFileSync(cssPath, "utf8");
  for (const match of css.matchAll(/url\((["']?)(.*?)\1\)/g)) {
    const ref = match[2].trim();
    if (!ref || ref.startsWith("data:")) continue;
    const resolved = path.posix
      .join(path.posix.dirname(cssPath.replaceAll("\\", "/")), ref)
      .replaceAll("\\", "/");
    existsLocal(resolved, cssPath);
  }
}

function checkProjectAssets(projectsPath) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(projectsPath, "utf8"), context);

  const projects = Array.isArray(context.window.projects)
    ? context.window.projects
    : [];

  projects.forEach((project) => {
    ["image", "imageDark", "imageWebp", "imageDarkWebp"].forEach((key) => {
      if (project[key]) existsLocal(project[key], `${projectsPath}:${project.title}`);
    });
  });
}

const html = fs.readFileSync("index.html", "utf8");
collectHtmlIds(html);
checkHtmlRefs(html);
checkCssRefs("Styles/style.css");
checkProjectAssets("Javascript/projects.js");

if (missing.length) {
  console.error("Link check failed:");
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log("Link check passed.");
