using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SignalRChat.Hubs;
using SignalRChat.Services;
using SignalRChat.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

// Register SignalR for real-time communication
builder.Services.AddSignalR();

// Register our custom services and data store
// We use Singleton for in-memory store so it persists across requests
builder.Services.AddSingleton<ChatMemoryStore>();
builder.Services.AddScoped<IChatService, ChatService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
}

app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

// Map MVC Controller routes
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// Map SignalR Hub endpoint
// This is the URL that clients will connect to
app.MapHub<ChatHub>("/chatHub");

app.Run();