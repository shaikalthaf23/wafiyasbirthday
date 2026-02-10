# happy-birthday
Happy Birthday Website made using Html, css and JavaScript

This fork contains customizations for Wafiya's birthday and instructions to deploy the site to Vercel with the custom domain `wafiyasbirthday.com`.

Quick local checks

- Serve locally (recommended) with a simple HTTP server. From the project root run:

```powershell
# using Node's http-server (install if needed)
npm install -g http-server
http-server -c-1
# or with Python 3
python -m http.server 7070
```

Vercel deployment (recommended)

Option A — Deploy via Vercel CLI (fast, from your machine):

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Log in:

```bash
vercel login
```

3. From the project root run (first deploy interactively):

```bash
vercel
```

4. To publish the production deployment:

```bash
vercel --prod
```

5. Add your custom domain:

```bash
vercel domains add wafiyasbirthday.com
```

For an apex domain (wafiyasbirthday.com) set an A record pointing to:

- 76.76.21.21

And for the `www` subdomain add a CNAME to:

- cname.vercel-dns.com

Option B — Deploy via Git (recommended for continuous deploy):

1. Initialize git and push to GitHub (example):

```bash
git init
git add .
git commit -m "Initial site"
# create a remote repo on GitHub (use the GitHub UI), then:
git remote add origin https://github.com/YOUR_USERNAME/wafiyasbirthday.git
git push -u origin main
```

2. In Vercel dashboard, "Import Project" → connect the GitHub repository → Deploy.
3. In Vercel dashboard add domain `wafiyasbirthday.com` and follow DNS instructions (A record to 76.76.21.21).

DNS notes

- After adding the A record for the apex domain and the CNAME for `www`, allow DNS propagation (may take minutes to hours).
- Vercel will automatically provision HTTPS once DNS is verified.

If you want me to perform any of these steps for you, tell me which you want me to do (I can only create local files and provide exact commands; I cannot access your GitHub account or DNS registrar). Provide access details or perform the commands I list.
