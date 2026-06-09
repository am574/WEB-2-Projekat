using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.ServiceFabric.Data;
using Microsoft.ServiceFabric.Data.Collections;
using Microsoft.ServiceFabric.Services.Communication.AspNetCore;
using Microsoft.ServiceFabric.Services.Communication.Runtime;
using Microsoft.ServiceFabric.Services.Runtime;
using System.Fabric;
using System.Text;

internal sealed class TravelPlanStatefulService : StatefulService
{
    public TravelPlanStatefulService(StatefulServiceContext context)
        : base(context) { }

    protected override IEnumerable<ServiceReplicaListener> CreateServiceReplicaListeners()
    {
        return new ServiceReplicaListener[]
        {
            new ServiceReplicaListener(context =>
                new KestrelCommunicationListener(context, "ServiceEndpoint", (url, listener) =>
                {
                    var builder = WebApplication.CreateBuilder();

                    // Inject IReliableStateManager za stateful cache
                    builder.Services.AddSingleton<IReliableStateManager>(this.StateManager);

                    ConfigureServices(builder);

                    builder.WebHost.UseKestrel();
                    builder.WebHost.UseUrls(url);
                    builder.WebHost.UseServiceFabricIntegration(listener, ServiceFabricIntegrationOptions.UseReverseProxyIntegration);

                    var app = builder.Build();
                    ConfigureApp(app);
                    return app;
                }))
        };
    }

    // Primer koriscenja Reliable Collections za cache aktivnih planova
    protected override async Task RunAsync(CancellationToken cancellationToken)
    {
        var planCache = await StateManager.GetOrAddAsync<IReliableDictionary<Guid, string>>("activePlanCache");

        while (!cancellationToken.IsCancellationRequested)
        {
            using var tx = StateManager.CreateTransaction();
            var count = await planCache.GetCountAsync(tx);
            await Task.Delay(TimeSpan.FromMinutes(5), cancellationToken);
        }
    }

    private static void ConfigureServices(WebApplicationBuilder builder)
    {
        var config = builder.Configuration;

        builder.Services.AddDbContext<TravelPlanService.Data.PlanningDbContext>(options =>
            options.UseSqlServer(config.GetConnectionString("DefaultConnection")));

        builder.Services.AddAuthentication(Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = config["Jwt:Issuer"],
                    ValidAudience = config["Jwt:Audience"],
                    IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
                        System.Text.Encoding.UTF8.GetBytes(config["Jwt:Key"]!))
                };
            });

        builder.Services.AddAuthorization();
        builder.Services.AddHttpClient();
        builder.Services.AddControllers();
        builder.Services.AddCors(options =>
            options.AddDefaultPolicy(p =>
                p.WithOrigins(config["AllowedOrigin"]!)
                 .AllowAnyHeader().AllowAnyMethod()));
    }

    private static void ConfigureApp(WebApplication app)
    {
        app.UseCors();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();
    }
}
