using Microsoft.AspNetCore.Mvc;

namespace SignalRChat.Controllers
{
    /// <summary>
    /// Standard MVC Controller.
    /// In this application, it simply serves the main view for the chat interface.
    /// All real-time logic is handled by the SignalR ChatHub.
    /// </summary>
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View();
        }
    }
}