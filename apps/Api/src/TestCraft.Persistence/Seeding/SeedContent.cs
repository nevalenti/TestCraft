namespace TestCraft.Persistence.Seeding;

internal sealed record SeedSuite(string Name, IReadOnlyList<string> Cases);

internal sealed record SeedProject(
    string Name,
    string Description,
    IReadOnlyList<SeedSuite> Suites
);

internal static class SeedContent
{
    public static readonly IReadOnlyList<SeedProject> Projects =
    [
        new SeedProject(
            "Checkout Flow",
            "End-to-end coverage for the e-commerce checkout experience, from cart to order confirmation.",
            [
                new SeedSuite(
                    "Cart",
                    [
                        "Add single item to cart",
                        "Add item exceeding available stock shows warning",
                        "Update item quantity in cart",
                        "Remove item from cart",
                        "Cart persists after page refresh",
                        "Apply valid promo code reduces total",
                        "Apply expired promo code shows error",
                        "Empty cart displays call-to-action to continue shopping",
                    ]
                ),
                new SeedSuite(
                    "Payment",
                    [
                        "Pay with valid credit card",
                        "Pay with expired credit card is rejected",
                        "Pay with insufficient funds shows decline message",
                        "Apply gift card balance to order total",
                        "Switch payment method mid-checkout",
                        "Save card for future purchases",
                        "3D Secure challenge completes successfully",
                        "Payment retry after network timeout",
                    ]
                ),
                new SeedSuite(
                    "Shipping & Delivery",
                    [
                        "Select standard shipping option",
                        "Select express shipping updates total and ETA",
                        "Enter invalid postal code shows validation error",
                        "Apply free shipping threshold discount",
                        "Select store pickup instead of delivery",
                        "Change delivery address after order placed",
                        "International shipping calculates customs estimate",
                        "Delivery date estimate reflects carrier cutoff time",
                    ]
                ),
                new SeedSuite(
                    "Order Confirmation",
                    [
                        "Confirmation page shows correct order summary",
                        "Confirmation email sent within 1 minute",
                        "Order appears in order history immediately",
                        "Download invoice as PDF",
                        "Cancel order within grace period",
                        "Reorder from confirmation page",
                        "Confirmation page handles refresh without duplicate order",
                        "SMS confirmation sent when opted in",
                    ]
                ),
            ]
        ),
        new SeedProject(
            "Mobile Banking App",
            "Test coverage for the iOS/Android banking app: authentication, transfers, and account management.",
            [
                new SeedSuite(
                    "Login & MFA",
                    [
                        "Login with valid credentials",
                        "Login with incorrect password shows generic error",
                        "Account locks after 5 failed login attempts",
                        "Enable SMS-based MFA",
                        "Enable authenticator app MFA",
                        "Reject OTP after 3 failed attempts",
                        "Biometric login on supported devices",
                        "Remember device skips MFA for 30 days",
                    ]
                ),
                new SeedSuite(
                    "Account Overview",
                    [
                        "Account balance displays correctly after login",
                        "Pending transactions shown separately from posted",
                        "Switch between linked accounts",
                        "Balance updates in real time after transfer",
                        "Statement download as PDF",
                        "Search transaction history by date range",
                        "Categorize transaction manually",
                        "Low balance alert triggers push notification",
                    ]
                ),
                new SeedSuite(
                    "Fund Transfers",
                    [
                        "Transfer between own linked accounts",
                        "Transfer to external account via routing number",
                        "Transfer exceeding daily limit is blocked",
                        "Schedule recurring transfer",
                        "Cancel scheduled transfer before execution",
                        "Transfer confirmation includes reference number",
                        "Transfer to a new payee by phone number",
                        "Transfer fails gracefully when external bank unreachable",
                    ]
                ),
                new SeedSuite(
                    "Card Management",
                    [
                        "Freeze debit card temporarily",
                        "Report card lost and request replacement",
                        "Set spending limit per category",
                        "View virtual card number for online purchases",
                        "Update card PIN",
                        "Enable/disable contactless payments",
                        "Add card to mobile wallet",
                        "View card transaction dispute status",
                    ]
                ),
            ]
        ),
        new SeedProject(
            "Public API Gateway",
            "Contract and reliability tests for the public-facing REST API.",
            [
                new SeedSuite(
                    "Authentication",
                    [
                        "Issue access token with valid client credentials",
                        "Reject request with expired token",
                        "Refresh token rotates old token",
                        "Reject malformed Authorization header",
                        "Scope-restricted token denies out-of-scope endpoint",
                        "Revoked token is rejected immediately",
                        "API key authentication for server-to-server calls",
                        "Token introspection endpoint returns correct claims",
                    ]
                ),
                new SeedSuite(
                    "Rate Limiting",
                    [
                        "Requests under limit succeed",
                        "Requests over limit return 429 with Retry-After",
                        "Rate limit resets after window expires",
                        "Per-client rate limits are isolated",
                        "Burst allowance permits short spikes",
                        "Rate limit headers reflect remaining quota",
                        "Exempted internal service bypasses rate limit",
                        "Distributed rate limiting is consistent across instances",
                    ]
                ),
                new SeedSuite(
                    "Webhooks",
                    [
                        "Webhook delivers on event trigger",
                        "Failed delivery retries with backoff",
                        "Webhook signature validates payload integrity",
                        "Subscriber can filter by event type",
                        "Webhook endpoint disabled after repeated failures",
                        "Replay webhook event from dashboard",
                        "Webhook payload matches published schema",
                        "Delivery latency stays under SLA threshold",
                    ]
                ),
                new SeedSuite(
                    "Pagination & Filtering",
                    [
                        "Default page size returns expected count",
                        "Cursor-based pagination returns next page correctly",
                        "Invalid cursor returns 400 error",
                        "Filter by multiple query parameters",
                        "Sort order is stable across pages",
                        "Large offset does not significantly degrade response time",
                        "Empty result set returns valid empty page structure",
                        "Combined filter and search returns intersection of results",
                    ]
                ),
            ]
        ),
    ];

