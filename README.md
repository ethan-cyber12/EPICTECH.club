# EPIC TECH LLC GitHub Pages Launch Site

Static multi-page launch site for EPIC TECH LLC.

## Deploy to GitHub Pages
1. Create or open your GitHub repository.
2. Upload all files in this folder to the repository root.
3. In GitHub: Settings > Pages > Deploy from branch > main > root.
4. Set custom domain to `epictech.club`.
5. Keep the included `CNAME` file in the repository root.
6. In Cloudflare, point DNS to GitHub Pages and create the www redirect.

## Replace before launch
- `info@epictech.club` in `assets/js/main.js`
- Placeholder proof PDFs/images in `assets/docs` and `assets/img`
- Privacy policy with lawyer-reviewed language
- Pricing if your costs/hardware change

## Security choices
- Static site only: no database or CMS attack surface.
- Conservative CSP meta tag on every page.
- No third-party scripts or trackers.
- Contact form uses mailto instead of storing user input.
