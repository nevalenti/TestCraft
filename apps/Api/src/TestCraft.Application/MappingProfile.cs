using AutoMapper;
using TestCraft.Application.Import;
using TestCraft.Application.Projects;
using TestCraft.Application.TestCases;
using TestCraft.Application.TestCaseSteps;
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

        CreateMap<TestCase, TestCaseResponse>()
            .ForMember(d => d.StepCount, o => o.MapFrom(c => c.Steps.Count(s => !s.IsDeleted)));

        CreateMap<TestCaseStep, TestCaseStepResponse>();

        CreateMap<TestRun, TestRunResponse>();

        CreateMap<TestResult, TestResultResponse>()
            .ForMember(d => d.SuiteId, o => o.MapFrom(r => r.TestCase!.SuiteId))
            .ForMember(d => d.TestCaseName, o => o.MapFrom(r => r.TestCase!.Name));

        CreateMap<ImportJob, ImportJobResponse>();
    }
}
