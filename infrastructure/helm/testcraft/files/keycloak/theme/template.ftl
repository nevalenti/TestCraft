<#macro registrationLayout displayMessage=false displayRequiredFields=false pageTitle="TestCraft">
  <!DOCTYPE html>
  <html lang="en" data-theme="dracula">
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
        --color-border: oklch(1 0 0 / 0.14);
        --shadow-card:
          0 1px 2px oklch(0 0 0 / 0.17), 0 8px 20px -4px oklch(0 0 0 / 0.25);
      }

      html, body {
        margin: 0;
        padding: 0;
      }

      html {
        font-family: var(--font-sans);
        -webkit-font-smoothing: antialiased;
        background-color: var(--color-base-300);
        overflow: hidden;
      }

      @media (min-width: 640px) {
        body {
          padding: 1rem;
        }
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
          height: calc(100vh - 2rem);
          border: 1px solid var(--color-border);
          border-radius: 0.75rem;
          box-shadow: var(--shadow-card);
        }
      }

      .kc-main {
        flex: 1 1 0%;
        min-height: 0;
        overflow-y: auto;
      }

      .header-stripes {
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

      .shadow-card {
        box-shadow: var(--shadow-card);
      }

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
  </head>
  <body class="text-base-content">
    <div class="kc-shell bg-base-100">

      <nav class="navbar bg-base-200 header-stripes shrink-0 px-4 sm:px-6 lg:px-8" style="min-height: 3.5rem; height: 3.5rem; border-bottom: 1px solid var(--color-border);">
        <div class="flex-1 flex items-center min-w-0">
          <a href="https://testcraft.pro" class="flex items-center gap-2.5 transition-opacity hover:opacity-75 text-base-content shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 shrink-0 text-primary" aria-hidden="true">
              <path fill-rule="evenodd" d="M10.5 3.798v5.02a3 3 0 0 1-.879 2.121l-2.377 2.377a9.845 9.845 0 0 1 5.091 1.013 8.315 8.315 0 0 0 5.713.636l.285-.071-3.954-3.955a3 3 0 0 1-.879-2.121v-5.02a23.614 23.614 0 0 0-3 0Zm4.5.138a.75.75 0 0 0 .093-1.495A24.837 24.837 0 0 0 12 2.25a25.048 25.048 0 0 0-3.093.191A.75.75 0 0 0 9 3.936v4.882a1.5 1.5 0 0 1-.44 1.06l-6.293 6.294c-1.62 1.621-.903 4.475 1.471 4.88 2.686.46 5.447.698 8.262.698 2.816 0 5.576-.239 8.262-.697 2.373-.406 3.092-3.26 1.47-4.881L15.44 9.879A1.5 1.5 0 0 1 15 8.818V3.936Z" clip-rule="evenodd"/>
            </svg>
            <span class="text-base font-extrabold tracking-tight" style="font-family: var(--font-display)">TestCraft</span>
          </a>
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
