# Scamalytics Simple Vercel - API Key in File

Bản này không cần thêm Environment Variables trên Vercel.

## Bước 1: Điền API key

Mở file:

```txt
api/config.js
```

Thay 2 dòng này:

```js
SCAMALYTICS_USER: "PASTE_YOUR_USER_HERE",
SCAMALYTICS_KEY: "PASTE_YOUR_API_KEY_HERE",
```

bằng user và key thật của bạn.

Nếu tài khoản Scamalytics của bạn là US node, giữ:

```js
SCAMALYTICS_HOST: "https://api11.scamalytics.com/v3",
```

Nếu là EU node, đổi thành:

```js
SCAMALYTICS_HOST: "https://api12.scamalytics.com/v3",
```

## Bước 2: Upload GitHub

Repo phải thấy các file này ngay ở ngoài cùng:

```txt
index.html
style.css
script.js
api
package.json
vercel.json
```

Quan trọng: nếu API key nằm trong `api/config.js`, hãy để GitHub repo là PRIVATE.

## Bước 3: Deploy Vercel

Settings:

```txt
Framework Preset: Other
Build Command: để trống
Output Directory: để trống
Install Command: để trống
Root Directory: folder chứa index.html và api
```

## Test

Mở:

```txt
https://your-project.vercel.app/api/ping
```

Nó phải hiện:

```json
{"ok":true,"message":"API route is working."}
```
