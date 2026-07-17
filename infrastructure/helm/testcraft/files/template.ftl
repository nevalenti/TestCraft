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
        --color-border: oklch(1 0 0 / 0.32);
      }

      [data-theme="testcraft-light"] {
        --color-base-100: oklch(0.99 0.006 277.5);
        --color-base-200: oklch(0.944 0.014 277.5);
        --color-base-300: oklch(0.885 0.02 277.5);
        --color-base-content: oklch(0.24 0.032 277.5);
        --color-primary: oklch(0.58 0.2 346.8);
        --color-primary-content: oklch(1 0 0);
        --color-secondary: oklch(0.55 0.17 301.9);
        --color-secondary-content: oklch(1 0 0);
        --color-accent: oklch(0.63 0.16 66.6);
        --color-accent-content: oklch(0.18 0.02 66.6);
        --color-neutral: oklch(0.35 0.032 277.8);
        --color-neutral-content: oklch(0.97 0.006 277.8);
        --color-info: oklch(0.56 0.13 212.8);
        --color-info-content: oklch(1 0 0);
        --color-success: oklch(0.5 0.19 148);
        --color-success-content: oklch(1 0 0);
        --color-warning: oklch(0.64 0.15 112.8);
        --color-warning-content: oklch(0.18 0.02 112.8);
        --color-error: oklch(0.56 0.22 24.4);
        --color-error-content: oklch(1 0 0);
        --color-border: oklch(0 0 0 / 0.35);
        --radius-selector: 1rem;
        --radius-field: 0.5rem;
        --radius-box: 1rem;
      }

      [data-theme="dracula"] {
        --color-base-100: oklch(0.169 0.019 251);
        --color-base-200: oklch(0.133 0.017 251);
        --color-base-300: oklch(0.215 0.021 251);
        --color-base-content: oklch(0.878 0.014 251);
        --color-primary: oklch(0.645 0.218 278);
        --color-primary-content: oklch(1 0 0);
        --color-secondary: oklch(0.598 0.18 290);
        --color-secondary-content: oklch(1 0 0);
        --color-accent: oklch(0.672 0.158 215);
        --color-accent-content: oklch(0.1 0 0);
        --color-neutral: oklch(0.278 0.022 251);
        --color-neutral-content: oklch(0.878 0.014 251);
        --color-info: oklch(0.624 0.19 232);
        --color-info-content: oklch(0.1 0 0);
        --color-success: oklch(0.618 0.178 145);
        --color-success-content: oklch(0.1 0 0);
        --color-warning: oklch(0.744 0.182 85);
        --color-warning-content: oklch(0.1 0 0);
        --color-error: oklch(0.638 0.22 28);
        --color-error-content: oklch(0.1 0 0);
        --color-border: oklch(1 0 0 / 0.32);
      }

      html, body {
        margin: 0;
        padding: 0;
      }

      html {
        font-family: var(--font-sans);
        -webkit-font-smoothing: antialiased;
        background-color: var(--color-base-100);
        overflow: hidden;
      }

      .kc-shell {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 90rem;
        height: 100vh;
        margin-left: auto;
        margin-right: auto;
        overflow: hidden;
      }

      @media (min-width: 640px) {
        .kc-shell {
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
          height: calc(100vh - 1.5rem);
          border-radius: 1rem;
        }
      }

      .kc-main {
        flex: 1 1 0%;
        min-height: 0;
        overflow-y: auto;
      }

      #icon-moon { display: none; }
      [data-theme="testcraft-light"] #icon-moon { display: block; }
      [data-theme="testcraft-light"] #icon-sun { display: none; }

      [data-theme="testcraft-light"] .header-stripes {
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
      const LIGHT = 'testcraft-light';
      const DARK = 'dracula';

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
        return v === LIGHT || v === DARK ? v : DARK;
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
  <body class="text-base-content">
    <div class="kc-shell bg-base-100 sm:rounded-2xl" style="border: 1px solid var(--color-border);">

      <nav class="navbar bg-base-200 header-stripes shrink-0 px-4 sm:px-6 lg:px-8" style="min-height: 3.5rem; height: 3.5rem; border-bottom: 1px solid var(--color-border);">
        <div class="flex-1 flex items-center min-w-0">
          <a href="https://testcraft.pro" class="flex items-center gap-2.5 transition-opacity hover:opacity-75 text-base-content shrink-0">
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

      <main class="kc-main flex flex-col items-center justify-start pt-[10vh] px-4 pb-8" style="background-image: inherit;">
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
