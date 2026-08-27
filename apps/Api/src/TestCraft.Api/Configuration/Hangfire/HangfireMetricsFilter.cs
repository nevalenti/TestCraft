using Hangfire.States;
using Hangfire.Storage;

using Prometheus;

namespace TestCraft.Api.Configuration.Hangfire;

public sealed class HangfireMetricsFilter : IApplyStateFilter
{
    private static readonly Counter JobsFailed = Metrics.CreateCounter(
        "hangfire_jobs_failed_total",
        "Total Hangfire background jobs that transitioned to the Failed state.",
        new CounterConfiguration { LabelNames = ["job_name"] }
    );

    public void OnStateApplied(ApplyStateContext context, IWriteOnlyTransaction transaction)
    {
        if (context.NewState is FailedState)
        {
            JobsFailed.WithLabels(context.BackgroundJob.Job.Type.Name).Inc();
        }
    }

    public void OnStateUnapplied(ApplyStateContext context, IWriteOnlyTransaction transaction) { }
}
