using System.Text.Json;
using AutoMapper;
using TestCraft.Application.ApiTokens;
using TestCraft.Application.Attachments;
using TestCraft.Application.Import;
using TestCraft.Application.Labels;
using TestCraft.Application.Notifications;
using TestCraft.Application.Projects;
using TestCraft.Application.ShareTokens;
using TestCraft.Application.TestCases;
using TestCraft.Application.TestCaseSteps;
using TestCraft.Application.TestPlans;
using TestCraft.Application.TestResults;
using TestCraft.Application.TestRuns;
using TestCraft.Application.TestSuites;
using TestCraft.Domain.Entities;

namespace TestCraft.Application;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Project, ProjectResponse>()
            .ForMember(
                d => d.SuiteCount,
                o => o.MapFrom(p => p.TestSuites.Count(s => !s.IsDeleted))
            )
            .ForMember(d => d.RunCount, o => o.MapFrom(p => p.TestRuns.Count(r => !r.IsDeleted)));

        CreateMap<TestSuite, TestSuiteResponse>();

        CreateMap<Label, LabelResponse>();

        CreateMap<TestCase, TestCaseResponse>()
            .ForMember(d => d.StepCount, o => o.MapFrom(c => c.Steps.Count(s => !s.IsDeleted)))
            .ForMember(
                d => d.Labels,
                o => o.MapFrom(c => c.TestCaseLabels.Select(tcl => tcl.Label))
            );

        CreateMap<TestCaseStep, TestCaseStepResponse>();

        CreateMap<TestRun, TestRunResponse>();

        CreateMap<TestResult, TestResultResponse>()
            .ForMember(d => d.SuiteId, o => o.MapFrom(r => r.TestCase!.SuiteId))
            .ForMember(d => d.TestCaseName, o => o.MapFrom(r => r.TestCase!.Name));

        CreateMap<ImportJob, ImportJobResponse>();

        CreateMap<TestPlan, TestPlanResponse>()
            .ForMember(d => d.CaseCount, o => o.MapFrom(p => p.TestPlanCases.Count));

        CreateMap<ApiToken, ApiTokenResponse>();

        CreateMap<Attachment, AttachmentResponse>();

        CreateMap<ShareToken, ShareTokenResponse>(MemberList.None)
            .ConstructUsing(s => new ShareTokenResponse(
                s.Id,
                s.TestRunId,
                s.Token,
                s.ExpiresAt,
                s.CreatedAt
            ));

        CreateMap<WebhookSubscription, WebhookSubscriptionResponse>(MemberList.None)
            .ConstructUsing(w => new WebhookSubscriptionResponse(
                w.Id,
                w.ProjectId,
                w.Url,
                w.IsActive,
                JsonSerializer.Deserialize<List<string>>(w.Events) ?? new List<string>(),
                w.CreatedAt
            ));

        CreateMap<EmailSubscription, EmailSubscriptionResponse>(MemberList.None)
            .ConstructUsing(e => new EmailSubscriptionResponse(
                e.Id,
                e.ProjectId,
                e.Email,
                e.IsActive,
                JsonSerializer.Deserialize<List<string>>(e.Events) ?? new List<string>(),
                e.CreatedAt
            ));
    }
}
