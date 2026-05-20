using Domain.Entities;
using Domain.Enums;

using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Projects.AnyAsync())
            return;

        var now = DateTime.UtcNow;

        var ecommerce = new Project
        {
            Name = "E-Commerce Platform",
            Description = "Core shopping experience — cart, checkout, orders, and payments"
        };

        var banking = new Project
        {
            Name = "Mobile Banking App",
            Description = "iOS and Android banking client covering accounts, transfers, and security"
        };

        var dashboard = new Project
        {
            Name = "Admin Dashboard",
            Description = "Internal back-office for user management, reporting, and configuration"
        };

        var suiteCheckout = new TestSuite
        {
            Project = ecommerce,
            Name = "Checkout Flow",
            Description = "End-to-end purchase journeys for guest and registered users"
        };

        var suiteAuth = new TestSuite
        {
            Project = ecommerce,
            Name = "User Authentication",
            Description = "Login, registration, password reset, and session management"
        };

        var suiteSearch = new TestSuite
        {
            Project = ecommerce,
            Name = "Product Search & Filtering",
            Description = "Search relevance, faceted filters, and result sorting"
        };

        var tcGuestCheckout = new TestCase
        {
            Suite = suiteCheckout,
            Name = "Guest checkout completes with credit card",
            Description = "Verifies full purchase flow without account creation"
        };
        tcGuestCheckout.Steps.Add(new TestCaseStep { Order = 1, Action = "Add a product to the cart and navigate to /cart", ExpectedResult = "Cart page shows the correct item, quantity, and subtotal" });
        tcGuestCheckout.Steps.Add(new TestCaseStep { Order = 2, Action = "Click 'Proceed to Checkout' and select 'Continue as Guest'", ExpectedResult = "Guest checkout form is shown with shipping address fields" });
        tcGuestCheckout.Steps.Add(new TestCaseStep { Order = 3, Action = "Fill in a valid US shipping address and click 'Continue'", ExpectedResult = "Shipping method selection page appears with at least two options" });
        tcGuestCheckout.Steps.Add(new TestCaseStep { Order = 4, Action = "Select 'Standard Shipping' and continue to payment", ExpectedResult = "Payment form loads with card number, expiry, and CVV fields" });
        tcGuestCheckout.Steps.Add(new TestCaseStep { Order = 5, Action = "Enter valid test card 4111 1111 1111 1111, exp 12/28, CVV 123", ExpectedResult = "Card details are accepted and the 'Place Order' button is enabled" });
        tcGuestCheckout.Steps.Add(new TestCaseStep { Order = 6, Action = "Click 'Place Order'", ExpectedResult = "Order confirmation page shows order number, summary, and estimated delivery date" });

        var tcCoupon = new TestCase
        {
            Suite = suiteCheckout,
            Name = "Discount coupon applied correctly",
            Description = "Validates coupon entry, error handling, and discount calculation"
        };
        tcCoupon.Steps.Add(new TestCaseStep { Order = 1, Action = "Add any product to the cart and open the cart page", ExpectedResult = "Cart shows the item with its full price" });
        tcCoupon.Steps.Add(new TestCaseStep { Order = 2, Action = "Enter coupon code 'INVALIDXYZ' and click Apply", ExpectedResult = "Error message 'This coupon code is not valid' appears beneath the input" });
        tcCoupon.Steps.Add(new TestCaseStep { Order = 3, Action = "Clear the field, enter coupon code 'SAVE20', and click Apply", ExpectedResult = "A 20% discount line is shown and the order total is reduced accordingly" });
        tcCoupon.Steps.Add(new TestCaseStep { Order = 4, Action = "Proceed through checkout to the order summary page", ExpectedResult = "Summary reflects the discounted total throughout the remaining steps" });

        var tcCartPersistence = new TestCase
        {
            Suite = suiteCheckout,
            Name = "Cart persists across browser sessions",
            Description = "Ensures cart state survives page refresh and browser close for logged-in users"
        };
        tcCartPersistence.Steps.Add(new TestCaseStep { Order = 1, Action = "Log in and add three distinct products to the cart", ExpectedResult = "Cart icon shows badge count of 3" });
        tcCartPersistence.Steps.Add(new TestCaseStep { Order = 2, Action = "Hard-refresh the page (Ctrl+Shift+R)", ExpectedResult = "All three items remain in the cart with correct quantities" });
        tcCartPersistence.Steps.Add(new TestCaseStep { Order = 3, Action = "Close the browser tab, reopen the site, and navigate to /cart", ExpectedResult = "Cart still contains all three items" });

        var tcOutOfStock = new TestCase
        {
            Suite = suiteCheckout,
            Name = "Out-of-stock item blocked at checkout",
            Description = "Prevents purchase when inventory reaches zero mid-session"
        };
        tcOutOfStock.Steps.Add(new TestCaseStep { Order = 1, Action = "Add a product that has only 1 unit in stock to the cart", ExpectedResult = "Item added successfully" });
        tcOutOfStock.Steps.Add(new TestCaseStep { Order = 2, Action = "Simulate stock depletion via admin panel or API call", ExpectedResult = "Stock count is now 0 in the database" });
        tcOutOfStock.Steps.Add(new TestCaseStep { Order = 3, Action = "Attempt to complete checkout", ExpectedResult = "User sees an error 'One or more items in your cart are no longer available' and cannot proceed" });

        var tcLogin = new TestCase
        {
            Suite = suiteAuth,
            Name = "Successful login with valid credentials",
            Description = "Standard happy-path login for an existing account"
        };
        tcLogin.Steps.Add(new TestCaseStep { Order = 1, Action = "Navigate to /login", ExpectedResult = "Login form is displayed with email and password fields" });
        tcLogin.Steps.Add(new TestCaseStep { Order = 2, Action = "Enter registered email 'test@example.com' and correct password", ExpectedResult = "Both fields accept input without validation errors" });
        tcLogin.Steps.Add(new TestCaseStep { Order = 3, Action = "Click 'Sign In'", ExpectedResult = "User is redirected to their account dashboard; name appears in the top navigation" });

        var tcLockout = new TestCase
        {
            Suite = suiteAuth,
            Name = "Account locked after 5 failed login attempts",
            Description = "Validates brute-force protection on the login endpoint"
        };
        tcLockout.Steps.Add(new TestCaseStep { Order = 1, Action = "Navigate to /login and enter the correct email with a wrong password", ExpectedResult = "Error message 'Incorrect email or password' is shown; counter starts" });
        tcLockout.Steps.Add(new TestCaseStep { Order = 2, Action = "Repeat the failed attempt 4 more times", ExpectedResult = "Each attempt shows the same error; on the 5th attempt the account is locked" });
        tcLockout.Steps.Add(new TestCaseStep { Order = 3, Action = "Attempt login with the correct password", ExpectedResult = "Message 'Account locked. Please check your email to unlock.' prevents access" });
        tcLockout.Steps.Add(new TestCaseStep { Order = 4, Action = "Open the unlock email and click the link", ExpectedResult = "Account is unlocked and the user can log in normally" });

        var tcPasswordReset = new TestCase
        {
            Suite = suiteAuth,
            Name = "Password reset via email link",
            Description = "Full reset flow from forgot-password to successful login with new password"
        };
        tcPasswordReset.Steps.Add(new TestCaseStep { Order = 1, Action = "Click 'Forgot password?' on the login page", ExpectedResult = "Password reset page appears with an email input field" });
        tcPasswordReset.Steps.Add(new TestCaseStep { Order = 2, Action = "Enter a registered email address and submit", ExpectedResult = "Confirmation message 'If an account exists, you will receive an email'" });
        tcPasswordReset.Steps.Add(new TestCaseStep { Order = 3, Action = "Open the password reset email and click the reset link", ExpectedResult = "New-password form opens in the browser" });
        tcPasswordReset.Steps.Add(new TestCaseStep { Order = 4, Action = "Enter a new strong password and confirm it, then submit", ExpectedResult = "Success message shown; user can log in with the new password" });

        var tcSearchRelevance = new TestCase
        {
            Suite = suiteSearch,
            Name = "Search returns relevant results",
            Description = "Validates that the full-text search ranks matching products first"
        };
        tcSearchRelevance.Steps.Add(new TestCaseStep { Order = 1, Action = "Type 'wireless headphones' into the search bar and press Enter", ExpectedResult = "Results page loads with products containing 'wireless' and 'headphones'" });
        tcSearchRelevance.Steps.Add(new TestCaseStep { Order = 2, Action = "Verify the top 3 results are all headphone products", ExpectedResult = "At least 3 of the top 5 results match the search intent" });
        tcSearchRelevance.Steps.Add(new TestCaseStep { Order = 3, Action = "Check that unrelated products are not in the first page", ExpectedResult = "No obviously irrelevant items appear on page 1" });

        var tcFilter = new TestCase
        {
            Suite = suiteSearch,
            Name = "Filter by category and price range",
            Description = "Ensures faceted filtering updates results and URL correctly"
        };
        tcFilter.Steps.Add(new TestCaseStep { Order = 1, Action = "Navigate to the Electronics category page", ExpectedResult = "All products shown are tagged as Electronics" });
        tcFilter.Steps.Add(new TestCaseStep { Order = 2, Action = "Set price range filter to $50–$200 and apply", ExpectedResult = "Results update to show only products priced between $50 and $200" });
        tcFilter.Steps.Add(new TestCaseStep { Order = 3, Action = "Check the browser URL", ExpectedResult = "URL contains query parameters reflecting the active filters (e.g. ?min=50&max=200)" });

        var suiteAccounts = new TestSuite
        {
            Project = banking,
            Name = "Account Management",
            Description = "Balance enquiry, transaction history, and profile updates"
        };

        var suiteTransfers = new TestSuite
        {
            Project = banking,
            Name = "Fund Transfers",
            Description = "Internal transfers, payee management, and scheduled payments"
        };

        var suiteSecurity = new TestSuite
        {
            Project = banking,
            Name = "Security & Authentication",
            Description = "Biometric login, PIN management, and 2FA flows"
        };

        var tcBalance = new TestCase
        {
            Suite = suiteAccounts,
            Name = "Account balance reflects recent transactions",
            Description = "Verifies that the displayed balance updates in real time after a debit"
        };
        tcBalance.Steps.Add(new TestCaseStep { Order = 1, Action = "Open the app and log in to a test account with a known balance", ExpectedResult = "Dashboard shows the correct current balance" });
        tcBalance.Steps.Add(new TestCaseStep { Order = 2, Action = "Initiate a $50 transfer to another account", ExpectedResult = "Transfer confirmation screen appears" });
        tcBalance.Steps.Add(new TestCaseStep { Order = 3, Action = "Confirm the transfer and return to the dashboard", ExpectedResult = "Balance has decreased by exactly $50.00" });
        tcBalance.Steps.Add(new TestCaseStep { Order = 4, Action = "Navigate to transaction history", ExpectedResult = "The $50 debit appears as the most recent transaction with today's date" });

        var tcStatement = new TestCase
        {
            Suite = suiteAccounts,
            Name = "Download PDF account statement",
            Description = "Checks that the statement covers the correct date range and is well-formed"
        };
        tcStatement.Steps.Add(new TestCaseStep { Order = 1, Action = "Go to Statements and select 'Last 3 months'", ExpectedResult = "Date range selector shows the correct start and end dates" });
        tcStatement.Steps.Add(new TestCaseStep { Order = 2, Action = "Click 'Download PDF'", ExpectedResult = "Browser triggers a PDF download within 5 seconds" });
        tcStatement.Steps.Add(new TestCaseStep { Order = 3, Action = "Open the downloaded PDF", ExpectedResult = "PDF contains account holder name, IBAN, and all transactions within the selected period" });

        var tcInternalTransfer = new TestCase
        {
            Suite = suiteTransfers,
            Name = "Transfer between own accounts succeeds",
            Description = "Happy path for moving funds between checking and savings"
        };
        tcInternalTransfer.Steps.Add(new TestCaseStep { Order = 1, Action = "Select 'Transfer' from the bottom navigation and choose 'Between My Accounts'", ExpectedResult = "Both checking and savings accounts appear as options" });
        tcInternalTransfer.Steps.Add(new TestCaseStep { Order = 2, Action = "Set From: Checking, To: Savings, Amount: $200, Date: today", ExpectedResult = "Transfer summary shows correct debit and credit accounts" });
        tcInternalTransfer.Steps.Add(new TestCaseStep { Order = 3, Action = "Confirm with PIN", ExpectedResult = "Success message shown; checking balance reduced by $200, savings increased by $200" });

        var tcScheduledTransfer = new TestCase
        {
            Suite = suiteTransfers,
            Name = "Scheduled recurring transfer is created",
            Description = "Validates that a monthly standing order is persisted and displayed"
        };
        tcScheduledTransfer.Steps.Add(new TestCaseStep { Order = 1, Action = "Navigate to Transfers > Scheduled and tap 'New Scheduled Transfer'", ExpectedResult = "Scheduled transfer form opens" });
        tcScheduledTransfer.Steps.Add(new TestCaseStep { Order = 2, Action = "Configure: Amount $100, To: saved payee 'Rent', Frequency: Monthly, Start date: 1st of next month", ExpectedResult = "All fields accept the input without validation errors" });
        tcScheduledTransfer.Steps.Add(new TestCaseStep { Order = 3, Action = "Confirm and save", ExpectedResult = "New scheduled transfer appears in the list with the correct next execution date" });

        var tcBiometric = new TestCase
        {
            Suite = suiteSecurity,
            Name = "Biometric login authenticates successfully",
            Description = "Face ID / fingerprint is used to unlock the app on a supported device"
        };
        tcBiometric.Steps.Add(new TestCaseStep { Order = 1, Action = "Force-quit the app and relaunch it", ExpectedResult = "App displays the biometric prompt instead of the PIN screen" });
        tcBiometric.Steps.Add(new TestCaseStep { Order = 2, Action = "Authenticate using the enrolled fingerprint", ExpectedResult = "App unlocks directly to the dashboard without requiring PIN" });

        var tcPINChange = new TestCase
        {
            Suite = suiteSecurity,
            Name = "PIN changed successfully",
            Description = "Verifies the full change-PIN flow including confirmation"
        };
        tcPINChange.Steps.Add(new TestCaseStep { Order = 1, Action = "Go to Settings > Security > Change PIN", ExpectedResult = "Prompt to enter current PIN appears" });
        tcPINChange.Steps.Add(new TestCaseStep { Order = 2, Action = "Enter current PIN correctly", ExpectedResult = "New PIN entry screen appears" });
        tcPINChange.Steps.Add(new TestCaseStep { Order = 3, Action = "Enter a new 6-digit PIN and confirm it", ExpectedResult = "Success confirmation shown" });
        tcPINChange.Steps.Add(new TestCaseStep { Order = 4, Action = "Lock the app and re-authenticate with the new PIN", ExpectedResult = "Login succeeds with the new PIN; old PIN is rejected" });

        var tc2FA = new TestCase
        {
            Suite = suiteSecurity,
            Name = "Enable two-factor authentication via authenticator app",
            Description = "TOTP-based 2FA setup and first-login verification"
        };
        tc2FA.Steps.Add(new TestCaseStep { Order = 1, Action = "Navigate to Settings > Security > Two-Factor Authentication and tap Enable", ExpectedResult = "QR code and manual key are displayed" });
        tc2FA.Steps.Add(new TestCaseStep { Order = 2, Action = "Scan the QR code with an authenticator app", ExpectedResult = "App generates a 6-digit TOTP code" });
        tc2FA.Steps.Add(new TestCaseStep { Order = 3, Action = "Enter the TOTP code into the verification field and confirm", ExpectedResult = "2FA is enabled; recovery codes are displayed" });
        tc2FA.Steps.Add(new TestCaseStep { Order = 4, Action = "Log out and log back in with correct credentials", ExpectedResult = "App requests a TOTP code on the second step; correct code allows entry" });

        var suiteUsers = new TestSuite
        {
            Project = dashboard,
            Name = "User Management",
            Description = "Create, update, and deactivate user accounts and role assignments"
        };

        var suiteReporting = new TestSuite
        {
            Project = dashboard,
            Name = "Reporting & Exports",
            Description = "Generate, filter, and export operational reports"
        };

        var tcCreateUser = new TestCase
        {
            Suite = suiteUsers,
            Name = "Create a new admin user account",
            Description = "Verifies that a super-admin can provision a new admin-level user"
        };
        tcCreateUser.Steps.Add(new TestCaseStep { Order = 1, Action = "Navigate to Users > All Users and click 'New User'", ExpectedResult = "User creation form opens with fields for name, email, and role" });
        tcCreateUser.Steps.Add(new TestCaseStep { Order = 2, Action = "Fill in Name: 'Alex Carter', Email: 'alex.carter@company.com', Role: Admin", ExpectedResult = "Form accepts all inputs without errors" });
        tcCreateUser.Steps.Add(new TestCaseStep { Order = 3, Action = "Click Save", ExpectedResult = "New user appears in the user list with status 'Pending Invitation'" });
        tcCreateUser.Steps.Add(new TestCaseStep { Order = 4, Action = "Verify the invitation email is received at the specified address", ExpectedResult = "Email contains a personalised activation link" });

        var tcRoleAssignment = new TestCase
        {
            Suite = suiteUsers,
            Name = "Assign viewer role to existing user",
            Description = "Downgrades an editor to viewer and verifies permission changes take effect"
        };
        tcRoleAssignment.Steps.Add(new TestCaseStep { Order = 1, Action = "Find an existing user with Editor role and open their profile", ExpectedResult = "User profile page shows current role as 'Editor'" });
        tcRoleAssignment.Steps.Add(new TestCaseStep { Order = 2, Action = "Change the role dropdown to 'Viewer' and save", ExpectedResult = "Role updated to Viewer; success toast shown" });
        tcRoleAssignment.Steps.Add(new TestCaseStep { Order = 3, Action = "Log in as that user in a separate session", ExpectedResult = "Edit and delete actions are hidden; only read access is available" });

        var tcDeactivate = new TestCase
        {
            Suite = suiteUsers,
            Name = "Deactivate a user account",
            Description = "Ensures deactivated users cannot log in and are marked accordingly"
        };
        tcDeactivate.Steps.Add(new TestCaseStep { Order = 1, Action = "Open a target user's profile and click 'Deactivate Account'", ExpectedResult = "Confirmation dialog appears" });
        tcDeactivate.Steps.Add(new TestCaseStep { Order = 2, Action = "Confirm deactivation", ExpectedResult = "User status changes to 'Inactive' in the list" });
        tcDeactivate.Steps.Add(new TestCaseStep { Order = 3, Action = "Attempt to log in as the deactivated user", ExpectedResult = "Login is rejected with message 'This account has been deactivated'" });

        var tcSalesReport = new TestCase
        {
            Suite = suiteReporting,
            Name = "Generate monthly revenue report",
            Description = "Validates that the revenue report aggregates data correctly for a given month"
        };
        tcSalesReport.Steps.Add(new TestCaseStep { Order = 1, Action = "Navigate to Reports > Revenue and set the date range to the previous month", ExpectedResult = "Report parameters are set correctly" });
        tcSalesReport.Steps.Add(new TestCaseStep { Order = 2, Action = "Click 'Generate Report'", ExpectedResult = "Report loads within 10 seconds with revenue broken down by day" });
        tcSalesReport.Steps.Add(new TestCaseStep { Order = 3, Action = "Compare the totals against the known test dataset", ExpectedResult = "Total revenue matches the expected figure within ±$0.01 rounding" });

        var tcExportCSV = new TestCase
        {
            Suite = suiteReporting,
            Name = "Export user activity data to CSV",
            Description = "Ensures the exported CSV is correctly formatted and contains all expected columns"
        };
        tcExportCSV.Steps.Add(new TestCaseStep { Order = 1, Action = "Open Reports > User Activity and apply a 7-day filter", ExpectedResult = "Table shows activity data for the last 7 days" });
        tcExportCSV.Steps.Add(new TestCaseStep { Order = 2, Action = "Click 'Export CSV'", ExpectedResult = "A CSV file is downloaded within 3 seconds" });
        tcExportCSV.Steps.Add(new TestCaseStep { Order = 3, Action = "Open the CSV in a spreadsheet application", ExpectedResult = "File contains columns: User ID, Name, Email, Action, Timestamp — with no malformed rows" });

        var runRelease = new TestRun
        {
            Project = ecommerce,
            Name = "v2.5.0 Release Regression",
            Environment = "Production"
        };

        var runSprint = new TestRun
        {
            Project = ecommerce,
            Name = "Sprint 34 Smoke Test",
            Environment = "Staging"
        };

        var runIOS = new TestRun
        {
            Project = banking,
            Name = "iOS 17 Compatibility",
            Environment = "iOS 17 Simulator"
        };

        var runAndroid = new TestRun
        {
            Project = banking,
            Name = "Android 14 Regression",
            Environment = "Android 14 Emulator"
        };

        var runQ1 = new TestRun
        {
            Project = dashboard,
            Name = "Q1 2026 Release Validation",
            Environment = "Staging"
        };

        var baseDate = now.AddDays(-14);

        runRelease.TestResults.Add(new TestResult { TestCase = tcGuestCheckout, Status = TestResultStatus.Passed, ExecutedAt = baseDate.AddHours(1), Notes = "All steps passed; confirmation email received within 30 s" });
        runRelease.TestResults.Add(new TestResult { TestCase = tcCoupon, Status = TestResultStatus.Failed, ExecutedAt = baseDate.AddHours(1.5), Notes = "SAVE20 applied a 10% discount instead of 20%. Likely a config issue on prod." });
        runRelease.TestResults.Add(new TestResult { TestCase = tcCartPersistence, Status = TestResultStatus.Passed, ExecutedAt = baseDate.AddHours(2) });
        runRelease.TestResults.Add(new TestResult { TestCase = tcOutOfStock, Status = TestResultStatus.Blocked, ExecutedAt = baseDate.AddHours(2.5), Notes = "Admin panel unavailable during this run window; could not simulate stock depletion" });
        runRelease.TestResults.Add(new TestResult { TestCase = tcLogin, Status = TestResultStatus.Passed, ExecutedAt = baseDate.AddHours(3) });
        runRelease.TestResults.Add(new TestResult { TestCase = tcLockout, Status = TestResultStatus.Passed, ExecutedAt = baseDate.AddHours(3.5) });
        runRelease.TestResults.Add(new TestResult { TestCase = tcPasswordReset, Status = TestResultStatus.Failed, ExecutedAt = baseDate.AddHours(4), Notes = "Reset email not delivered in prod. Possible SES rate-limit issue — raised with DevOps." });
        runRelease.TestResults.Add(new TestResult { TestCase = tcSearchRelevance, Status = TestResultStatus.Passed, ExecutedAt = baseDate.AddHours(4.5) });
        runRelease.TestResults.Add(new TestResult { TestCase = tcFilter, Status = TestResultStatus.Passed, ExecutedAt = baseDate.AddHours(5) });

        var sprintDate = now.AddDays(-3);
        runSprint.TestResults.Add(new TestResult { TestCase = tcGuestCheckout, Status = TestResultStatus.Passed, ExecutedAt = sprintDate.AddHours(1) });
        runSprint.TestResults.Add(new TestResult { TestCase = tcCoupon, Status = TestResultStatus.Passed, ExecutedAt = sprintDate.AddHours(1.5), Notes = "Discount now correct after coupon-config hotfix deployed" });
        runSprint.TestResults.Add(new TestResult { TestCase = tcLogin, Status = TestResultStatus.Passed, ExecutedAt = sprintDate.AddHours(2) });
        runSprint.TestResults.Add(new TestResult { TestCase = tcPasswordReset, Status = TestResultStatus.Passed, ExecutedAt = sprintDate.AddHours(2.5), Notes = "Email delivered in ~12 s on staging" });
        runSprint.TestResults.Add(new TestResult { TestCase = tcSearchRelevance, Status = TestResultStatus.Skipped, ExecutedAt = sprintDate.AddHours(3), Notes = "Search index rebuild in progress; deferred to next run" });

        var iosDate = now.AddDays(-7);
        runIOS.TestResults.Add(new TestResult { TestCase = tcBalance, Status = TestResultStatus.Passed, ExecutedAt = iosDate.AddHours(1) });
        runIOS.TestResults.Add(new TestResult { TestCase = tcStatement, Status = TestResultStatus.Passed, ExecutedAt = iosDate.AddHours(1.5) });
        runIOS.TestResults.Add(new TestResult { TestCase = tcInternalTransfer, Status = TestResultStatus.Passed, ExecutedAt = iosDate.AddHours(2) });
        runIOS.TestResults.Add(new TestResult { TestCase = tcBiometric, Status = TestResultStatus.Passed, ExecutedAt = iosDate.AddHours(2.5), Notes = "Face ID prompt appears within 1 s on iPhone 15 Pro" });
        runIOS.TestResults.Add(new TestResult { TestCase = tcPINChange, Status = TestResultStatus.Passed, ExecutedAt = iosDate.AddHours(3) });
        runIOS.TestResults.Add(new TestResult { TestCase = tc2FA, Status = TestResultStatus.Failed, ExecutedAt = iosDate.AddHours(3.5), Notes = "TOTP code rejected on first attempt due to clock drift on simulator. Works on real device." });
        runIOS.TestResults.Add(new TestResult { TestCase = tcScheduledTransfer, Status = TestResultStatus.Passed, ExecutedAt = iosDate.AddHours(4) });

        var androidDate = now.AddDays(-5);
        runAndroid.TestResults.Add(new TestResult { TestCase = tcBalance, Status = TestResultStatus.Passed, ExecutedAt = androidDate.AddHours(1) });
        runAndroid.TestResults.Add(new TestResult { TestCase = tcInternalTransfer, Status = TestResultStatus.Passed, ExecutedAt = androidDate.AddHours(1.5) });
        runAndroid.TestResults.Add(new TestResult { TestCase = tcBiometric, Status = TestResultStatus.Blocked, ExecutedAt = androidDate.AddHours(2), Notes = "Emulator does not support fingerprint sensor emulation; skipped on hardware" });
        runAndroid.TestResults.Add(new TestResult { TestCase = tc2FA, Status = TestResultStatus.Passed, ExecutedAt = androidDate.AddHours(2.5) });

        var q1Date = now.AddDays(-2);
        runQ1.TestResults.Add(new TestResult { TestCase = tcCreateUser, Status = TestResultStatus.Passed, ExecutedAt = q1Date.AddHours(1) });
        runQ1.TestResults.Add(new TestResult { TestCase = tcRoleAssignment, Status = TestResultStatus.Passed, ExecutedAt = q1Date.AddHours(1.5) });
        runQ1.TestResults.Add(new TestResult { TestCase = tcDeactivate, Status = TestResultStatus.Passed, ExecutedAt = q1Date.AddHours(2) });
        runQ1.TestResults.Add(new TestResult { TestCase = tcSalesReport, Status = TestResultStatus.Failed, ExecutedAt = q1Date.AddHours(2.5), Notes = "Total revenue off by $1,240.00 — suspected double-count on refunded orders. Ticket #4821 raised." });
        runQ1.TestResults.Add(new TestResult { TestCase = tcExportCSV, Status = TestResultStatus.Passed, ExecutedAt = q1Date.AddHours(3) });

        db.Projects.AddRange(ecommerce, banking, dashboard);

        db.TestSuites.AddRange(
            suiteCheckout, suiteAuth, suiteSearch,
            suiteAccounts, suiteTransfers, suiteSecurity,
            suiteUsers, suiteReporting);

        db.TestCases.AddRange(
            tcGuestCheckout, tcCoupon, tcCartPersistence, tcOutOfStock,
            tcLogin, tcLockout, tcPasswordReset,
            tcSearchRelevance, tcFilter,
            tcBalance, tcStatement,
            tcInternalTransfer, tcScheduledTransfer,
            tcBiometric, tcPINChange, tc2FA,
            tcCreateUser, tcRoleAssignment, tcDeactivate,
            tcSalesReport, tcExportCSV);

        db.TestRuns.AddRange(runRelease, runSprint, runIOS, runAndroid, runQ1);

        await db.SaveChangesAsync();
    }
}