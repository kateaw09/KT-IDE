using System;
using System.IO;
using System.Net;
using System.Text;
using System.Diagnostics;
using System.Threading;

namespace KT_IDE_Launcher
{
    static class Program
    {
        private static HttpListener _listener;
        private static string _distDir;
        private static bool _running = true;

        [STAThread]
        static void Main()
        {
            // Mutex to ensure single instance
            bool isNewInstance;
            using (var mutex = new Mutex(true, "KT_IDE_SINGLE_INSTANCE_MUTEX", out isNewInstance))
            {
                if (!isNewInstance)
                {
                    // Already running - notify and exit
                    return;
                }

                try
                {
                    string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                    _distDir = Path.Combine(baseDir, "dist");

                    if (!Directory.Exists(_distDir))
                    {
                        // Fallback check parent folder
                        string parentDist = Path.Combine(baseDir, "..", "dist");
                        if (Directory.Exists(parentDist))
                        {
                            _distDir = Path.GetFullPath(parentDist);
                        }
                    }

                    int port = 1420;
                    _listener = new HttpListener();
                    
                    // Try port 1420, fallback if busy
                    for (int p = 1420; p <= 1450; p++)
                    {
                        try
                        {
                            _listener = new HttpListener();
                            _listener.Prefixes.Add("http://127.0.0.1:" + p + "/");
                            _listener.Start();
                            port = p;
                            break;
                        }
                        catch
                        {
                            _listener.Close();
                            _listener = null;
                        }
                    }

                    if (_listener == null)
                    {
                        return;
                    }

                    // Start background server thread
                    Thread serverThread = new Thread(ServerLoop);
                    serverThread.IsBackground = true;
                    serverThread.Start();

                    string appUrl = "http://127.0.0.1:" + port + "/";

                    // Launch in Native Windows App Window via MS Edge App Mode
                    string edgePath = GetEdgePath();
                    Process appProcess = null;

                    if (!string.IsNullOrEmpty(edgePath) && File.Exists(edgePath))
                    {
                        string dataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "KT-IDE", "app-data");
                        ProcessStartInfo psi = new ProcessStartInfo
                        {
                            FileName = edgePath,
                            Arguments = "--app=" + appUrl + " --window-size=1440,900 --user-data-dir=\"" + dataDir + "\"",
                            UseShellExecute = false
                        };
                        appProcess = Process.Start(psi);
                    }
                    else
                    {
                        Process.Start(appUrl);
                    }

                    if (appProcess != null)
                    {
                        appProcess.WaitForExit();
                    }
                    else
                    {
                        // Keep alive while listening
                        while (_running)
                        {
                            Thread.Sleep(1000);
                        }
                    }
                }
                catch (Exception)
                {
                    // Silent exit on winexe
                }
                finally
                {
                    _running = false;
                    if (_listener != null && _listener.IsListening)
                    {
                        try { _listener.Stop(); } catch { }
                    }
                }
            }
        }

        private static void ServerLoop()
        {
            while (_running && _listener != null && _listener.IsListening)
            {
                try
                {
                    HttpListenerContext context = _listener.GetContext();
                    ThreadPool.QueueUserWorkItem(ProcessRequest, context);
                }
                catch
                {
                    if (!_running) break;
                }
            }
        }

        private static void ProcessRequest(object state)
        {
            HttpListenerContext context = (HttpListenerContext)state;
            try
            {
                string urlPath = context.Request.Url.AbsolutePath.TrimStart('/');
                if (string.IsNullOrEmpty(urlPath))
                {
                    urlPath = "index.html";
                }

                string filePath = Path.Combine(_distDir, urlPath.Replace('/', Path.DirectorySeparatorChar));

                if (!File.Exists(filePath))
                {
                    // SPA fallback
                    filePath = Path.Combine(_distDir, "index.html");
                }

                if (File.Exists(filePath))
                {
                    byte[] bytes = File.ReadAllBytes(filePath);
                    context.Response.ContentType = GetMimeType(filePath);
                    context.Response.ContentLength64 = bytes.Length;
                    context.Response.StatusCode = 200;
                    context.Response.AddHeader("Cache-Control", "no-cache");
                    context.Response.OutputStream.Write(bytes, 0, bytes.Length);
                }
                else
                {
                    context.Response.StatusCode = 404;
                }
            }
            catch
            {
                try { context.Response.StatusCode = 500; } catch { }
            }
            finally
            {
                try { context.Response.Close(); } catch { }
            }
        }

        private static string GetMimeType(string path)
        {
            string ext = Path.GetExtension(path).ToLowerInvariant();
            switch (ext)
            {
                case ".html": return "text/html; charset=utf-8";
                case ".js":
                case ".mjs": return "application/javascript; charset=utf-8";
                case ".css": return "text/css; charset=utf-8";
                case ".png": return "image/png";
                case ".jpg":
                case ".jpeg": return "image/jpeg";
                case ".svg": return "image/svg+xml";
                case ".ico": return "image/x-icon";
                case ".json": return "application/json";
                case ".ttf": return "font/ttf";
                case ".woff": return "font/woff";
                case ".woff2": return "font/woff2";
                default: return "application/octet-stream";
            }
        }

        private static string GetEdgePath()
        {
            string p1 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Microsoft", "Edge", "Application", "msedge.exe");
            if (File.Exists(p1)) return p1;

            string p2 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Microsoft", "Edge", "Application", "msedge.exe");
            if (File.Exists(p2)) return p2;

            return null;
        }
    }
}
