using Microsoft.ServiceFabric.Services.Runtime;

// Registracija kao Stateful Service Fabric servis
ServiceRuntime.RegisterServiceAsync("TravelPlanServiceType",
    context => new TravelPlanStatefulService(context))
    .GetAwaiter().GetResult();

Thread.Sleep(Timeout.Infinite);
