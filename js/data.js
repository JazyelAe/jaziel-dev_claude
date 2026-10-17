// Carga de datos desde /data. Las rutas son relativas al HTML, así funcionan en GitHub Pages bajo /repositorio/.

const cache = new Map();

export async function loadJSON(path) {
  if (cache.has(path)) return cache.get(path);
  const promise = fetch(path, { headers: { Accept: 'application/json' } }).then((res) => {
    if (!res.ok) throw new Error(`No se pudo cargar ${path} (${res.status})`);
    return res.json();
  });
  cache.set(path, promise);
  try { return await promise; } catch (err) { cache.delete(path); throw err; }
}

export const getProfile = () => loadJSON('data/profile.json');
export const getSkills = () => loadJSON('data/skills.json');

/** Devuelve solo proyectos publicados, ordenados por sortOrder, y las categorías con al menos un proyecto. */
export async function getProjects() {
  const raw = await loadJSON('data/projects.json');
  const list = Array.isArray(raw.projects) ? raw.projects : [];
  const projects = list
    .filter((p) => p && p.published === true && p.slug && p.title)
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
  const labels = raw.categories || {};
  const counts = new Map();
  projects.forEach((p) => (p.categories || []).forEach((c) => counts.set(c, (counts.get(c) || 0) + 1)));
  const categories = Object.keys(labels)
    .filter((id) => counts.has(id))
    .map((id) => ({ id, label: labels[id], count: counts.get(id) }));
  return { projects, categories };
}
