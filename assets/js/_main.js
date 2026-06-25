/* ==========================================================================
   Various functions that we want to use within the template
   ========================================================================== */

/*jslint es6 */

// Constants for CDNs
const PLOTLY_URL = "https://cdn.jsdelivr.net/npm/plotly.js@3.6.0/dist/plotly.min.js";
const MERMAID_URL = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

// Detect OS/browser preference
const browserPref = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

// Determine the expected state of the theme toggle, which can be "dark", "light", or
// "system". Default is "system".
function determineThemeSetting() {
  let themeSetting = localStorage.getItem("theme");
  return (themeSetting != "dark" && themeSetting != "light" && themeSetting != "system") ? "system" : themeSetting;
}

// Determine the computed theme, which can be "dark" or "light". If the theme setting is
// "system", the computed theme is determined based on the user's system preference.
function determineComputedTheme() {
  let themeSetting = determineThemeSetting();
  if (themeSetting != "system") {
    return themeSetting;
  }
  return browserPref ? "dark" : "light";
}

// Set the theme on page load or when explicitly called
function setTheme(theme) {
  const use_theme = theme ||
    localStorage.getItem("theme") ||
    $("html").attr("data-theme") ||
    browserPref;

  if (use_theme === "dark") {
    $("html").attr("data-theme", "dark");
    $("#theme-icon").removeClass("fa-sun").addClass("fa-moon");
  } else if (use_theme === "light") {
    $("html").removeAttr("data-theme");
    $("#theme-icon").removeClass("fa-moon").addClass("fa-sun");
  }
}

// Toggle the theme manually
function toggleTheme() {
  const current_theme = $("html").attr("data-theme");
  const new_theme = current_theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", new_theme);
  setTheme(new_theme);
}

// Defer the loading of Mermaid to only if there is a field on the page to be rendered
let mermaidElements = document.querySelectorAll("pre>code.language-mermaid");
if (mermaidElements.length > 0) {
  document.addEventListener("readystatechange", function() {
    // Append the Mermaid module to the DOM
    const moduleScript = document.createElement('script');
    moduleScript.type = 'module';
    moduleScript.textContent = `
      import mermaid from '${MERMAID_URL}';
      mermaid.initialize({startOnLoad:true, theme:'default'});
      await mermaid.run({querySelector:'code.language-mermaid'});
    `;
    document.body.appendChild(moduleScript);
  });
}

/* ==========================================================================
   Plotly integration script so that Markdown codeblocks will be rendered
   ========================================================================== */

// Read the Plotly data from the code block, hide it, and render the chart as new node. This allows for the
// JSON data to be retrieve when the theme is switched. The listener should only be added if the data is
// actually present on the page.
//
// NOTE that plotlyDarkLayout and plotlyLightLayout will be exposed in the minimized file
let plotlyElements = document.querySelectorAll("pre>code.language-plotly");
if (plotlyElements.length > 0) {
  document.addEventListener("readystatechange", () => {
    if (document.readyState === "complete") {
      // Prepare to load Plotly from the CDN
      const script = document.createElement('script');
      script.src = PLOTLY_URL;
      script.async = true;

      // Once loaded, update the page elements to work with it
      script.onload = () => {
        plotlyElements.forEach((elem) => {
          // Parse the Plotly JSON data and hide it
          var jsonData = JSON.parse(elem.textContent);
          elem.parentElement.classList.add("hidden");

          // Add the Plotly node
          let chartElement = document.createElement("div");
          elem.parentElement.after(chartElement);

          // Set the theme for the plot and render it
          const theme = (determineComputedTheme() === "dark") ? plotlyDarkLayout : plotlyLightLayout;
          if (jsonData.layout) {
            jsonData.layout.template = (jsonData.layout.template) ? { ...theme, ...jsonData.layout.template } : theme;
          } else {
            jsonData.layout = { template: theme };
          }
          Plotly.react(chartElement, jsonData.data, jsonData.layout);
        });
      }

      // Add the script to the document
      document.head.appendChild(script);
    }
  });
}

/* ==========================================================================
   Actions that should occur when the page has been fully loaded
   ========================================================================== */

$(document).ready(function () {
  // SCSS SETTINGS - These should be the same as the settings in the relevant files 
  const scssLarge = 925;          // pixels, from /_sass/_themes.scss
  const scssMastheadHeight = 70;  // pixels, from the current theme (e.g., /_sass/theme/_default.scss)

  // If the user hasn't chosen a theme, follow the OS preference
  setTheme();
  window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener("change", (e) => {
          if (!localStorage.getItem("theme")) {
            setTheme(e.matches ? "dark" : "light");
          }
        });

  // Enable the theme toggle
  $('#theme-toggle').on('click', toggleTheme);

  // Enable the sticky footer
  var bumpIt = function () {
    $("body").css("padding-bottom", "0");
    $("body").css("margin-bottom", $(".page__footer").outerHeight(true));
  }
  $(window).resize(function () {
    didResize = true;
  });
  setInterval(function () {
    if (didResize) {
      didResize = false;
      bumpIt();
    }}, 250);
  var didResize = false;
  bumpIt();

  // Follow menu drop down
  $(".author__urls-wrapper button").on("click", function () {
    $(".author__urls").fadeToggle("fast", function () { });
    $(".author__urls-wrapper button").toggleClass("open");
  });

  // Restore the follow menu if toggled on a window resize
  jQuery(window).on('resize', function () {
    if ($('.author__urls.social-icons').css('display') == 'none' && $(window).width() >= scssLarge) {
      $(".author__urls").css('display', 'block')
    }
  });

});

// Automatically show the most recent GitHub commit date and a simple page-view badge.
const lastUpdated = document.querySelector('#last-updated');
const visitorBadge = document.querySelector('#visitor-badge');

function getGitHubPagesRepo() {
  const host = window.location.hostname;

  // For a standard user homepage such as https://zyprince007.github.io/
  if (host.endsWith('.github.io')) {
    const owner = host.replace('.github.io', '');
    return { owner, repo: `${owner}.github.io` };
  }

  // Fallback for local preview or a custom domain. Change these two values if needed.
  return { owner: 'lalala422', repo: 'lalala422.github.io' };
}

const { owner, repo } = getGitHubPagesRepo();

if (visitorBadge) {
  const pageId = `${owner}.${repo}`;
  visitorBadge.src =
    `https://visitor-badge.laobi.icu/badge?page_id=${encodeURIComponent(pageId)}&left_text=Page%20views&right_color=%237755d8&left_color=%23edf0ff&format=true`;
}

async function loadLastUpdated() {
  if (!lastUpdated) return;

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, {
      headers: { Accept: 'application/vnd.github+json' },
    });

    if (!response.ok) throw new Error('GitHub API request failed');

    const commits = await response.json();
    const dateText = commits?.[0]?.commit?.committer?.date || commits?.[0]?.commit?.author?.date;
    if (!dateText) throw new Error('No commit date found');

    const date = new Date(dateText);
    lastUpdated.textContent = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch (error) {
    lastUpdated.textContent = 'Recently';
  }
}

loadLastUpdated();
