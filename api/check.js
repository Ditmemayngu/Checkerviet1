const { SCAMALYTICS_USER, SCAMALYTICS_KEY, SCAMALYTICS_HOST } = require("./config");

function getClientIp(req) {
  const forwarded = req.headers["x-vercel-forwarded-for"] || req.headers["x-forwarded-for"] || req.headers["x-real-ip"];
  if (!forwarded) return null;
  return String(forwarded).split(",")[0].trim();
}

function isLocalIp(ip) {
  if (!ip) return true;
  return ip === "::1" || ip === "127.0.0.1" || ip.startsWith("::ffff:127.") || ip.startsWith("10.") || ip.startsWith("192.168.") || /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip);
}

async function getPublicIpFallback() {
  try {
    const response = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json();
    return data.ip || null;
  } catch {
    return null;
  }
}

function pickCountry(data) {
  return (
    data?.external_datasources?.dbip?.ip_country_name ||
    data?.external_datasources?.maxmind_geolite2?.ip_country_name ||
    data?.external_datasources?.ip2proxy_lite?.ip_country_name ||
    data?.external_datasources?.ipinfo?.ip_country_name ||
    data?.external_datasources?.dbip?.ip_country_code ||
    data?.external_datasources?.maxmind_geolite2?.ip_country_code ||
    data?.external_datasources?.ip2proxy_lite?.ip_country_code ||
    data?.external_datasources?.ipinfo?.ip_country_code ||
    "N/A"
  );
}

function pickResult(data, fallbackIp) {
  const scamalytics = data?.scamalytics || {};
  return {
    ip: scamalytics.ip || fallbackIp,
    fraudScore: scamalytics.scamalytics_score ?? "N/A",
    riskScore: scamalytics.scamalytics_risk ?? "N/A",
    country: pickCountry(data),
    url: scamalytics.scamalytics_url || null,
    credits: scamalytics.credits || null,
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  try {
    const user = SCAMALYTICS_USER;
    const key = SCAMALYTICS_KEY;
    const host = SCAMALYTICS_HOST || "https://api11.scamalytics.com/v3";

    if (!user || !key || user === "PASTE_YOUR_USER_HERE" || key === "PASTE_YOUR_API_KEY_HERE") {
      return res.status(500).json({ error: "Bạn chưa điền SCAMALYTICS_USER hoặc SCAMALYTICS_KEY trong file api/config.js." });
    }

    let ip = getClientIp(req);
    if (isLocalIp(ip)) ip = await getPublicIpFallback();
    if (!ip) return res.status(400).json({ error: "Cannot detect public IP." });

    const cleanHost = host.replace(/\/$/, "");
    const apiUrl = `${cleanHost}/${encodeURIComponent(user)}/?key=${encodeURIComponent(key)}&ip=${encodeURIComponent(ip)}`;
    const response = await fetch(apiUrl, { method: "GET", cache: "no-store" });
    const text = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({ error: "Scamalytics API HTTP error.", status: response.status, detail: text });
    }

    let data;
    try { data = JSON.parse(text); }
    catch { return res.status(502).json({ error: "Scamalytics did not return valid JSON.", detail: text }); }

    if (data?.scamalytics?.status === "error") {
      return res.status(400).json({ error: "Scamalytics API returned error.", detail: data.scamalytics.error || data.scamalytics });
    }

    return res.status(200).json(pickResult(data, ip));
  } catch (error) {
    return res.status(500).json({ error: "Internal server error.", detail: error.message || "Unknown error" });
  }
};
