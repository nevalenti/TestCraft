<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=displayMessage>
  <div class="rounded-xl bg-base-100 shadow-md px-8 py-10 text-center" style="border: 1px solid var(--color-border);">
    <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto mb-4 w-12 h-12 text-info opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
    <h1 class="text-2xl font-extrabold tracking-tight text-base-content mb-1" style="font-family: var(--font-display)">Verify your email</h1>
    <p class="text-sm text-base-content/55 mb-6">Check your inbox and click the link to complete registration.</p>

    <#if message??>
      <div class="alert alert-info mb-6 text-sm gap-2 text-left">
        <svg xmlns="http://www.w3.org/2000/svg" class="shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M13 16h-1v-4h-1m1-4h.01"/></svg>
        <span>${message.summary}</span>
      </div>
    </#if>

    <form id="kc-verify-email-form" action="${url.loginAction}" method="post" class="mb-4">
      <button type="submit" class="btn btn-primary w-full">Resend email</button>
    </form>

    <a href="${url.loginUrl}" class="text-sm text-primary hover:underline font-semibold">Back to login</a>
  </div>
</@layout.registrationLayout>