    public static readonly IReadOnlyList<(string Name, string Color)> Labels =
    [
        ("smoke", "#22c55e"),
        ("regression", "#3b82f6"),
        ("flaky", "#f59e0b"),
        ("critical-path", "#ef4444"),
        ("needs-review", "#a855f7"),
        ("p1", "#ec4899"),
    ];

    public static readonly IReadOnlyList<string> TeamMemberNames =
    [
        "Priya Nair",
        "Marcus Webb",
        "Lena Fischer",
        "Diego Ramirez",
        "Aisha Khan",
        "Tom O'Sullivan",
    ];

    public static readonly IReadOnlyList<(string Message, string DefectType)> FailureNotes =
    [
        ("Discount code applied twice, total shows incorrect amount", "ProductBug"),
        ("Session expires ~2 minutes early under load", "ProductBug"),
        ("Confirmation email never arrives for orders over $500", "ProductBug"),
        ("Balance shown is stale for a few seconds after transfer", "ProductBug"),
        ("429 response missing the Retry-After header", "ProductBug"),
        (
            "Selector for the submit button changed after the UI redesign, test needs updating",
            "AutomationBug"
        ),
        ("Flaky wait condition causes an intermittent timeout", "AutomationBug"),
        ("Test asserts on a hardcoded date that is now in the past", "AutomationBug"),
        ("Staging payment gateway sandbox returned a 503", "EnvironmentIssue"),
        ("Seed data for this scenario is missing in the test environment", "EnvironmentIssue"),
        ("Test DB connection pool exhausted mid-run", "EnvironmentIssue"),
        ("Unclear whether this is expected behavior — needs PM input", "ToInvestigate"),
        ("Intermittent failure, root cause not yet identified", "ToInvestigate"),
        ("Reproduces locally but not in CI — investigating", "ToInvestigate"),
    ];

    public static readonly IReadOnlyList<string> CiSources = ["web", "api", "e2e"];

    public static readonly IReadOnlyList<string> ManualRunNames =
    [
        "Nightly Regression",
        "Release Smoke Test",
        "Sprint QA Pass",
        "Pre-release Sanity Check",
        "Weekly Full Regression",
        "Hotfix Verification",
    ];
}