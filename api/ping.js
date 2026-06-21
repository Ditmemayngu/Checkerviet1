module.exports = function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(200).json({ ok: true, message: "API route is working." });
};
