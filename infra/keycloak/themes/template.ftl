<#macro registrationLayout displayMessage=false displayRequiredFields=false pageTitle="TestCraft">
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><#if pageTitle??>${pageTitle}<#else>TestCraft</#if></title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/daisyui@5" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/daisyui@5/themes.css" />
    <style>
      @import url('https://rsms.me/inter/inter.css');
      @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@600;700;800&display=swap');

      :root {
        --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
        --font-display: 'Raleway', ui-sans-serif, system-ui, sans-serif;
        --color-border: oklch(1 0 0 / 0.15);
      }

      [data-theme="emerald"] {
        --color-border: oklch(0 0 0 / 0.18);
      }

      html {
        font-family: var(--font-sans);
        -webkit-font-smoothing: antialiased;
        background-color: var(--color-base-100);
      }

      #icon-moon { display: none; }
      [data-theme="emerald"] #icon-moon { display: block; }
      [data-theme="emerald"] #icon-sun { display: none; }

      [data-theme="emerald"] .header-stripes {
        background-image: repeating-linear-gradient(
          45deg,
          transparent 0px, transparent 8px,
          oklch(0 0 0 / 0.06) 8px, oklch(0 0 0 / 0.06) 10px
        );
      }

      [data-theme="dracula"] .header-stripes {
        background-image: repeating-linear-gradient(
          45deg,
          transparent 0px, transparent 8px,
          oklch(1 0 0 / 0.06) 8px, oklch(1 0 0 / 0.06) 10px
        );
      }

      @keyframes modal-enter {
        from { opacity: 0; transform: scale(0.96) translateY(-6px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }

      .card-enter { animation: modal-enter 0.15s ease-out; }

      :focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }

      ::selection {
        background-color: oklch(from var(--color-primary) l c h / 0.25);
      }

      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: var(--color-base-300); border-radius: 999px; }
    </style>
    <script>
      const THEME_KEY = 'app-theme';
      const LIGHT = 'dracula';
      const DARK = 'emerald';

      function getCookie(name) {
        const eq = name + '=';
        for (let c of document.cookie.split(';')) {
          c = c.trim();
          if (c.indexOf(eq) === 0) return c.substring(eq.length);
        }
        return null;
      }

      function setCookie(name, value) {
        const expires = new Date(Date.now() + 365 * 864e5).toUTCString();
        document.cookie = name + '=' + value + ';expires=' + expires + ';path=/';
      }

      function resolveTheme() {
        const v = getCookie(THEME_KEY);
        return v === LIGHT || v === DARK ? v : LIGHT;
      }

      const theme = resolveTheme();
      document.documentElement.setAttribute('data-theme', theme);

      function toggleTheme() {
        const next = document.documentElement.getAttribute('data-theme') === DARK ? LIGHT : DARK;
        document.documentElement.setAttribute('data-theme', next);
        setCookie(THEME_KEY, next);
      }
    </script>
  </head>
  <body class="text-base-content min-h-screen">
    <div class="mx-auto flex min-h-screen w-full max-w-360 flex-col overflow-hidden bg-base-100" style="border-left: 1px solid var(--color-border); border-right: 1px solid var(--color-border);">

      <nav class="navbar bg-base-200 header-stripes h-14 shrink-0 px-4 sm:px-6 lg:px-8" style="border-bottom: 1px solid var(--color-border);">
        <div class="flex-1 flex items-center min-w-0">
          <a href="https://testcraft.dev" class="flex items-center gap-2.5 transition-opacity hover:opacity-75 text-base-content shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 shrink-0 text-primary" aria-hidden="true">
              <path fill-rule="evenodd" d="M10.5 3.798v5.02a3 3 0 0 1-.879 2.121l-2.377 2.377a9.845 9.845 0 0 1 5.091 1.013 8.315 8.315 0 0 0 5.713.636l.285-.071-3.954-3.955a3 3 0 0 1-.879-2.121v-5.02a23.614 23.614 0 0 0-3 0Zm4.5.138a.75.75 0 0 0 .093-1.495A24.837 24.837 0 0 0 12 2.25a25.048 25.048 0 0 0-3.093.191A.75.75 0 0 0 9 3.936v4.882a1.5 1.5 0 0 1-.44 1.06l-6.293 6.294c-1.62 1.621-.903 4.475 1.471 4.88 2.686.46 5.447.698 8.262.698 2.816 0 5.576-.239 8.262-.697 2.373-.406 3.092-3.26 1.47-4.881L15.44 9.879A1.5 1.5 0 0 1 15 8.818V3.936Z" clip-rule="evenodd"/>
            </svg>
            <span class="text-base font-extrabold tracking-tight" style="font-family: var(--font-display)">TestCraft</span>
          </a>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <button onclick="toggleTheme()" class="btn btn-ghost btn-sm btn-circle" aria-label="Toggle theme">
            <svg id="icon-sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
              <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z"/>
            </svg>
            <svg id="icon-moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
              <path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </nav>

      <main class="flex flex-1 flex-col items-center justify-start pt-[10vh] px-4 pb-8" style="background-image: inherit;">
        <div class="w-full max-w-sm card-enter">
          <#nested "header">
        </div>
      </main>

      <footer class="shrink-0 flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8" style="border-top: 1px solid var(--color-border);">
        <span class="text-xs font-bold tracking-tight text-base-content/65" style="font-family: var(--font-display)">TestCraft</span>
        <p class="text-xs text-base-content/50">&copy; 2026 All rights reserved</p>
      </footer>
    </div>

  </body>
  </html>
</#macro>
