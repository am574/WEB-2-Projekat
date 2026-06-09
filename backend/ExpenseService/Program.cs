using Microsoft.ServiceFabric.Services.Runtime;

ServiceRuntime.RegisterServiceAsync("ExpenseServiceType",
    context => new ExpenseStatelessService(context))
    .GetAwaiter().GetResult();

Thread.Sleep(Timeout.Infinite);
