<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=displayMessage pageTitle="TestCraft - Sign up">
  <div class="rounded-xl bg-base-100 shadow-md px-6 py-8 sm:px-8 sm:py-10" style="border: 1px solid var(--color-border);">
    <div class="mb-6">
      <h1 class="text-center text-3xl font-extrabold tracking-tight text-base-content" style="font-family: var(--font-display)">Create an account</h1>
    </div>

    <#if message??>
      <div class="alert alert-error mb-6 text-sm gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
        <span>${message.summary?replace('<br/>', ' ')?replace('<br>', ' ')}</span>
      </div>
    </#if>

    <form id="kc-register-form" onsubmit="document.getElementById('kc-register').disabled=true; return true;" action="${url.registrationAction}" method="post" class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label for="firstName" class="block text-xs font-semibold mb-1.5 text-base-content">First name</label>
          <input id="firstName" name="firstName" type="text" value="${(register.formData.firstName!'')}" placeholder="John" class="input input-bordered w-full h-10 text-sm" />
        </div>
        <div>
          <label for="lastName" class="block text-xs font-semibold mb-1.5 text-base-content">Last name</label>
          <input id="lastName" name="lastName" type="text" value="${(register.formData.lastName!'')}" placeholder="Doe" class="input input-bordered w-full h-10 text-sm" />
        </div>
      </div>

      <div>
        <label for="email" class="block text-xs font-semibold mb-1.5 text-base-content">Email address</label>
        <input id="email" name="email" type="email"
        value="${(register.formData.email!'')}" autocomplete="email"
        placeholder="john.doe@example.com" class="input input-bordered w-full h-10 text-sm" />
      </div>

      <div>
        <label for="password" class="block text-xs font-semibold mb-1.5 text-base-content">Password</label>
        <input id="password" name="password" type="password" autocomplete="new-password" placeholder="••••••••" minlength="12" class="input input-bordered w-full h-10 text-sm" />
        <p class="mt-1 text-xs text-base-content/55">At least 12 characters.</p>
      </div>

      <div>
        <label for="password-confirm" class="block text-xs font-semibold mb-1.5 text-base-content">Confirm password</label>
        <input id="password-confirm" name="password-confirm" type="password" placeholder="••••••••" class="input input-bordered w-full h-10 text-sm" />
      </div>

      <button id="kc-register" name="register" type="submit" class="btn btn-primary w-full mt-2">
        Create account
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-base-content/55">
      Already have an account?
      <a href="${url.loginUrl}" class="text-primary font-semibold hover:underline">Log in</a>
    </p>
  </div>
</@layout.registrationLayout>
