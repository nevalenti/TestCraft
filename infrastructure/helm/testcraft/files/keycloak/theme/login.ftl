<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=displayMessage pageTitle="TestCraft - Log in">
  <div class="rounded-xl bg-base-100 shadow-card px-8 py-9" style="border: 1px solid var(--color-border);">

    <div class="mb-6 text-center">
      <h1 class="text-2xl font-extrabold tracking-tight text-base-content" style="font-family: var(--font-display)">Sign in to TestCraft</h1>
    </div>

    <#if message??>
      <div class="alert alert-error mb-5 text-sm gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
        <span>${message.summary?replace('<br/>', ' ')?replace('<br>', ' ')}</span>
      </div>
    </#if>

    <form id="kc-form-login" onsubmit="return handleKcLoginSubmit();" action="${url.loginAction}" method="post" class="space-y-5">
      <div>
        <label for="username" class="block text-sm font-semibold mb-2 text-base-content">Email address</label>
        <input
          id="username" name="username" type="text"
          value="${(login.username!'')}"
          autofocus autocomplete="username"
          placeholder="you@example.com"
          class="input input-bordered w-full h-10 text-sm"
        />
      </div>

      <div>
        <div class="flex justify-between items-baseline mb-2">
          <label for="password" class="text-sm font-semibold text-base-content">Password</label>
          <#if realm.resetPasswordAllowed>
            <a href="${url.loginResetCredentialsUrl}" class="text-xs text-primary hover:underline">Forgot password?</a>
          </#if>
        </div>
        <div class="relative">
          <input
            id="password" name="password" type="password"
            autocomplete="current-password"
            placeholder="••••••••"
            class="input input-bordered w-full h-10 text-sm pr-10"
          />
          <button
            type="button" id="kc-password-toggle" onclick="toggleKcPasswordVisibility()"
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-base-content/45 hover:text-base-content"
            aria-label="Show password" tabindex="-1"
          >
            <svg id="kc-eye-show" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
            </svg>
            <svg id="kc-eye-hide" class="w-4 h-4 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"/>
            </svg>
          </button>
        </div>
      </div>

      <#if realm.rememberMe>
        <div class="flex items-center gap-2.5">
          <input id="rememberMe" name="rememberMe" type="checkbox" value="on" class="checkbox checkbox-sm" />
          <label for="rememberMe" class="text-sm cursor-pointer text-base-content/80">Keep me logged in</label>
        </div>
      </#if>

      <div class="pt-1">
        <button id="kc-login" name="login" type="submit" class="btn btn-primary w-full">
          <span id="kc-login-idle">Log in</span>
          <span id="kc-login-busy" class="hidden items-center gap-2">
            <span class="loading loading-spinner loading-sm"></span> Logging in...
          </span>
        </button>
      </div>
    </form>

    <script>
      function toggleKcPasswordVisibility() {
        const input = document.getElementById('password');
        const show = document.getElementById('kc-eye-show');
        const hide = document.getElementById('kc-eye-hide');
        const btn = document.getElementById('kc-password-toggle');
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        show.classList.toggle('hidden', isPassword);
        hide.classList.toggle('hidden', !isPassword);
        btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      }

      function handleKcLoginSubmit() {
        const btn = document.getElementById('kc-login');
        btn.disabled = true;
        document.getElementById('kc-login-idle').classList.add('hidden');
        document.getElementById('kc-login-busy').classList.remove('hidden');
        document.getElementById('kc-login-busy').classList.add('flex');
        return true;
      }
    </script>

    <#if social?? && social.providers?? && social.providers?has_content>
      <div class="divider text-xs text-base-content/40 my-6">or continue with</div>
      <div class="space-y-2.5">
        <#list social.providers as provider>
          <a href="${provider.loginUrl}" class="btn btn-outline w-full gap-2.5 text-sm font-medium" style="border-color: var(--color-border);">
            <#if provider.alias == 'google'>
              <svg class="size-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            <#elseif provider.alias == 'github'>
              <svg class="size-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </#if>
            Continue with ${provider.displayName}
          </a>
        </#list>
      </div>
    </#if>

    <#if realm.registrationAllowed>
      <p class="mt-8 text-center text-sm text-base-content/55">
        Don't have an account?
        <a href="${url.registrationUrl}" class="text-primary font-semibold hover:underline">Create one</a>
      </p>
    </#if>

  </div>
</@layout.registrationLayout>
