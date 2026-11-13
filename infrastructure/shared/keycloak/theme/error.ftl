<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=displayMessage>
  <div class="rounded-xl bg-base-100 shadow-md px-8 py-10 text-center" style="border: 1px solid var(--color-border);">
    <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto mb-4 w-12 h-12 text-error opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
    <h1 class="text-2xl font-extrabold tracking-tight text-base-content mb-1" style="font-family: var(--font-display)">Something went wrong</h1>
    <p class="text-sm text-base-content/55 mb-6">An unexpected error occurred. Please try again.</p>

    <#if message??>
      <div class="alert alert-error mb-6 text-sm gap-2 text-left">
        <svg xmlns="http://www.w3.org/2000/svg" class="shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
        <span>${message.summary}</span>
      </div>
    </#if>

    <a href="${url.loginUrl}" class="btn btn-primary w-full gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      Return to login
    </a>
  </div>
</@layout.registrationLayout>
