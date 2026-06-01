import { logger } from "@/infrastructure/logging/logger";

import prisma from "./prisma.client.js";

export const seedDatabase = async () => {
  const existingProjects = await prisma.project.count({
    where: { isDeleted: false },
  });
  if (existingProjects > 0) {
    logger.info("Database already seeded, skipping.");
    return;
  }

  logger.info("Seeding database...");

  const now = new Date();

  const seedUserId =
    process.env.SEED_USER_ID ?? "6e08c1b4-4627-456c-a6ab-11d37ca76df0";

  const ecommerce = await prisma.project.create({
    data: {
      name: "E-Commerce Platform",
      description:
        "Core shopping experience — cart, checkout, orders, and payments",
      userId: seedUserId,
    },
  });
  const banking = await prisma.project.create({
    data: {
      name: "Mobile Banking App",
      description:
        "iOS and Android banking client covering accounts, transfers, and security",
      userId: seedUserId,
    },
  });
  const dashboard = await prisma.project.create({
    data: {
      name: "Admin Dashboard",
      description:
        "Internal back-office for user management, reporting, and configuration",
      userId: seedUserId,
    },
  });

  const suiteCheckout = await prisma.testSuite.create({
    data: {
      projectId: ecommerce.id,
      name: "Checkout Flow",
      description:
        "End-to-end purchase journeys for guest and registered users",
    },
  });
  const suiteAuth = await prisma.testSuite.create({
    data: {
      projectId: ecommerce.id,
      name: "User Authentication",
      description:
        "Login, registration, password reset, and session management",
    },
  });
  const suiteSearch = await prisma.testSuite.create({
    data: {
      projectId: ecommerce.id,
      name: "Product Search & Filtering",
      description: "Search relevance, faceted filters, and result sorting",
    },
  });
  const suiteAccounts = await prisma.testSuite.create({
    data: {
      projectId: banking.id,
      name: "Account Management",
      description: "Balance enquiry, transaction history, and profile updates",
    },
  });
  const suiteTransfers = await prisma.testSuite.create({
    data: {
      projectId: banking.id,
      name: "Fund Transfers",
      description:
        "Internal transfers, payee management, and scheduled payments",
    },
  });
  const suiteSecurity = await prisma.testSuite.create({
    data: {
      projectId: banking.id,
      name: "Security & Authentication",
      description: "Biometric login, PIN management, and 2FA flows",
    },
  });
  const suiteUsers = await prisma.testSuite.create({
    data: {
      projectId: dashboard.id,
      name: "User Management",
      description:
        "Create, update, and deactivate user accounts and role assignments",
    },
  });
  const suiteReporting = await prisma.testSuite.create({
    data: {
      projectId: dashboard.id,
      name: "Reporting & Exports",
      description: "Generate, filter, and export operational reports",
    },
  });

  const tcGuestCheckout = await prisma.testCase.create({
    data: {
      suiteId: suiteCheckout.id,
      name: "Guest checkout completes with credit card",
      description: "Verifies full purchase flow without account creation",
      priority: "Medium",
      steps: {
        createMany: {
          data: [
            {
              order: 1,
              action: "Add a product to the cart and navigate to /cart",
              expectedResult:
                "Cart page shows the correct item, quantity, and subtotal",
            },
            {
              order: 2,
              action:
                "Click 'Proceed to Checkout' and select 'Continue as Guest'",
              expectedResult:
                "Guest checkout form is shown with shipping address fields",
            },
            {
              order: 3,
              action:
                "Fill in a valid US shipping address and click 'Continue'",
              expectedResult:
                "Shipping method selection page appears with at least two options",
            },
            {
              order: 4,
              action: "Select 'Standard Shipping' and continue to payment",
              expectedResult:
                "Payment form loads with card number, expiry, and CVV fields",
            },
            {
              order: 5,
              action:
                "Enter valid test card 4111 1111 1111 1111, exp 12/28, CVV 123",
              expectedResult:
                "Card details are accepted and the 'Place Order' button is enabled",
            },
            {
              order: 6,
              action: "Click 'Place Order'",
              expectedResult:
                "Order confirmation page shows order number, summary, and estimated delivery date",
            },
          ],
        },
      },
    },
  });

  const tcCoupon = await prisma.testCase.create({
    data: {
      suiteId: suiteCheckout.id,
      name: "Discount coupon applied correctly",
      description:
        "Validates coupon entry, error handling, and discount calculation",
      priority: "Medium",
      steps: {
        createMany: {
          data: [
            {
              order: 1,
              action: "Add any product to the cart and open the cart page",
              expectedResult: "Cart shows the item with its full price",
            },
            {
              order: 2,
              action: "Enter coupon code 'INVALIDXYZ' and click Apply",
              expectedResult:
                "Error message 'This coupon code is not valid' appears beneath the input",
            },
            {
              order: 3,
              action:
                "Clear the field, enter coupon code 'SAVE20', and click Apply",
              expectedResult:
                "A 20% discount line is shown and the order total is reduced accordingly",
            },
            {
              order: 4,
              action: "Proceed through checkout to the order summary page",
              expectedResult:
                "Summary reflects the discounted total throughout the remaining steps",
            },
          ],
        },
      },
    },
  });

  const tcCartPersistence = await prisma.testCase.create({
    data: {
      suiteId: suiteCheckout.id,
      name: "Cart persists across browser sessions",
      description:
        "Ensures cart state survives page refresh and browser close for logged-in users",
      priority: "Medium",
      steps: {
        createMany: {
          data: [
            {
              order: 1,
              action: "Log in and add three distinct products to the cart",
              expectedResult: "Cart icon shows badge count of 3",
            },
            {
              order: 2,
              action: "Hard-refresh the page (Ctrl+Shift+R)",
              expectedResult:
                "All three items remain in the cart with correct quantities",
            },
            {
              order: 3,
              action:
                "Close the browser tab, reopen the site, and navigate to /cart",
              expectedResult: "Cart still contains all three items",
            },
          ],
        },
      },
    },
  });

  const tcOutOfStock = await prisma.testCase.create({
    data: {
      suiteId: suiteCheckout.id,
      name: "Out-of-stock item blocked at checkout",
      description: "Prevents purchase when inventory reaches zero mid-session",
      priority: "Medium",
      steps: {
        createMany: {
          data: [
            {
              order: 1,
              action: "Add a product that has only 1 unit in stock to the cart",
              expectedResult: "Item added successfully",
            },
            {
              order: 2,
              action: "Simulate stock depletion via admin panel or API call",
              expectedResult: "Stock count is now 0 in the database",
            },
            {
              order: 3,
              action: "Attempt to complete checkout",
              expectedResult:
                "User sees an error 'One or more items in your cart are no longer available' and cannot proceed",
            },
          ],
        },
      },
    },
  });

  const tcLogin = await prisma.testCase.create({
    data: {
      suiteId: suiteAuth.id,
      name: "Successful login with valid credentials",
      description: "Standard happy-path login for an existing account",
      priority: "Medium",
      steps: {
        createMany: {
          data: [
            {
              order: 1,
              action: "Navigate to /login",
              expectedResult:
                "Login form is displayed with email and password fields",
            },
            {
              order: 2,
              action:
                "Enter registered email 'test@example.com' and correct password",
              expectedResult:
                "Both fields accept input without validation errors",
            },
            {
              order: 3,
              action: "Click 'Sign In'",
              expectedResult:
                "User is redirected to their account dashboard; name appears in the top navigation",
            },
          ],
        },
      },
    },
  });

  const tcLockout = await prisma.testCase.create({
    data: {
      suiteId: suiteAuth.id,
      name: "Account locked after 5 failed login attempts",
      description: "Validates brute-force protection on the login endpoint",
      priority: "Medium",
      steps: {
        createMany: {
          data: [
            {
              order: 1,
              action:
                "Navigate to /login and enter the correct email with a wrong password",
              expectedResult:
                "Error message 'Incorrect email or password' is shown; counter starts",
            },
            {
              order: 2,
              action: "Repeat the failed attempt 4 more times",
              expectedResult:
                "Each attempt shows the same error; on the 5th attempt the account is locked",
            },
            {
              order: 3,
              action: "Attempt login with the correct password",
              expectedResult:
                "Message 'Account locked. Please check your email to unlock.' prevents access",
            },
            {
              order: 4,
              action: "Open the unlock email and click the link",
              expectedResult:
                "Account is unlocked and the user can log in normally",
            },
          ],
        },
      },
    },
  });

  const tcPasswordReset = await prisma.testCase.create({
    data: {
      suiteId: suiteAuth.id,
      name: "Password reset via email link",
      description:
        "Full reset flow from forgot-password to successful login with new password",
      priority: "Medium",
      steps: {
        createMany: {
          data: [
            {
              order: 1,
              action: "Click 'Forgot password?' on the login page",
              expectedResult:
                "Password reset page appears with an email input field",
            },
            {
              order: 2,
              action: "Enter a registered email address and submit",
              expectedResult:
                "Confirmation message 'If an account exists, you will receive an email'",
            },
            {
              order: 3,
              action: "Open the password reset email and click the reset link",
              expectedResult: "New-password form opens in the browser",
            },
            {
              order: 4,
              action: "Enter a new strong password and confirm it, then submit",
              expectedResult:
                "Success message shown; user can log in with the new password",
            },
          ],
        },
      },
    },
  });

  const tcSearchRelevance = await prisma.testCase.create({
    data: {
      suiteId: suiteSearch.id,
      name: "Search returns relevant results",
      description:
        "Validates that the full-text search ranks matching products first",
      priority: "Medium",
      steps: {
        createMany: {
          data: [
            {
              order: 1,
              action:
                "Type 'wireless headphones' into the search bar and press Enter",
              expectedResult:
                "Results page loads with products containing 'wireless' and 'headphones'",
            },
            {
              order: 2,
              action: "Verify the top 3 results are all headphone products",
              expectedResult:
                "At least 3 of the top 5 results match the search intent",
            },
            {
              order: 3,
              action: "Check that unrelated products are not in the first page",
              expectedResult: "No obviously irrelevant items appear on page 1",
            },
          ],
        },
      },
    },
  });

  const tcFilter = await prisma.testCase.create({
    data: {
      suiteId: suiteSearch.id,
      name: "Filter by category and price range",
      description:
        "Ensures faceted filtering updates results and URL correctly",
      priority: "Medium",
      steps: {
        createMany: {
          data: [
            {
              order: 1,
              action: "Navigate to the Electronics category page",
              expectedResult: "All products shown are tagged as Electronics",
            },
            {
              order: 2,
              action: "Set price range filter to $50–$200 and apply",
              expectedResult:
                "Results update to show only products priced between $50 and $200",
            },
            {
              order: 3,
              action: "Check the browser URL",
              expectedResult:
                "URL contains query parameters reflecting the active filters (e.g. ?min=50&max=200)",
            },
          ],
        },
      },
    },
  });

  const tcBalance = await prisma.testCase.create({
    data: {
      suiteId: suiteAccounts.id,
      name: "Account balance reflects recent transactions",
      description:
        "Verifies that the displayed balance updates in real time after a debit",
      priority: "Medium",
      steps: {
        createMany: {
          data: [
            {
              order: 1,
              action:
                "Open the app and log in to a test account with a known balance",
              expectedResult: "Dashboard shows the correct current balance",
            },
            {
              order: 2,
              action: "Initiate a $50 transfer to another account",
              expectedResult: "Transfer confirmation screen appears",
            },
            {
              order: 3,
              action: "Confirm the transfer and return to the dashboard",
              expectedResult: "Balance has decreased by exactly $50.00",
            },
            {
              order: 4,
              action: "Navigate to transaction history",
              expectedResult:
                "The $50 debit appears as the most recent transaction with today's date",
            },
          ],
        },
      },
    },
  });

  const tcStatement = await prisma.testCase.create({
    data: {
      suiteId: suiteAccounts.id,
      name: "Download PDF account statement",
      description:
        "Checks that the statement covers the correct date range and is well-formed",
      priority: "Medium",
      steps: {
        createMany: {
          data: [
            {
              order: 1,
              action: "Go to Statements and select 'Last 3 months'",
              expectedResult:
                "Date range selector shows the correct start and end dates",
            },
            {
              order: 2,
              action: "Click 'Download PDF'",
              expectedResult:
                "Browser triggers a PDF download within 5 seconds",
            },
            {
              order: 3,
              action: "Open the downloaded PDF",
              expectedResult:
                "PDF contains account holder name, IBAN, and all transactions within the selected period",
            },
          ],
        },
      },
    },
  });

  const tcInternalTransfer = await prisma.testCase.create({
    data: {
      suiteId: suiteTransfers.id,
      name: "Transfer between own accounts succeeds",
      description: "Happy path for moving funds between checking and savings",
      priority: "Medium",
      steps: {
        createMany: {
          data: [
            {
              order: 1,
              action:
                "Select 'Transfer' from the bottom navigation and choose 'Between My Accounts'",
              expectedResult:
                "Both checking and savings accounts appear as options",
            },
            {
              order: 2,
              action:
                "Set From: Checking, To: Savings, Amount: $200, Date: today",
              expectedResult:
                "Transfer summary shows correct debit and credit accounts",
            },
            {
              order: 3,
              action: "Confirm with PIN",
              expectedResult:
                "Success message shown; checking balance reduced by $200, savings increased by $200",
            },
          ],
        },
      },
    },
  });

  const tcScheduledTransfer = await prisma.testCase.create({
    data: {
      suiteId: suiteTransfers.id,
      name: "Scheduled recurring transfer is created",
      description:
        "Validates that a monthly standing order is persisted and displayed",
      priority: "Medium",
      steps: {
        createMany: {
          data: [
            {
              order: 1,
              action:
                "Navigate to Transfers > Scheduled and tap 'New Scheduled Transfer'",
              expectedResult: "Scheduled transfer form opens",
            },
            {
              order: 2,
              action:
                "Configure: Amount $100, To: saved payee 'Rent', Frequency: Monthly, Start date: 1st of next month",
              expectedResult:
                "All fields accept the input without validation errors",
            },
            {
              order: 3,
              action: "Confirm and save",
              expectedResult:
                "New scheduled transfer appears in the list with the correct next execution date",
            },
          ],
        },
      },
    },
  });

  const tcBiometric = await prisma.testCase.create({
    data: {
      suiteId: suiteSecurity.id,
      name: "Biometric login authenticates successfully",
      description:
        "Face ID / fingerprint is used to unlock the app on a supported device",
      priority: "Medium",
      steps: {
        createMany: {
          data: [
            {
              order: 1,
              action: "Force-quit the app and relaunch it",
              expectedResult:
                "App displays the biometric prompt instead of the PIN screen",
            },
            {
              order: 2,
              action: "Authenticate using the enrolled fingerprint",
              expectedResult:
                "App unlocks directly to the dashboard without requiring PIN",
            },
          ],
        },
      },
    },
  });

  const tcPINChange = await prisma.testCase.create({
    data: {
      suiteId: suiteSecurity.id,
      name: "PIN changed successfully",
      description: "Verifies the full change-PIN flow including confirmation",
      priority: "Medium",
      steps: {
        createMany: {
          data: [
            {
              order: 1,
              action: "Go to Settings > Security > Change PIN",
              expectedResult: "Prompt to enter current PIN appears",
            },
            {
              order: 2,
              action: "Enter current PIN correctly",
              expectedResult: "New PIN entry screen appears",
            },
            {
              order: 3,
              action: "Enter a new 6-digit PIN and confirm it",
              expectedResult: "Success confirmation shown",
            },
            {
              order: 4,
              action: "Lock the app and re-authenticate with the new PIN",
              expectedResult:
                "Login succeeds with the new PIN; old PIN is rejected",
            },
          ],
        },
      },
    },
  });

  const tc2FA = await prisma.testCase.create({
    data: {
      suiteId: suiteSecurity.id,
      name: "Enable two-factor authentication via authenticator app",
      description: "TOTP-based 2FA setup and first-login verification",
      priority: "Medium",
      steps: {
        createMany: {
          data: [
            {
              order: 1,
              action:
                "Navigate to Settings > Security > Two-Factor Authentication and tap Enable",
              expectedResult: "QR code and manual key are displayed",
            },
            {
              order: 2,
              action: "Scan the QR code with an authenticator app",
              expectedResult: "App generates a 6-digit TOTP code",
            },
            {
              order: 3,
              action:
                "Enter the TOTP code into the verification field and confirm",
              expectedResult: "2FA is enabled; recovery codes are displayed",
            },
            {
              order: 4,
              action: "Log out and log back in with correct credentials",
              expectedResult:
                "App requests a TOTP code on the second step; correct code allows entry",
            },
          ],
        },
      },
    },
  });

  const tcCreateUser = await prisma.testCase.create({
    data: {
      suiteId: suiteUsers.id,
      name: "Create a new admin user account",
      description:
        "Verifies that a super-admin can provision a new admin-level user",
      priority: "Medium",
      steps: {
        createMany: {
          data: [
            {
              order: 1,
              action: "Navigate to Users > All Users and click 'New User'",
              expectedResult:
                "User creation form opens with fields for name, email, and role",
            },
            {
              order: 2,
              action:
                "Fill in Name: 'Alex Carter', Email: 'alex.carter@company.com', Role: Admin",
              expectedResult: "Form accepts all inputs without errors",
            },
            {
              order: 3,
              action: "Click Save",
              expectedResult:
                "New user appears in the user list with status 'Pending Invitation'",
            },
            {
              order: 4,
              action:
                "Verify the invitation email is received at the specified address",
              expectedResult: "Email contains a personalised activation link",
            },
          ],
        },
      },
    },
  });

  const tcRoleAssignment = await prisma.testCase.create({
    data: {
      suiteId: suiteUsers.id,
      name: "Assign viewer role to existing user",
      description:
        "Downgrades an editor to viewer and verifies permission changes take effect",
      priority: "Medium",
      steps: {
        createMany: {
          data: [
            {
              order: 1,
              action:
                "Find an existing user with Editor role and open their profile",
              expectedResult:
                "User profile page shows current role as 'Editor'",
            },
            {
              order: 2,
              action: "Change the role dropdown to 'Viewer' and save",
              expectedResult: "Role updated to Viewer; success toast shown",
            },
            {
              order: 3,
              action: "Log in as that user in a separate session",
              expectedResult:
                "Edit and delete actions are hidden; only read access is available",
            },
          ],
        },
      },
    },
  });

  const tcDeactivate = await prisma.testCase.create({
    data: {
      suiteId: suiteUsers.id,
      name: "Deactivate a user account",
      description:
        "Ensures deactivated users cannot log in and are marked accordingly",
      priority: "Medium",
      steps: {
        createMany: {
          data: [
            {
              order: 1,
              action:
                "Open a target user's profile and click 'Deactivate Account'",
              expectedResult: "Confirmation dialog appears",
            },
            {
              order: 2,
              action: "Confirm deactivation",
              expectedResult: "User status changes to 'Inactive' in the list",
            },
            {
              order: 3,
              action: "Attempt to log in as the deactivated user",
              expectedResult:
                "Login is rejected with message 'This account has been deactivated'",
            },
          ],
        },
      },
    },
  });

  const tcSalesReport = await prisma.testCase.create({
    data: {
      suiteId: suiteReporting.id,
      name: "Generate monthly revenue report",
      description:
        "Validates that the revenue report aggregates data correctly for a given month",
      priority: "Medium",
      steps: {
        createMany: {
          data: [
            {
              order: 1,
              action:
                "Navigate to Reports > Revenue and set the date range to the previous month",
              expectedResult: "Report parameters are set correctly",
            },
            {
              order: 2,
              action: "Click 'Generate Report'",
              expectedResult:
                "Report loads within 10 seconds with revenue broken down by day",
            },
            {
              order: 3,
              action: "Compare the totals against the known test dataset",
              expectedResult:
                "Total revenue matches the expected figure within ±$0.01 rounding",
            },
          ],
        },
      },
    },
  });

  const tcExportCSV = await prisma.testCase.create({
    data: {
      suiteId: suiteReporting.id,
      name: "Export user activity data to CSV",
      description:
        "Ensures the exported CSV is correctly formatted and contains all expected columns",
      priority: "Medium",
      steps: {
        createMany: {
          data: [
            {
              order: 1,
              action: "Open Reports > User Activity and apply a 7-day filter",
              expectedResult: "Table shows activity data for the last 7 days",
            },
            {
              order: 2,
              action: "Click 'Export CSV'",
              expectedResult: "A CSV file is downloaded within 3 seconds",
            },
            {
              order: 3,
              action: "Open the CSV in a spreadsheet application",
              expectedResult:
                "File contains columns: User ID, Name, Email, Action, Timestamp — with no malformed rows",
            },
          ],
        },
      },
    },
  });

  const h = (base: Date, hours: number) =>
    new Date(base.getTime() + hours * 3_600_000);

  const baseDate = h(now, -14 * 24);
  const sprintDate = h(now, -3 * 24);
  const iosDate = h(now, -7 * 24);
  const androidDate = h(now, -5 * 24);
  const q1Date = h(now, -2 * 24);

  const runRelease = await prisma.testRun.create({
    data: {
      projectId: ecommerce.id,
      name: "v2.5.0 Release Regression",
      environment: "Production",
      status: "Active",
    },
  });
  const runSprint = await prisma.testRun.create({
    data: {
      projectId: ecommerce.id,
      name: "Sprint 34 Smoke Test",
      environment: "Staging",
      status: "Active",
    },
  });
  const runIOS = await prisma.testRun.create({
    data: {
      projectId: banking.id,
      name: "iOS 17 Compatibility",
      environment: "iOS 17 Simulator",
      status: "Active",
    },
  });
  const runAndroid = await prisma.testRun.create({
    data: {
      projectId: banking.id,
      name: "Android 14 Regression",
      environment: "Android 14 Emulator",
      status: "Active",
    },
  });
  const runQ1 = await prisma.testRun.create({
    data: {
      projectId: dashboard.id,
      name: "Q1 2026 Release Validation",
      environment: "Staging",
      status: "Active",
    },
  });

  await prisma.testResult.createMany({
    data: [
      {
        testRunId: runRelease.id,
        testCaseId: tcGuestCheckout.id,
        status: "Passed",
        executedAt: h(baseDate, 1),
        notes: "All steps passed; confirmation email received within 30 s",
      },
      {
        testRunId: runRelease.id,
        testCaseId: tcCoupon.id,
        status: "Failed",
        executedAt: h(baseDate, 1.5),
        notes:
          "SAVE20 applied a 10% discount instead of 20%. Likely a config issue on prod.",
      },
      {
        testRunId: runRelease.id,
        testCaseId: tcCartPersistence.id,
        status: "Passed",
        executedAt: h(baseDate, 2),
      },
      {
        testRunId: runRelease.id,
        testCaseId: tcOutOfStock.id,
        status: "Blocked",
        executedAt: h(baseDate, 2.5),
        notes:
          "Admin panel unavailable during this run window; could not simulate stock depletion",
      },
      {
        testRunId: runRelease.id,
        testCaseId: tcLogin.id,
        status: "Passed",
        executedAt: h(baseDate, 3),
      },
      {
        testRunId: runRelease.id,
        testCaseId: tcLockout.id,
        status: "Passed",
        executedAt: h(baseDate, 3.5),
      },
      {
        testRunId: runRelease.id,
        testCaseId: tcPasswordReset.id,
        status: "Failed",
        executedAt: h(baseDate, 4),
        notes:
          "Reset email not delivered in prod. Possible SES rate-limit issue — raised with DevOps.",
      },
      {
        testRunId: runRelease.id,
        testCaseId: tcSearchRelevance.id,
        status: "Passed",
        executedAt: h(baseDate, 4.5),
      },
      {
        testRunId: runRelease.id,
        testCaseId: tcFilter.id,
        status: "Passed",
        executedAt: h(baseDate, 5),
      },

      {
        testRunId: runSprint.id,
        testCaseId: tcGuestCheckout.id,
        status: "Passed",
        executedAt: h(sprintDate, 1),
      },
      {
        testRunId: runSprint.id,
        testCaseId: tcCoupon.id,
        status: "Passed",
        executedAt: h(sprintDate, 1.5),
        notes: "Discount now correct after coupon-config hotfix deployed",
      },
      {
        testRunId: runSprint.id,
        testCaseId: tcLogin.id,
        status: "Passed",
        executedAt: h(sprintDate, 2),
      },
      {
        testRunId: runSprint.id,
        testCaseId: tcPasswordReset.id,
        status: "Passed",
        executedAt: h(sprintDate, 2.5),
        notes: "Email delivered in ~12 s on staging",
      },
      {
        testRunId: runSprint.id,
        testCaseId: tcSearchRelevance.id,
        status: "Skipped",
        executedAt: h(sprintDate, 3),
        notes: "Search index rebuild in progress; deferred to next run",
      },

      {
        testRunId: runIOS.id,
        testCaseId: tcBalance.id,
        status: "Passed",
        executedAt: h(iosDate, 1),
      },
      {
        testRunId: runIOS.id,
        testCaseId: tcStatement.id,
        status: "Passed",
        executedAt: h(iosDate, 1.5),
      },
      {
        testRunId: runIOS.id,
        testCaseId: tcInternalTransfer.id,
        status: "Passed",
        executedAt: h(iosDate, 2),
      },
      {
        testRunId: runIOS.id,
        testCaseId: tcBiometric.id,
        status: "Passed",
        executedAt: h(iosDate, 2.5),
        notes: "Face ID prompt appears within 1 s on iPhone 15 Pro",
      },
      {
        testRunId: runIOS.id,
        testCaseId: tcPINChange.id,
        status: "Passed",
        executedAt: h(iosDate, 3),
      },
      {
        testRunId: runIOS.id,
        testCaseId: tc2FA.id,
        status: "Failed",
        executedAt: h(iosDate, 3.5),
        notes:
          "TOTP code rejected on first attempt due to clock drift on simulator. Works on real device.",
      },
      {
        testRunId: runIOS.id,
        testCaseId: tcScheduledTransfer.id,
        status: "Passed",
        executedAt: h(iosDate, 4),
      },

      {
        testRunId: runAndroid.id,
        testCaseId: tcBalance.id,
        status: "Passed",
        executedAt: h(androidDate, 1),
      },
      {
        testRunId: runAndroid.id,
        testCaseId: tcInternalTransfer.id,
        status: "Passed",
        executedAt: h(androidDate, 1.5),
      },
      {
        testRunId: runAndroid.id,
        testCaseId: tcBiometric.id,
        status: "Blocked",
        executedAt: h(androidDate, 2),
        notes:
          "Emulator does not support fingerprint sensor emulation; skipped on hardware",
      },
      {
        testRunId: runAndroid.id,
        testCaseId: tc2FA.id,
        status: "Passed",
        executedAt: h(androidDate, 2.5),
      },

      {
        testRunId: runQ1.id,
        testCaseId: tcCreateUser.id,
        status: "Passed",
        executedAt: h(q1Date, 1),
      },
      {
        testRunId: runQ1.id,
        testCaseId: tcRoleAssignment.id,
        status: "Passed",
        executedAt: h(q1Date, 1.5),
      },
      {
        testRunId: runQ1.id,
        testCaseId: tcDeactivate.id,
        status: "Passed",
        executedAt: h(q1Date, 2),
      },
      {
        testRunId: runQ1.id,
        testCaseId: tcSalesReport.id,
        status: "Failed",
        executedAt: h(q1Date, 2.5),
        notes:
          "Total revenue off by $1,240.00 — suspected double-count on refunded orders. Ticket #4821 raised.",
      },
      {
        testRunId: runQ1.id,
        testCaseId: tcExportCSV.id,
        status: "Passed",
        executedAt: h(q1Date, 3),
      },
    ],
  });

  logger.info("Seeding complete.");
};

import { fileURLToPath } from "node:url";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
