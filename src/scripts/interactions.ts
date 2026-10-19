const directory =
  document.querySelector<HTMLDetailsElement>("#project-directory");
const projectControls = document.querySelector<HTMLElement>(
  "[data-project-controls]",
);
if (directory && projectControls) {
  projectControls.hidden = false;
  const search = projectControls.querySelector<HTMLInputElement>(
    "[data-project-search]",
  )!;
  const buttons = [
    ...projectControls.querySelectorAll<HTMLButtonElement>(
      "[data-project-filter]",
    ),
  ];
  const projects = [
    ...directory.querySelectorAll<HTMLElement>("[data-project-category]"),
  ];
  let category = "all";
  function filterProjects() {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    for (const project of projects) {
      const match =
        (category === "all" || project.dataset.projectCategory === category) &&
        project.dataset.projectName!.toLowerCase().includes(query);
      project.hidden = !match;
      if (match) visible++;
    }
    directory!.querySelector<HTMLElement>("[data-project-count]")!.textContent =
      `${visible} ${visible === 1 ? "project" : "projects"}`;
    directory!.querySelector<HTMLElement>("[data-project-empty]")!.hidden =
      visible > 0;
  }
  search.addEventListener("input", filterProjects);
  for (const button of buttons)
    button.addEventListener("click", () => {
      category = button.dataset.projectFilter!;
      for (const item of buttons)
        item.setAttribute("aria-pressed", String(item === button));
      filterProjects();
    });
  function openLinkedDirectory() {
    if (location.hash === "#project-directory") directory!.open = true;
  }
  openLinkedDirectory();
  window.addEventListener("hashchange", openLinkedDirectory);
}
const activityControls = document.querySelector<HTMLElement>(
  "[data-activity-controls]",
);
if (activityControls) {
  activityControls.hidden = false;
  const buttons = [
    ...activityControls.querySelectorAll<HTMLButtonElement>(
      "[data-activity-filter]",
    ),
  ];
  const items = [
    ...document.querySelectorAll<HTMLElement>("[data-activity-item]"),
  ];
  const more = document.querySelector<HTMLButtonElement>(
    "[data-activity-more]",
  )!;
  const count = document.querySelector<HTMLElement>("[data-activity-count]")!;
  let state = "all",
    limit = 6;
  function updateActivity() {
    let matches = 0,
      shown = 0;
    for (const item of items) {
      const match =
        state === "all" ||
        item.dataset.activityState === state ||
        (state === "released" &&
          ["published", "prerelease"].includes(item.dataset.activityState!));
      item.hidden = !(match && matches < limit);
      if (match) {
        matches++;
        if (!item.hidden) shown++;
      }
    }
    count.textContent = `Showing ${shown} of ${matches} recorded items`;
    more.hidden = shown >= matches;
    document.querySelector<HTMLElement>("[data-activity-empty]")!.hidden =
      matches > 0;
  }
  for (const button of buttons)
    button.addEventListener("click", () => {
      state = button.dataset.activityFilter!;
      limit = 6;
      for (const item of buttons)
        item.setAttribute("aria-pressed", String(item === button));
      updateActivity();
    });
  more.addEventListener("click", () => {
    limit += 6;
    updateActivity();
  });
  updateActivity();
}
const mobileNav = document.querySelector<HTMLDetailsElement>(
  ".mobile-section-nav",
);
mobileNav?.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    mobileNav.open = false;
  }),
);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mobileNav?.open) {
    mobileNav.open = false;
    mobileNav.querySelector("summary")?.focus();
  }
});
