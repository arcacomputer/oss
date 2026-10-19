// Keep every project available in the static HTML; enhance only the controls.
const projectControls = document.querySelector<HTMLElement>(
  "[data-project-controls]",
);
if (projectControls) {
  projectControls.hidden = false;
  const input = projectControls.querySelector<HTMLInputElement>(
    "[data-project-search]",
  )!;
  const buttons = [
    ...projectControls.querySelectorAll<HTMLButtonElement>(
      "[data-project-filter]",
    ),
  ];
  const projects = [
    ...document.querySelectorAll<HTMLElement>("[data-project-category]"),
  ];
  let category = "all";
  function updateProjects() {
    const query = input.value.trim().toLowerCase();
    let shown = 0;
    for (const project of projects) {
      project.hidden = !(
        (category === "all" || project.dataset.projectCategory === category) &&
        project.dataset.projectName!.toLowerCase().includes(query)
      );
      if (!project.hidden) shown++;
    }
    document.querySelector("[data-project-count]")!.textContent =
      `Showing ${shown} of ${projects.length} projects`;
    document.querySelector<HTMLElement>("[data-project-empty]")!.hidden =
      shown > 0;
  }
  input.addEventListener("input", updateProjects);
  for (const button of buttons)
    button.addEventListener("click", () => {
      category = button.dataset.projectFilter!;
      buttons.forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
      updateProjects();
    });
}
const historyControls = document.querySelector<HTMLElement>(
  "[data-history-controls]",
);
if (historyControls) {
  historyControls.hidden = false;
  const input = historyControls.querySelector<HTMLInputElement>(
    "[data-history-search]",
  )!;
  const buttons = [
    ...historyControls.querySelectorAll<HTMLButtonElement>(
      "[data-history-filter]",
    ),
  ];
  const projects = [
    ...document.querySelectorAll<HTMLElement>("[data-history-kind]"),
  ];
  let category = "all";
  function updateHistory() {
    const query = input.value.trim().toLowerCase();
    let shown = 0;
    for (const project of projects) {
      project.hidden = !(
        (category === "all" ||
          project.dataset.historyKind!.split(" ").includes(category)) &&
        project.dataset.historyName!.toLowerCase().includes(query)
      );
      if (!project.hidden) shown++;
    }
    const kindLabels: Record<string, string> = {
      all: "past work",
      accepted: "merged or credited work",
      review: "code reviews",
      closed: "closed proposals",
    };
    document.querySelector("[data-history-count]")!.textContent =
      `Showing ${shown} of ${projects.length} projects with ${kindLabels[category]}. Projects can also have work in progress.`;
    document.querySelector<HTMLElement>("[data-history-empty]")!.hidden =
      shown > 0;
  }
  input.addEventListener("input", updateHistory);
  buttons.forEach((button) =>
    button.addEventListener("click", () => {
      category = button.dataset.historyFilter!;
      buttons.forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
      updateHistory();
    }),
  );
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
    document.querySelector("[data-activity-count]")!.textContent =
      `Showing ${shown} of ${matches} recorded items`;
    more.hidden = shown >= matches;
    document.querySelector<HTMLElement>("[data-activity-empty]")!.hidden =
      matches > 0;
  }
  buttons.forEach((button) =>
    button.addEventListener("click", () => {
      state = button.dataset.activityFilter!;
      limit = 6;
      buttons.forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
      updateActivity();
    }),
  );
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
const links = [
  ...document.querySelectorAll<HTMLAnchorElement>("[data-section-link]"),
];
const sections = ["projects", "contributions"]
  .map((id) => document.getElementById(id))
  .filter((section): section is HTMLElement => section !== null);
const visible = new Set<string>();
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) =>
        entry.isIntersecting
          ? visible.add(entry.target.id)
          : visible.delete(entry.target.id),
      );
      const active = [...visible].sort(
        (a, b) =>
          Math.abs(
            document.getElementById(a)!.getBoundingClientRect().top - 110,
          ) -
          Math.abs(
            document.getElementById(b)!.getBoundingClientRect().top - 110,
          ),
      )[0];
      links.forEach((link) => {
        if (link.dataset.sectionLink === active)
          link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    },
    { rootMargin: "-90px 0px -40% 0px", threshold: 0 },
  );
  sections.forEach((section) => observer.observe(section));
}
