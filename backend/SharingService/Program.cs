using Microsoft.ServiceFabric.Services.Runtime;

ServiceRuntime.RegisterServiceAsync("SharingServiceType",
    context => new SharingStatelessService(context))
    .GetAwaiter().GetResult();

Thread.Sleep(Timeout.Infinite);
