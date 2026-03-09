using Microsoft.EntityFrameworkCore;
using SignalRChat.Data;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SignalRChat.Hubs;
using SignalRChat.Services;

var builder = WebApplication.CreateBuilder(args);

// Add MVC Controllers
builder.Services.AddControllersWithViews();

// Register SignalR
builder.Services.AddSignalR();

// Register SQLite database
builder.Services.AddDbContext<ChatDbContext>(options =>
    options.UseSqlite("Data Source=chat.db"));

// Register custom services
builder.Services.AddSingleton<ChatMemoryStore>();
builder.Services.AddScoped<IChatService, ChatService>();

var app = builder.Build();

// Configure middleware
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
}

app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

// MVC routes
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// SignalR endpoint
app.MapHub<ChatHub>("/chatHub");

app.Run();